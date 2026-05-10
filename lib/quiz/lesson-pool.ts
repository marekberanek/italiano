import curatedVocabFallback from "@/assets/data/curated-vocab.json";
import monthsFallback from "@/assets/data/months.json";
import numbersFallback from "@/assets/data/numbers.json";
import weekdaysFallback from "@/assets/data/weekdays.json";
import type {
  CuratedVocabData,
  MonthsData,
  NumbersData,
  WeekdaysData,
} from "@/assets/data/types";
import { czechNumberWords } from "@/lib/quiz/czech-number-words";
import { italianToCzechPron } from "@/lib/pronunciation/italian-pron";

import type { QuizCard } from "./types";

const norm = (s: string) => s.trim().toLowerCase();

/** Slugifies an italian phrase for use in `uid` (a-z 0-9 + dashes). */
function slug(s: string): string {
  return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeUid(category: string, it: string): string {
  return `lesson-${slug(category)}-${slug(it)}`;
}

export type LessonPoolInput = {
  curated?: CuratedVocabData;
  weekdays?: WeekdaysData;
  months?: MonthsData;
  numbers?: NumbersData;
};

/**
 * Builds the static lesson pool used by the quiz when the user picks
 * "Lekce" or "Vše" as the source. Items from richer sources (with hand-tuned
 * `p`) win when the same italian phrase appears in multiple files.
 *
 * Layering order (first wins):
 *   weekdays.json → months.json → numbers.json (digits as cz)
 *     → curated-vocab.json (heuristic pronunciation)
 */
export function buildLessonPool(input?: LessonPoolInput): QuizCard[] {
  const c = input?.curated ?? (curatedVocabFallback as CuratedVocabData);
  const w = input?.weekdays ?? (weekdaysFallback as WeekdaysData);
  const m = input?.months ?? (monthsFallback as MonthsData);
  const n = input?.numbers ?? (numbersFallback as NumbersData);

  const cards: QuizCard[] = [];
  const seen = new Set<string>();

  for (const d of w.days) {
    const key = norm(d.it);
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({
      uid: makeUid("den", d.it),
      source: "lesson",
      it: d.it,
      cz: d.cz,
      p: d.p,
      category: "den",
    });
  }

  for (const mo of m.months) {
    const key = norm(mo.it);
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({
      uid: makeUid("měsíc", mo.it),
      source: "lesson",
      it: mo.it,
      cz: mo.cz,
      p: mo.p,
      category: "měsíc",
    });
  }

  // Numbers: italian word ↔ digit string. Distractors will be other digits,
  // which keeps the MCQ readable (e.g. "cinque" → "5" / "3" / "8" / "2").
  // We also accept the Czech word form ("sedmnáct" for 17) in typed mode.
  for (const row of n.list) {
    const [num, name, p] = row;
    const key = norm(name);
    if (seen.has(key)) continue;
    seen.add(key);
    const words = czechNumberWords(num);
    cards.push({
      uid: makeUid("číslo", name),
      source: "lesson",
      it: name,
      cz: String(num),
      p,
      category: "číslo",
      acceptedCz: words.length > 0 ? [String(num), ...words] : undefined,
    });
  }

  for (const row of n.composition) {
    const [num, name, p] = row;
    const key = norm(name);
    if (seen.has(key)) continue;
    seen.add(key);
    const words = czechNumberWords(num);
    cards.push({
      uid: makeUid("číslo", name),
      source: "lesson",
      it: name,
      cz: String(num),
      p,
      category: "číslo",
      acceptedCz: words.length > 0 ? [String(num), ...words] : undefined,
    });
  }

  for (const item of c.items) {
    const key = norm(item.it);
    if (seen.has(key)) continue;
    seen.add(key);
    const tag = (item.tags && item.tags[0]) || "ostatní";
    cards.push({
      uid: makeUid(tag, item.it),
      source: "lesson",
      it: item.it,
      cz: item.cz,
      p: italianToCzechPron(item.it),
      category: tag,
    });
  }

  return cards;
}
