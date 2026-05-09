import { useCallback, useEffect, useMemo, useState } from "react";

import type { VocabState, VocabWord } from "@/assets/data/types";
import { getSupabase } from "@/lib/auth/supabase";
import { enqueueDeletion } from "@/lib/storage/vocab-deletions";
import { subscribeVocabExternalChange } from "@/lib/storage/vocab-events";
import { loadVocabState, saveVocabState } from "@/lib/storage/vocab-store";
import { bumpWordUpdatedAt, pushVocabToRemote } from "@/lib/sync/vocab-sync";
import { randomUuid } from "@/lib/uuid";

export type AddWordInput = {
  it: string;
  cz: string;
  p?: string;
};

const LEARNED_THRESHOLD = 3;
const PUSH_DEBOUNCE_MS = 2000;

export function useVocabStore() {
  const [state, setState] = useState<VocabState>({ vocab: [], nextId: 1 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadVocabState().then((loaded) => {
      if (!cancelled) {
        setState(loaded);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeVocabExternalChange(() => {
      void loadVocabState().then((loaded) => setState(loaded));
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      void (async () => {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        await pushVocabToRemote(supabase, state);
      })();
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, hydrated]);

  useEffect(() => {
    if (hydrated) saveVocabState(state);
  }, [state, hydrated]);

  const addWord = useCallback((input: AddWordInput) => {
    const it = input.it.trim();
    const cz = input.cz.trim();
    if (!it || !cz) return;
    setState((prev) => {
      const word: VocabWord = {
        id: prev.nextId,
        clientUuid: randomUuid(),
        it,
        cz,
        p: input.p?.trim() ?? "",
        learned: false,
        streak: 0,
        updatedAt: new Date().toISOString(),
      };
      return { vocab: [word, ...prev.vocab], nextId: prev.nextId + 1 };
    });
  }, []);

  const removeWord = useCallback((id: number) => {
    setState((prev) => {
      const target = prev.vocab.find((w) => w.id === id);
      if (target) void enqueueDeletion(target.clientUuid);
      return { ...prev, vocab: prev.vocab.filter((w) => w.id !== id) };
    });
  }, []);

  const recordAnswer = useCallback((id: number, correct: boolean) => {
    setState((prev) => ({
      ...prev,
      vocab: prev.vocab.map((w) => {
        if (w.id !== id) return w;
        const nextStreak = correct ? w.streak + 1 : 0;
        return bumpWordUpdatedAt({
          ...w,
          streak: nextStreak,
          learned: nextStreak >= LEARNED_THRESHOLD,
        });
      }),
    }));
  }, []);

  const stats = useMemo(() => {
    const total = state.vocab.length;
    const learned = state.vocab.filter((w) => w.learned).length;
    return { total, learned, remaining: total - learned };
  }, [state.vocab]);

  const drawCard = useCallback((excludeId?: number) => {
    const pool = state.vocab.filter((w) => !w.learned && w.id !== excludeId);
    const fallback = state.vocab.filter((w) => w.id !== excludeId);
    const source = pool.length > 0 ? pool : fallback;
    if (source.length === 0) return null;
    return source[Math.floor(Math.random() * source.length)];
  }, [state.vocab]);

  return {
    state,
    hydrated,
    addWord,
    removeWord,
    recordAnswer,
    drawCard,
    stats,
    learnedThreshold: LEARNED_THRESHOLD,
  };
}
