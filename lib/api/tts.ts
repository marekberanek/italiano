import { Platform } from "react-native";

import { getAccessToken } from "@/lib/auth/supabase";
import { getWebApiOrigin } from "@/lib/api/vercel-origin";

const MAX_TTS_CHARS = 500;

function resolveTtsEndpoint(): string | null {
  const webOrigin = getWebApiOrigin();
  if (webOrigin) return `${webOrigin}/api/tts`;
  const raw = process.env.EXPO_PUBLIC_TRANSLATE_ENDPOINT?.trim();
  if (!raw) return null;
  try {
    return `${new URL(raw).origin}/api/tts`;
  } catch {
    return null;
  }
}

const ENDPOINT = resolveTtsEndpoint();

export class TtsError extends Error {
  readonly disabled: boolean;

  constructor(message: string, options?: { disabled?: boolean }) {
    super(message);
    this.name = "TtsError";
    this.disabled = options?.disabled ?? false;
  }
}

/**
 * Fetches neural TTS audio (MP3) from the backend. Returns `null` when cloud
 * TTS is unavailable (no endpoint, no auth, server off) so callers can fall
 * back to on-device `expo-speech`.
 */
export async function fetchNeuralTtsAudio(text: string): Promise<Blob | null> {
  if (Platform.OS !== "web") return null;

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_TTS_CHARS || !ENDPOINT) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal,
    });

    if (response.status === 503) return null;
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("audio")) return null;

    return await response.blob();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
