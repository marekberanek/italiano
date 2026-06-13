import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { fetchNeuralTtsAudio } from "@/lib/api/tts";
import {
  primeItalianVoiceResolution,
  resolveItalianVoiceId,
} from "@/lib/tts/resolve-italian-voice";

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

const audioCache = new Map<string, string>();
let webAudio: HTMLAudioElement | null = null;

function stopWebAudio(): void {
  if (!webAudio) return;
  webAudio.pause();
  webAudio.currentTime = 0;
  webAudio = null;
}

async function playNeuralWebAudio(text: string, onDone: () => void): Promise<boolean> {
  const rewritten = ttsRewrite(text);
  let url = audioCache.get(rewritten);
  if (!url) {
    const blob = await fetchNeuralTtsAudio(rewritten);
    if (!blob) return false;
    url = URL.createObjectURL(blob);
    audioCache.set(rewritten, url);
  }

  stopWebAudio();
  const audio = new Audio(url);
  webAudio = audio;
  audio.onended = () => {
    if (webAudio === audio) webAudio = null;
    onDone();
  };
  audio.onerror = () => {
    if (webAudio === audio) webAudio = null;
    onDone();
  };
  await audio.play();
  return true;
}

export function useItalianTts(): ItalianTts {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const speakingRef = useRef(false);

  useEffect(() => {
    primeItalianVoiceResolution();
    let cancelled = false;
    void resolveItalianVoiceId().then((voiceId) => {
      if (!cancelled) setVoiceAvailable(voiceId != null);
    });
    return () => {
      cancelled = true;
      stopWebAudio();
      Speech.stop();
    };
  }, []);

  const speakLocal = useCallback(async (text: string) => {
    const rewritten = ttsRewrite(text);
    const voiceId = await resolveItalianVoiceId();
    Speech.stop();
    Speech.speak(rewritten, {
      language: LANGUAGE,
      ...(voiceId ? { voice: voiceId } : null),
      rate: 0.92,
      pitch: 1.0,
      useApplicationAudioSession: false,
      onStart: () => {
        speakingRef.current = true;
        setIsSpeaking(true);
      },
      onDone: () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      },
      onStopped: () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      },
      onError: () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      },
    });
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!text?.trim()) return;

      const run = async () => {
        stopWebAudio();
        Speech.stop();

        if (Platform.OS === "web") {
          speakingRef.current = true;
          setIsSpeaking(true);
          const played = await playNeuralWebAudio(text, () => {
            speakingRef.current = false;
            setIsSpeaking(false);
          });
          if (played) return;
          speakingRef.current = false;
          setIsSpeaking(false);
        }

        await speakLocal(text);
      };

      void run();
    },
    [speakLocal],
  );

  const stop = useCallback(() => {
    stopWebAudio();
    Speech.stop();
    speakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, voiceAvailable };
}
