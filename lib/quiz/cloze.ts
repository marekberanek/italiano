/**
 * If `example` contains the Italian lemma (case-insensitive), returns the
 * sentence with the first occurrence replaced by `___` for a cloze prompt.
 */
export function italianExampleCloze(example: string | undefined, lemma: string): string | null {
  const ex = example?.trim();
  const lem = lemma.trim();
  if (!ex || !lem) return null;
  const lowerEx = ex.toLowerCase();
  const lowerLem = lem.toLowerCase();
  const idx = lowerEx.indexOf(lowerLem);
  if (idx < 0) return null;
  return `${ex.slice(0, idx)}___${ex.slice(idx + lem.length)}`;
}
