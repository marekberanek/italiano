import { requireSupabaseUser } from "./_lib/auth";
import { AnthropicError, callClaude } from "./_lib/llm-anthropic";

type MeaningsRequest = {
  query?: string;
};

/**
 * One disambiguated sense of an ambiguous Czech / Italian word, e.g. for
 * `sušička` we want separate entries for "na prádlo" (`asciugatrice`) and
 * "na potraviny" (`essiccatore`). Returned as a list ordered from most to
 * least common so the UI can show a card-list picker.
 */
export type WordMeaning = {
  it: string;
  cz: string;
  /** Brief Czech disambiguator (1–4 words: "na prádlo", "domácí spotřebič"). */
  gloss: string;
  /** Optional short example sentence in Italian. */
  example_it?: string;
  /** Czech translation of `example_it`, if present. */
  example_cz?: string;
};

const MAX_MEANINGS = 4;

/**
 * Builds the prompt for Anthropic. We keep instructions tight and ask for a
 * single JSON object so parsing on our side is one `JSON.parse`. The model is
 * told to skip examples when it cannot produce a confident one — easier than
 * filtering hallucinations after the fact.
 */
function buildPrompt(query: string): string {
  return [
    `You are a Czech ↔ Italian dictionary. The user looked up: "${query}"`,
    "",
    `Return up to ${MAX_MEANINGS} distinct senses for this word, ordered from most to least common in everyday Czech speech. Use proper Czech (á č ď é ě í ň ó ř š ť ú ů ý ž) and Italian (à è é ì ò ù) diacritics.`,
    "",
    "Each sense object must have:",
    "- it: Italian translation (single word or short phrase, lowercase).",
    "- cz: Czech form of this sense (often the same as the query; may include disambiguating noun).",
    "- gloss: Brief Czech disambiguator, 1–4 words (e.g. \"na prádlo\", \"na potraviny\", \"domácí spotřebič\").",
    "- example_it: Short Italian example sentence (max 8 words). Omit if not confident.",
    "- example_cz: Czech translation of example_it. Omit if example_it is omitted.",
    "",
    "If the word has only one common meaning, return exactly one item. Skip rare or technical senses an A1 learner would not use.",
    "",
    "Output: a single JSON object with shape:",
    "{ \"meanings\": [ { \"it\": \"...\", \"cz\": \"...\", \"gloss\": \"...\", \"example_it\": \"...\", \"example_cz\": \"...\" } ] }",
    "",
    "Do not wrap in markdown, do not add commentary — JSON only.",
  ].join("\n");
}

const SYSTEM_PROMPT =
  "You produce concise structured JSON dictionary entries. Never include prose outside the JSON object.";

/**
 * Claude sometimes wraps JSON in ```json fences or adds a stray sentence
 * despite instructions. Strip the most common surrounding noise before parse.
 */
function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] ?? "" : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response does not contain a JSON object.");
  }
  return candidate.slice(start, end + 1);
}

function sanitiseMeaning(raw: unknown): WordMeaning | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const it = typeof r.it === "string" ? r.it.trim() : "";
  const cz = typeof r.cz === "string" ? r.cz.trim() : "";
  const gloss = typeof r.gloss === "string" ? r.gloss.trim() : "";
  if (!it || !cz || !gloss) return null;
  const example_it =
    typeof r.example_it === "string" && r.example_it.trim() ? r.example_it.trim() : undefined;
  const example_cz =
    typeof r.example_cz === "string" && r.example_cz.trim() ? r.example_cz.trim() : undefined;
  // example_cz only makes sense alongside example_it — drop a lone Czech sample.
  const examplePair =
    example_it && example_cz ? { example_it, example_cz } : example_it ? { example_it } : {};
  return { it, cz, gloss, ...examplePair };
}

function parseMeanings(text: string): WordMeaning[] {
  const json = extractJsonObject(text);
  const parsed = JSON.parse(json) as { meanings?: unknown };
  if (!parsed.meanings || !Array.isArray(parsed.meanings)) {
    throw new Error("LLM JSON missing 'meanings' array.");
  }
  const out: WordMeaning[] = [];
  for (const item of parsed.meanings) {
    const m = sanitiseMeaning(item);
    if (m) out.push(m);
    if (out.length >= MAX_MEANINGS) break;
  }
  if (out.length === 0) {
    throw new Error("LLM returned no usable meanings.");
  }
  return out;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const auth = await requireSupabaseUser(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  let body: MeaningsRequest;
  try {
    body = (await req.json()) as MeaningsRequest;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const query = body.query?.trim();
  if (!query) return json({ error: "query is required" }, 400);
  if (query.length > 100) return json({ error: "query too long (max 100 chars)" }, 400);

  let llmText: string;
  try {
    llmText = await callClaude(buildPrompt(query), { system: SYSTEM_PROMPT });
  } catch (err) {
    if (err instanceof AnthropicError && err.message.includes("not configured")) {
      // 503 = feature intentionally disabled (no key). Client hides the button.
      return json({ error: err.message }, 503);
    }
    return json({ error: (err as Error).message ?? "Anthropic call failed" }, 502);
  }

  let meanings: WordMeaning[];
  try {
    meanings = parseMeanings(llmText);
  } catch (err) {
    return json(
      { error: `LLM returned unparsable response: ${(err as Error).message}` },
      502,
    );
  }

  return json({ meanings }, 200);
}

// Edge runtime — keeps cold-starts low and we only need `fetch` to upstream.
export const config = { runtime: "edge" };
