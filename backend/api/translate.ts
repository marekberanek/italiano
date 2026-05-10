import { foldForSearch } from "./_lib/normalize";

type TranslateRequest = {
  query?: string;
};

type DeepLTranslation = { detected_source_language: string; text: string };

type DeepLResponse = {
  translations: DeepLTranslation[];
};

const FREE_HOST = "https://api-free.deepl.com";
const PRO_HOST = "https://api.deepl.com";

const callDeepL = async (
  text: string,
  target: "CS" | "IT",
  source?: "CS" | "IT",
): Promise<DeepLTranslation> => {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPL_API_KEY is not configured.");
  }
  const host = apiKey.endsWith(":fx") ? FREE_HOST : PRO_HOST;
  const body: Record<string, unknown> = { text: [text], target_lang: target };
  if (source) body.source_lang = source;
  const res = await fetch(`${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`DeepL ${res.status}`);
  }
  const data = (await res.json()) as DeepLResponse;
  const t = data.translations[0];
  if (!t) throw new Error("DeepL returned no translation.");
  return t;
};

const HAS_CZECH_DIACRITICS = /[áčďéěíňóřšťúůýž]/i;

type SmartResult = { it: string; cz: string; detected: string };

/**
 * Czech ↔ Italian lookup that survives input without diacritics.
 *
 * Why DeepL's own `detected_source_language` is not reliable here: short Czech
 * words without accents (e.g. `uzasny`, `snih`, `dum`) get mis-detected as
 * Polish, which then yields a nonsense translation. The fix is to *force* the
 * `source_lang` and use the result-vs-input comparison to figure out which
 * direction the user actually meant.
 *
 * Strategy:
 *   1) Input has CZ diacritics → certainly CZ → 1 call (CS → IT, forced).
 *   2) No diacritics → run both directions in parallel with forced
 *      `source_lang`. Whichever side **changes** the input is the real
 *      direction:
 *        - `IT→CS` changed but `CS→IT` didn't → user typed Italian (e.g.
 *          `acqua`) → return `{it: query, cz: itToCs}`.
 *        - `CS→IT` changed → user typed Czech → use that as the IT result,
 *          then back-translate IT→CS so the CZ field shows DeepL's canonical
 *          form with diacritics (`uzasny` → `fantastico` → `fantastické`,
 *          `snih` → `neve` → `sníh`).
 *        - Neither changed → fall back to CS interpretation.
 */
async function smartTranslate(query: string): Promise<SmartResult> {
  if (HAS_CZECH_DIACRITICS.test(query)) {
    const t = await callDeepL(query, "IT", "CS");
    return { it: t.text, cz: query, detected: "CS" };
  }

  const norm = foldForSearch(query);
  const [csToIt, itToCs] = await Promise.all([
    callDeepL(query, "IT", "CS"),
    callDeepL(query, "CS", "IT"),
  ]);

  const csToItChanged = foldForSearch(csToIt.text) !== norm;
  const itToCsChanged = foldForSearch(itToCs.text) !== norm;

  if (itToCsChanged && !csToItChanged) {
    return { it: query, cz: itToCs.text, detected: "IT" };
  }

  if (csToItChanged) {
    const back = await callDeepL(csToIt.text, "CS", "IT");
    return { it: csToIt.text, cz: back.text, detected: "CS" };
  }

  return { it: csToIt.text || query, cz: query, detected: "CS" };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: TranslateRequest;
  try {
    body = (await req.json()) as TranslateRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = body.query?.trim();
  if (!query) {
    return new Response(JSON.stringify({ error: "query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await smartTranslate(query);
    return new Response(
      JSON.stringify({
        it: result.it,
        cz: result.cz,
        p: "",
        ex_it: undefined,
        ex_cz: undefined,
        detected: result.detected,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const config = { runtime: "edge" };
