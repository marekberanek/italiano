import * as Speech from "expo-speech";
import { useCallback, useEffect, useState } from "react";

export type ItalianTts = {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  voiceAvailable: boolean;
};

const LANGUAGE = "it-IT";

/**
 * iOS `AVSpeechSynthesizer` reads single-character / very short tokens as the
 * NAME of the letter (e.g. `è` → "e accento grave"). For accented vowels we
 * substitute a phonetic spelling that the Italian voice pronounces as the
 * intended sound. Only triggered when the *whole trimmed input* matches a
 * key, so multi-word phrases that happen to contain `è` are unaffected.
 */
const SHORT_TOKEN_PHONETIC: Record<string, string> = {
  è: "eh",
  é: "eh",
  à: "ah",
  ì: "ee",
  ò: "oh",
  ù: "oo",
};

function ttsRewrite(text: string): string {
  const trimmed = text.trim();
  const phonetic = SHORT_TOKEN_PHONETIC[trimmed.toLowerCase()];
  return phonetic ?? text;
}

export function useItalianTts(): ItalianTts {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        if (cancelled) return;
        setVoiceAvailable(voices.some((v) => v.language?.toLowerCase().startsWith("it")));
      })
      .catch(() => {
        if (!cancelled) setVoiceAvailable(true);
      });
    return () => {
      cancelled = true;
      Speech.stop();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text?.trim()) return;
    Speech.stop();
    Speech.speak(ttsRewrite(text), {
      language: LANGUAGE,
      rate: 0.9,
      pitch: 1.0,
      // iOS-only: by default `AVSpeechSynthesizer` uses the app's audio session
      // which is `.soloAmbient` (silenced by the physical Ring/Silent switch).
      // Setting this to false lets the synthesizer use its own `.playback`
      // session so TTS plays even when the phone is muted.
      useApplicationAudioSession: false,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, voiceAvailable };
}
