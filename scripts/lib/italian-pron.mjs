/**
 * Italian → Czech-friendly phonetic transcription.
 * Output uses Czech graphemes so a Czech learner can read it directly.
 * It is approximate (no open/closed e/o, no stress marks, single affricate
 * even where Italian geminates) but consistent and good enough for beginners.
 *
 * Returned without surrounding brackets — wrap with `[…]` at the call site.
 */
export function italianToCzechPron(input) {
  if (!input) return "";
  let s = String(input).toLowerCase().trim();

  // 1) Soft "sc" + e/i  →  š ; "sch" + e/i  →  sk
  s = s.replace(/scia/g, "ša");
  s = s.replace(/scio/g, "šo");
  s = s.replace(/sciu/g, "šu");
  s = s.replace(/sce/g, "še");
  s = s.replace(/sci/g, "ši");
  s = s.replace(/sche/g, "ske");
  s = s.replace(/schi/g, "ski");

  // 2) Soft "c" + e/i (incl. silent "i" before a/o/u) → č ; "ch" + e/i → k
  s = s.replace(/ccia/g, "ča");
  s = s.replace(/ccio/g, "čo");
  s = s.replace(/cciu/g, "ču");
  s = s.replace(/cce/g, "če");
  s = s.replace(/cci/g, "či");
  s = s.replace(/cia/g, "ča");
  s = s.replace(/cio/g, "čo");
  s = s.replace(/ciu/g, "ču");
  s = s.replace(/ce/g, "če");
  s = s.replace(/ci/g, "či");
  s = s.replace(/che/g, "ke");
  s = s.replace(/chi/g, "ki");

  // 3) "gli" palatal cluster (before all vowels and standalone) → lj
  s = s.replace(/glia/g, "lja");
  s = s.replace(/glie/g, "lje");
  s = s.replace(/glio/g, "ljo");
  s = s.replace(/gliu/g, "lju");
  s = s.replace(/gli/g, "lji");

  // 4) "gn" → ň
  s = s.replace(/gn/g, "ň");

  // 5) Soft "g" + e/i → dž ; "gh" + e/i → g
  s = s.replace(/ggia/g, "dža");
  s = s.replace(/ggio/g, "džo");
  s = s.replace(/ggiu/g, "džu");
  s = s.replace(/gge/g, "dže");
  s = s.replace(/ggi/g, "dži");
  s = s.replace(/gia/g, "dža");
  s = s.replace(/gio/g, "džo");
  s = s.replace(/giu/g, "džu");
  s = s.replace(/ge/g, "dže");
  s = s.replace(/gi/g, "dži");
  s = s.replace(/ghe/g, "ge");
  s = s.replace(/ghi/g, "gi");

  // 6) "qu" → kv
  s = s.replace(/qu/g, "kv");

  // 7) Remaining hard c → k, silent h, default z → c, y → j
  s = s.replace(/c/g, "k");
  s = s.replace(/h/g, "");
  s = s.replace(/z/g, "c");
  s = s.replace(/y/g, "j");

  // 8) Italian glide "i" before a vowel → "j" (gennaio → džennajo, siamo → sjamo).
  //    Triggers after consonant or after vowel; never at the very start of a word
  //    (so the pronoun "io" stays [io], not [jo]).
  s = s.replace(/([bcdfghjklmnpqrstvwxzčďňřšťž])i([aeou])/g, "$1j$2");
  s = s.replace(/([aeou])i([aeou])/g, "$1j$2");

  // 9) Accented vowels → Czech "long" markers. Italian uses accent only on
  //    a stressed vowel (typically word-final), so mapping to á/é/í/ó/ú lets a
  //    Czech reader hear the stress naturally. Open vs closed e/o is ignored.
  s = s.replace(/[àá]/g, "á");
  s = s.replace(/[èé]/g, "é");
  s = s.replace(/[ìí]/g, "í");
  s = s.replace(/[òó]/g, "ó");
  s = s.replace(/[ùú]/g, "ú");

  return s;
}

/** Wrap a transcription in square brackets, e.g. "kvattro" → "[kvattro]". */
export function bracket(pron) {
  if (!pron) return "";
  return `[${pron}]`;
}
