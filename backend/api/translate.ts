import { requireSupabaseUser } from "./_lib/auth";
import { foldForSearch } from "./_lib/normalize";
import { spellDigitsInPair } from "./_lib/spell-digits";

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

/**
 * Aligns the first letter of `output` with the casing of `input`. DeepL treats
 * a one-word translation as a sentence start and capitalises it, which is
 * wrong for dictionary lookups (`večeře` → `Cena`). For lowercase inputs we
 * lowercase the result; for uppercase inputs we uppercase it (so proper-noun
 * lookups like `Praha` → `Praga` still work).
 */
function matchFirstLetterCase(input: string, output: string): string {
  const inMatch = input.match(/^\s*(\S)/);
  const outMatch = output.match(/^(\s*)(\S)([\s\S]*)$/);
  if (!inMatch || !outMatch) return output;
  const firstIn = inMatch[1]!;
  const leading = outMatch[1]!;
  const firstOut = outMatch[2]!;
  const rest = outMatch[3]!;
  const inIsLower = firstIn === firstIn.toLowerCase() && firstIn !== firstIn.toUpperCase();
  const inIsUpper = firstIn === firstIn.toUpperCase() && firstIn !== firstIn.toLowerCase();
  if (inIsLower && firstOut !== firstOut.toLowerCase()) {
    return leading + firstOut.toLowerCase() + rest;
  }
  if (inIsUpper && firstOut !== firstOut.toUpperCase()) {
    return leading + firstOut.toUpperCase() + rest;
  }
  return output;
}

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
    return { it: matchFirstLetterCase(query, t.text), cz: query, detected: "CS" };
  }

  const norm = foldForSearch(query);
  const [csToIt, itToCs] = await Promise.all([
    callDeepL(query, "IT", "CS"),
    callDeepL(query, "CS", "IT"),
  ]);

  const csToItChanged = foldForSearch(csToIt.text) !== norm;
  const itToCsChanged = foldForSearch(itToCs.text) !== norm;

  if (itToCsChanged && !csToItChanged) {
    return {
      it: query,
      cz: matchFirstLetterCase(query, itToCs.text),
      detected: "IT",
    };
  }

  if (csToItChanged) {
    const back = await callDeepL(csToIt.text, "CS", "IT");
    return {
      it: matchFirstLetterCase(query, csToIt.text),
      // Back-translation should mirror the canonical Czech form; align it to the
      // user's original query so a lowercase input keeps the lowercase output.
      cz: matchFirstLetterCase(query, back.text),
      detected: "CS",
    };
  }

  return {
    it: matchFirstLetterCase(query, csToIt.text || query),
    cz: query,
    detected: "CS",
  };
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

  // Auth gate: DeepL costs money per character — only signed-in users get a
  // translation. Anonymous callers receive 401 and the mobile app surfaces a
  // "sign in to use search" message.
  const auth = await requireSupabaseUser(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  let body: TranslateRequest;
  try {
    body = (await req.json()) as TranslateRequest;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const query = body.query?.trim();
  if (!query) {
    return json({ error: "query is required" }, 400);
  }

  try {
    const result = await smartTranslate(query);
    const spelled = spellDigitsInPair(result.it, result.cz);
    return json(
      {
        it: spelled.it,
        cz: spelled.cz,
        p: "",
        ex_it: undefined,
        ex_cz: undefined,
        detected: result.detected,
      },
      200,
    );
  } catch (err) {
    return json({ error: (err as Error).message ?? "Unknown error" }, 502);
  }
}

// Edge runtime: Supabase JS SDK uses `fetch` under the hood, which is the
// only thing this endpoint relies on. Edge gives us lower latency + zero
// cold-start vs. Node, and avoids the ESM/CJS interop issue Vercel's Node
// runtime has when there's no `"type": "module"` in `backend/package.json`.
export const config = { runtime: "edge" };
