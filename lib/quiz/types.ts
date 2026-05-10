/**
 * Unified card shape used by the quiz screen. The screen draws cards from a
 * pool that may mix items from the user's personal vocab and from the static
 * lesson content (numbers, days, months, curated phrases…).
 *
 * - `personal` cards drive the long-term "learned" tracking via the vocab
 *   store (streaks, learned threshold).
 * - `lesson` cards are stateless — they only contribute to the round score.
 */
export type QuizCardSource = "personal" | "lesson";

export type QuizCard = {
  /** Stable id across renders. `personal-<uuid>` or `lesson-<category>-<slug>`. */
  uid: string;
  source: QuizCardSource;
  /** Numeric id from the vocab store; only set when `source === "personal"`. */
  personalId?: number;
  it: string;
  cz: string;
  p?: string;
  exIt?: string;
  exCz?: string;
  /**
   * Extra accepted answer variants for the typed-input mode (in addition to
   * `cz` / `it`). Useful e.g. for numbers, where we want to accept both the
   * digit ("17") and the Czech word ("sedmnáct").
   */
  acceptedCz?: string[];
  acceptedIt?: string[];
  /** Free-text label of the card's bucket (e.g. "den", "číslo"). Used in UI hints. */
  category?: string;
};
