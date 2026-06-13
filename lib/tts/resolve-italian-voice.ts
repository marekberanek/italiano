import * as Speech from "expo-speech";

const LANGUAGE_PREFIX = "it";

/**
 * Names that signal a higher-quality / neural voice across platforms. The OS
 * default for `it-IT` is usually the most robotic "compact" voice.
 */
const PREFERRED_VOICE_HINTS = [
  "natural",
  "neural",
  "premium",
  "enhanced",
  "online",
  "wavenet",
  "google",
  "microsoft",
  "siri",
  "paola",
  "alice",
  "luca",
  "giorgio",
  "elena",
  "federica",
  "isabella",
  "elsa",
  "flavia",
];

const AVOID_VOICE_HINTS = ["compact", "low", "espeak", "samantha"];

function scoreVoice(voice: Speech.Voice): number {
  let score = 0;
  if (voice.quality === Speech.VoiceQuality.Enhanced) score += 100;
  // Chrome/Edge cloud voices (`localService: false`) sound much more natural.
  const localService = (voice as Speech.Voice & { localService?: boolean }).localService;
  if (localService === false) score += 80;
  const name = voice.name?.toLowerCase() ?? "";
  PREFERRED_VOICE_HINTS.forEach((hint, index) => {
    if (name.includes(hint)) score += PREFERRED_VOICE_HINTS.length - index;
  });
  AVOID_VOICE_HINTS.forEach((hint) => {
    if (name.includes(hint)) score -= 40;
  });
  if (voice.language?.toLowerCase() === "it-it") score += 4;
  if (voice.language?.toLowerCase().startsWith(LANGUAGE_PREFIX)) score += 2;
  return score;
}

export function pickBestItalianVoice(voices: Speech.Voice[]): Speech.Voice | null {
  const italian = voices.filter((v) => v.language?.toLowerCase().startsWith(LANGUAGE_PREFIX));
  if (italian.length === 0) return null;
  return italian
    .map((voice) => ({ voice, score: scoreVoice(voice) }))
    .sort((a, b) => b.score - a.score)[0].voice;
}

let resolvePromise: Promise<string | null> | null = null;

/** Resolves once per app session; re-runs if the first call returned no voice. */
export async function resolveItalianVoiceId(): Promise<string | null> {
  if (!resolvePromise) {
    resolvePromise = Speech.getAvailableVoicesAsync()
      .then((voices) => pickBestItalianVoice(voices)?.identifier ?? null)
      .catch(() => null);
  }
  const voiceId = await resolvePromise;
  if (!voiceId) {
    resolvePromise = null;
  }
  return voiceId;
}

export function primeItalianVoiceResolution(): void {
  void resolveItalianVoiceId();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const handler = () => {
      resolvePromise = null;
      void resolveItalianVoiceId();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
  }
}
