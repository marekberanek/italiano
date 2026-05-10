/**
 * Quiz scoring & session-length constants.
 *
 * The quiz screen is intentionally a *fixed-length* round: every session asks
 * the same number of questions so the user has a clear start/finish and can
 * compare results across attempts. Long-term "word is learned" tracking
 * (see `learnedThreshold` on the vocab store) is independent of this — the
 * round just exercises whatever cards `start()` snapshots into the session.
 */
export const QUIZ_LENGTH = 10;

/** Minimum success ratio (inclusive). Anything below is "try again". */
export const QUIZ_PASS_PERCENT = 60;

export type QuizStars = 0 | 1 | 2 | 3;

/**
 * Star rating for the final score:
 *   0 ★   →   0–59 %  (under the pass threshold)
 *   1 ★   →  60–74 %
 *   2 ★★  →  75–89 %
 *   3 ★★★ →  90–100 %
 */
export function quizStars(percent: number): QuizStars {
  if (percent >= 90) return 3;
  if (percent >= 75) return 2;
  if (percent >= QUIZ_PASS_PERCENT) return 1;
  return 0;
}

export type QuizVerdict = {
  title: string;
  subtitle: string;
  passed: boolean;
};

export function quizVerdict(percent: number): QuizVerdict {
  if (percent >= 90)
    return {
      title: "Mistrovský výkon!",
      subtitle: "Skoro bez chyby — bravissimo!",
      passed: true,
    };
  if (percent >= 75)
    return {
      title: "Skvěle zvládnuto",
      subtitle: "Slušná shoda. Tak dál!",
      passed: true,
    };
  if (percent >= QUIZ_PASS_PERCENT)
    return {
      title: "Splněno",
      subtitle: "Hranici úspěchu jsi pokořil.",
      passed: true,
    };
  return {
    title: "Zkus to znovu",
    subtitle: `Pro úspěch potřebuješ aspoň ${QUIZ_PASS_PERCENT} %.`,
    passed: false,
  };
}
