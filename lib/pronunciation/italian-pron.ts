/**
 * Heuristic Italian → Czech-style phonetic transcription.
 *
 * Italian spelling is almost phonetic, so a small ordered set of digraph /
 * letter substitutions covers the vast majority of cases. Output mirrors the
 * style used in the rest of the app (`[čao]`, `[buondžorno]`, `[gracje]`).
 *
 * Rules (in order — longest digraphs first):
 *   sci + a/o/u → š (scia → ša),  sce → še,  sci → ši
 *   gli + vowel → lj (figlio → filjo),       gli alone → lji
 *   gn → ň         ch → k         gh → g         qu → kv
 *   ci + a/o/u → č (ciao → čao)
 *   ce → če        ci → či        c → k
 *   gi + a/o/u → dž (giorno → džorno)
 *   ge → dže       gi → dži       g → g
 *   i + vowel → j + vowel (grazie → grazje)   z → c     h → silent
 *
 * It is intentionally simple — for edge cases the user can edit the field
 * manually after the lookup result is shown.
 */
export function italianToCzechPron(text: string): string {
  if (!text || !text.trim()) return "";
  const words = text
    .trim()
    .split(/\s+/u)
    .map(transcribeWord)
    .filter(Boolean);
  if (words.length === 0) return "";
  return `[${words.join(" ")}]`;
}

function transcribeWord(raw: string): string {
  let s = raw.toLowerCase();

  // Strip Italian stress accents (è, à, ò, ù, é, ó, í) so they don't break the
  // pattern matches below; the transcription doesn't try to mark stress.
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Order is critical — longer / more specific patterns must run first.
  s = s.replace(/sci([aou])/g, "š$1");
  s = s.replace(/sce/g, "še");
  s = s.replace(/sci/g, "ši");

  s = s.replace(/gli([aeou])/g, "lj$1");
  s = s.replace(/gli/g, "lji");
  s = s.replace(/gn/g, "ň");

  s = s.replace(/ch/g, "k");
  s = s.replace(/gh/g, "g");
  s = s.replace(/qu/g, "kv");

  s = s.replace(/ci([aou])/g, "č$1");
  s = s.replace(/ce/g, "če");
  s = s.replace(/ci/g, "či");
  s = s.replace(/c/g, "k");

  s = s.replace(/gi([aou])/g, "dž$1");
  s = s.replace(/ge/g, "dže");
  s = s.replace(/gi/g, "dži");

  s = s.replace(/i([aeou])/g, "j$1");
  s = s.replace(/z/g, "c");
  s = s.replace(/h/g, "");

  return s;
}
