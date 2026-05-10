import AsyncStorage from "@react-native-async-storage/async-storage";

import { randomUuid } from "@/lib/uuid";

const STORAGE_KEY = "italiano.quiz.history.v1";
const MAX_ENTRIES = 30;

export type QuizHistoryStyle = "flashcard" | "mixed" | "mcq" | "typed";
export type QuizHistoryDirection = "it-cz" | "cz-it";

/**
 * One question/answer pair captured during a quiz session. Persisted alongside
 * the session so the user can later review what they got right or wrong.
 */
export type QuizAnswerLog = {
  /** Stable card id (e.g. `personal-<uuid>` or `lesson-<category>-<slug>`). */
  uid: string;
  it: string;
  cz: string;
  source: "personal" | "lesson";
  /** Which prompt format produced this answer. */
  format: "flashcard" | "mcq" | "typed";
  /** Whether the user marked / chose / typed the right answer. */
  correct: boolean;
  /**
   * What the user picked (MCQ option label) or typed (free text). Empty for
   * flashcard mode where the user just self-rates the card.
   */
  given?: string;
};

export type QuizHistoryEntry = {
  id: string;
  /** ISO 8601 of session start. */
  startedAt: string;
  durationMs: number;
  style: QuizHistoryStyle;
  direction: QuizHistoryDirection;
  /** Total questions answered (may be 0 if user closed the screen immediately). */
  questions: number;
  correct: number;
  /** Words crossing the `learned` threshold during this session. */
  wordsLearned: number;
  /** Star rating (0–3) computed from accuracy. Optional for backward compatibility. */
  stars?: 0 | 1 | 2 | 3;
  /** Pool the round drew from. Optional for backward compatibility. */
  source?: "personal" | "lesson" | "all";
  /** Per-question log. Optional for backward compatibility (entries saved before this feature). */
  answers?: QuizAnswerLog[];
};

export async function loadQuizHistory(): Promise<QuizHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is QuizHistoryEntry => !!e && typeof e.id === "string");
  } catch {
    return [];
  }
}

export async function appendQuizHistoryEntry(
  entry: Omit<QuizHistoryEntry, "id">,
): Promise<QuizHistoryEntry | null> {
  if (entry.questions <= 0) return null; // ignore empty/aborted sessions
  try {
    const existing = await loadQuizHistory();
    const next: QuizHistoryEntry = { id: randomUuid(), ...entry };
    const trimmed = [next, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return next;
  } catch {
    return null;
  }
}

export async function clearQuizHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Removes a single entry by id. Returns the updated history list. */
export async function removeQuizHistoryEntry(id: string): Promise<QuizHistoryEntry[]> {
  try {
    const existing = await loadQuizHistory();
    const next = existing.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}
