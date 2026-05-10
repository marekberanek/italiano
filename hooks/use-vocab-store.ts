import { useCallback, useEffect, useMemo, useState } from "react";

import type { VocabState, VocabWord } from "@/assets/data/types";
import { getSupabase } from "@/lib/auth/supabase";
import { italianToCzechPron } from "@/lib/pronunciation/italian-pron";
import { enqueueDeletion } from "@/lib/storage/vocab-deletions";
import {
  emitVocabExternalChange,
  subscribeVocabExternalChange,
} from "@/lib/storage/vocab-events";
import { loadVocabState, saveVocabState } from "@/lib/storage/vocab-store";
import { bumpWordUpdatedAt, pushVocabToRemote } from "@/lib/sync/vocab-sync";
import { randomUuid } from "@/lib/uuid";

export type AddWordInput = {
  it: string;
  cz: string;
  p?: string;
  exIt?: string;
  exCz?: string;
};

const LEARNED_THRESHOLD = 5;
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
      void loadVocabState().then((loaded) => {
        // Skip update if storage matches current state — this is most likely
        // *our own* write coming back via the cross-screen broadcast and would
        // otherwise trigger an infinite save → emit → load loop.
        setState((prev) =>
          JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded,
        );
      });
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
        const push = await pushVocabToRemote(supabase, state);
        if (!push.ok) {
          console.warn("pushVocabToRemote", push.error ?? "failed");
        }
      })();
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    // Persist, then notify other instances of the hook (e.g. Hledat → Slovíčka)
    // so they reload from storage and re-render with the new data.
    void saveVocabState(state).then(() => emitVocabExternalChange());
  }, [state, hydrated]);

  const addWord = useCallback((input: AddWordInput) => {
    const it = input.it.trim();
    const cz = input.cz.trim();
    if (!it || !cz) return;
    const explicit = input.p?.trim() ?? "";
    const p = explicit || italianToCzechPron(it);
    const exIt = input.exIt?.trim();
    const exCz = input.exCz?.trim();
    const itKey = it.toLowerCase();
    setState((prev) => {
      // Last-line-of-defense duplicate guard. UI also disables the button when
      // the word is already there, but other call sites (quiz "Add to vocab",
      // future imports) shouldn't be able to push duplicates either.
      if (prev.vocab.some((w) => w.it.trim().toLowerCase() === itKey)) return prev;
      const word: VocabWord = {
        id: prev.nextId,
        clientUuid: randomUuid(),
        it,
        cz,
        p,
        ...(exIt ? { exIt } : {}),
        ...(exCz ? { exCz } : {}),
        learned: false,
        streak: 0,
        updatedAt: new Date().toISOString(),
      };
      return { vocab: [word, ...prev.vocab], nextId: prev.nextId + 1 };
    });
  }, []);

  const hasItalian = useCallback(
    (word: string) => {
      const key = word.trim().toLowerCase();
      if (!key) return false;
      return state.vocab.some((w) => w.it.trim().toLowerCase() === key);
    },
    [state.vocab],
  );

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

  return {
    state,
    hydrated,
    addWord,
    hasItalian,
    removeWord,
    recordAnswer,
    stats,
    learnedThreshold: LEARNED_THRESHOLD,
  };
}
