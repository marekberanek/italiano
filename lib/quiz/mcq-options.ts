function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type McqDirection = "it-cz" | "cz-it";

/**
 * Minimal shape consumed by `buildMcqOptions` — anything with a stable id and
 * the two sides works. Optional `category` lets us prefer thematically
 * matching distractors (e.g. day → other days, number → other numbers).
 */
export type McqPoolItem = { uid: string; it: string; cz: string; category?: string };

/**
 * Builds 2–4 unique options (always includes the correct answer). When the
 * pool is too small, returns fewer than 4 options — the UI must handle that.
 *
 * Distractor preference order:
 *   1. items from the same `category` as the card,
 *   2. then anything else from the pool.
 */
export function buildMcqOptions<T extends McqPoolItem>(
  card: T,
  all: T[],
  direction: McqDirection,
  /** When true, options are Italian lemmas (fill-in cloze). Otherwise translation side. */
  italianLemmas: boolean,
): string[] {
  const sideOf = (w: T): string =>
    italianLemmas ? w.it.trim() : direction === "it-cz" ? w.cz.trim() : w.it.trim();

  const correct = sideOf(card);

  const others = all.filter((w) => w.uid !== card.uid);
  const sameCategory = card.category
    ? others.filter((w) => w.category === card.category)
    : [];
  const otherCategory = others.filter((w) => !card.category || w.category !== card.category);

  const collect = (src: T[], into: string[], seen: Set<string>) => {
    for (const w of shuffle(src)) {
      if (into.length >= 3) break;
      const s = sideOf(w);
      if (!s || s === correct) continue;
      const k = s.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      into.push(s);
    }
  };

  const seen = new Set<string>([correct.toLowerCase()]);
  const pool: string[] = [];
  collect(sameCategory, pool, seen);
  collect(otherCategory, pool, seen);

  return shuffle([correct, ...pool]);
}
