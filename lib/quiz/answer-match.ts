import { foldForSearch } from "@/lib/text/normalize";

/** Lowercase + strip combining marks (diacritics) + collapse whitespace. */
export function normalizeAnswer(s: string): string {
  return foldForSearch(s.trim());
}

/** Split Czech/Italian gloss fields on common synonym separators. */
export function acceptedAnswerVariants(answerField: string): string[] {
  const raw = answerField.trim();
  if (!raw) return [];
  const parts = raw.split(/\s*[/|,;]\s*/u).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [raw];
}

export function answerMatchesAny(userInput: string, acceptedFullField: string): boolean {
  const u = normalizeAnswer(userInput);
  if (!u) return false;
  for (const variant of acceptedAnswerVariants(acceptedFullField)) {
    if (normalizeAnswer(variant) === u) return true;
  }
  return false;
}

/**
 * Like {@link answerMatchesAny} but accepts a primary string + an optional list
 * of extra accepted variants (each may itself contain `,/;|`-separated forms).
 * Used by the quiz to accept e.g. both the digit and the Czech word for numbers.
 */
export function answerMatchesAnyOf(
  userInput: string,
  primary: string,
  extras?: string[],
): boolean {
  if (answerMatchesAny(userInput, primary)) return true;
  if (!extras || extras.length === 0) return false;
  for (const e of extras) {
    if (answerMatchesAny(userInput, e)) return true;
  }
  return false;
}
