type Listener = () => void;

const listeners: Listener[] = [];

/**
 * Subscribe to "reminder settings changed" events. Used by the
 * `useVocabReminders` hook so the scheduler can re-plan immediately after
 * the user toggles the switch / picks a different time in Profile.
 */
export function subscribeReminderSettingsChange(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitReminderSettingsChange(): void {
  for (const l of [...listeners]) l();
}
