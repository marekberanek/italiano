import { useEffect, useMemo, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useAuth } from "@/lib/auth/use-auth";
import { subscribeReminderSettingsChange } from "@/lib/notifications/reminder-events";
import {
  cancelVocabReminders,
  scheduleVocabReminders,
  type VocabReminderState,
} from "@/lib/notifications/scheduler";
import { useVocabStore } from "@/hooks/use-vocab-store";

/**
 * Plans (or cancels) local notification reminders based on the current vocab
 * + settings. Re-runs when:
 *   - vocab is hydrated for the first time
 *   - the set of clientUuids changes (add/remove word)
 *   - the user changes reminder settings in Profile
 *   - the app comes back to the foreground
 *   - the auth state changes (sign-out cancels everything; sign-in re-plans)
 *
 * Auth gate: reminder settings UI is sign-in-only (see ProfileScreen), so we
 * never *schedule* anything for anonymous users. On sign-out we cancel any
 * leftover OS-level scheduled notifications so a previously-signed-in user
 * doesn't keep getting buzzed after logging out.
 *
 * Intentionally NOT re-running on every quiz answer: streak / learned changes
 * would otherwise re-plan after every question, which is wasteful.
 */
export function useVocabReminders(): void {
  const { state, hydrated } = useVocabStore();
  const { user } = useAuth();
  const isSignedIn = !!user;

  // Stable identity hash of the vocab pool. Changes only when a word is
  // added/removed — not when streak/learned are updated by the quiz.
  const vocabSignature = useMemo(
    () =>
      state.vocab
        .map((w) => w.clientUuid)
        .sort()
        .join("|"),
    [state.vocab],
  );

  // Latest vocab snapshot kept in a ref so the AppState / settings listeners
  // always see the freshest data without re-subscribing on every change.
  const stateRef = useRef<VocabReminderState>({ vocab: state.vocab });
  useEffect(() => {
    stateRef.current = { vocab: state.vocab };
  }, [state.vocab]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isSignedIn) {
      void cancelVocabReminders();
      return;
    }
    void scheduleVocabReminders(stateRef.current);
  }, [hydrated, vocabSignature, isSignedIn]);

  useEffect(() => {
    if (!hydrated || !isSignedIn) return;
    return subscribeReminderSettingsChange(() => {
      void scheduleVocabReminders(stateRef.current);
    });
  }, [hydrated, isSignedIn]);

  useEffect(() => {
    if (!hydrated || !isSignedIn) return;
    const onChange = (next: AppStateStatus) => {
      if (next === "active") {
        void scheduleVocabReminders(stateRef.current);
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [hydrated, isSignedIn]);
}
