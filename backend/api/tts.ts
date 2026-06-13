import { requireSupabaseUser } from "./_lib/auth";

type TtsRequest = {
  text?: string;
};

const MAX_CHARS = 500;
const OPENAI_URL = "https://api.openai.com/v1/audio/speech";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const auth = await requireSupabaseUser(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TTS not configured", disabled: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: TtsRequest;
  try {
    body = (await req.json()) as TtsRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return new Response(JSON.stringify({ error: "Missing text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (text.length > MAX_CHARS) {
    return new Response(JSON.stringify({ error: `Text too long (max ${MAX_CHARS})` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const model = process.env.OPENAI_TTS_MODEL?.trim() || "tts-1-hd";
  const voice = process.env.OPENAI_TTS_VOICE?.trim() || "nova";

  const openaiRes = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: "mp3",
    }),
  });

  if (!openaiRes.ok) {
    const detail = (await openaiRes.text()).slice(0, 200);
    return new Response(JSON.stringify({ error: `OpenAI TTS ${openaiRes.status}`, detail }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const audio = await openaiRes.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}

export const config = { runtime: "edge" };
