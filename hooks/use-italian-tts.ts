import * as Speech from "expo-speech";
import { useCallback, useEffect, useState } from "react";

export type ItalianTts = {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  voiceAvailable: boolean;
};

const LANGUAGE = "it-IT";

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
    Speech.speak(text, {
      language: LANGUAGE,
      rate: 0.9,
      pitch: 1.0,
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
