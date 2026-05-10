type TranslateRequest = {
  query?: string;
};

type DeepLTranslation = { detected_source_language: string; text: string };

type DeepLResponse = {
  translations: DeepLTranslation[];
};

const FREE_HOST = "https://api-free.deepl.com";
const PRO_HOST = "https://api.deepl.com";

const callDeepL = async (text: string, target: "CS" | "IT"): Promise<DeepLTranslation> => {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPL_API_KEY is not configured.");
  }
  const host = apiKey.endsWith(":fx") ? FREE_HOST : PRO_HOST;
  const res = await fetch(`${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [text], target_lang: target }),
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
 * Decides direction from DeepL's own language detection instead of brittle
 * regex heuristics. Words like "postel", "voda", "kniha" don't have Czech
 * diacritics but are still Czech — DeepL knows that, so we ask it.
 *
 * Strategy:
 *   1) If input has Czech diacritics, it's certainly Czech → 1 call (CZ → IT).
 *   2) Otherwise try CZ → IT first. If DeepL detects the source as IT,
 *      the input was actually Italian → second call IT → CS.
 */
async function smartTranslate(query: string): Promise<SmartResult> {
  if (HAS_CZECH_DIACRITICS.test(query)) {
    const t = await callDeepL(query, "IT");
    return {
      it: t.text,
      cz: query,
      detected: t.detected_source_language?.toUpperCase() || "CS",
    };
  }

  const first = await callDeepL(query, "IT");
  const detected = first.detected_source_language?.toUpperCase() ?? "";

  if (detected === "IT") {
    const second = await callDeepL(query, "CS");
    return { it: query, cz: second.text, detected: "IT" };
  }

  return { it: first.text, cz: query, detected: detected || "CS" };
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
