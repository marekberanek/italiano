type TranslateRequest = {
  query?: string;
};

type DeepLResponse = {
  translations: { detected_source_language: string; text: string }[];
};

const FREE_HOST = "https://api-free.deepl.com";
const PRO_HOST = "https://api.deepl.com";

const callDeepL = async (text: string, target: "EN" | "CS" | "IT") => {
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
  return (await res.json()) as DeepLResponse;
};

const isLikelyCzech = (text: string) =>
  /[áčďéěíňóřšťúůýž]/i.test(text) || /[a-z]+(at|ovat|out|et|it|nout)$/i.test(text);

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

  // Pre-detect direction; DeepL would also detect on its own, but we want to
  // know whether to translate to IT or to CS.
  const targetLang = isLikelyCzech(query) ? "IT" : "CS";

  try {
    const data = await callDeepL(query, targetLang);
    const translation = data.translations[0];
    if (!translation) {
      return new Response(JSON.stringify({ error: "No translation" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const detectedSource = translation.detected_source_language?.toUpperCase();
    const targetIsItalian = targetLang === "IT";
    const it = targetIsItalian ? translation.text : query;
    const cz = targetIsItalian ? query : translation.text;

    return new Response(
      JSON.stringify({
        it,
        cz,
        p: "",
        ex_it: undefined,
        ex_cz: undefined,
        detected: detectedSource,
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
