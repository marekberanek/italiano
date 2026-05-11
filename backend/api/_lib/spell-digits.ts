/**
 * Replaces Arabic numerals in translated text with word forms (Italian / Czech).
 * Skips runs of 4+ digits (years, IDs). Only spells integers in a bounded range
 * where we have reliable forms (see italianSpell / czechSpell).
 */

const DIGIT_RUN = /\d+/g;

/** Do not spell years, PINs, or other long numeric tokens. */
const MAX_DIGITS = 3;

function applyCaseFromSample(word: string, digitSample: string): string {
  if (!word) return word;
  // Pure digit runs: always use lowercase lemmas (e.g. mid-sentence "4" →
  // "quattro"). Digits satisfy `c === c.toUpperCase()`, which must not trigger
  // title-case logic.
  if (/^\d+$/.test(digitSample)) {
    return word.toLowerCase();
  }
  if (digitSample === digitSample.toUpperCase() && digitSample !== digitSample.toLowerCase()) {
    return word.toUpperCase();
  }
  if (
    digitSample.length > 0 &&
    /[a-zA-Z]/.test(digitSample[0]!) &&
    digitSample[0] === digitSample[0]!.toUpperCase()
  ) {
    return word[0]!.toUpperCase() + word.slice(1);
  }
  return word.toLowerCase();
}

const IT_ONES = [
  "zero",
  "uno",
  "due",
  "tre",
  "quattro",
  "cinque",
  "sei",
  "sette",
  "otto",
  "nove",
];

const IT_TEENS = [
  "dieci",
  "undici",
  "dodici",
  "tredici",
  "quattordici",
  "quindici",
  "sedici",
  "diciassette",
  "diciotto",
  "diciannove",
];

const IT_TENS = [
  "venti",
  "trenta",
  "quaranta",
  "cinquanta",
  "sessanta",
  "settanta",
  "ottanta",
  "novanta",
];

/** Italian 21–99 (inclusive), excluding multiples of 10. */
function italianCompoundUnder100(n: number): string {
  const decadeIdx = Math.floor(n / 10) - 2;
  const unit = n % 10;
  const tensWord = IT_TENS[decadeIdx]!;
  if (unit === 0) return tensWord;

  if (tensWord.endsWith("a")) {
    const stem = tensWord.slice(0, -1);
    if (unit === 1 || unit === 8) return stem + (unit === 1 ? "uno" : "otto");
    if (unit === 3) return stem + "tré";
    return stem + "a" + IT_ONES[unit]!;
  }

  const stem = tensWord.slice(0, -1);
  if (unit === 1 || unit === 8) return stem + (unit === 1 ? "uno" : "otto");
  if (unit === 3) return stem + "tré";
  if (unit === 6) return stem + "isei";
  if (unit === 7) return stem + "isette";
  if (unit === 9) return stem + "nove";
  return stem + "i" + IT_ONES[unit]!;
}

function italianSpell0to100(n: number): string | null {
  if (n < 0 || n > 100) return null;
  if (n < 10) return IT_ONES[n]!;
  if (n < 20) return IT_TEENS[n - 10]!;
  if (n < 100 && n % 10 === 0) return IT_TENS[n / 10 - 2]!;
  if (n < 100) return italianCompoundUnder100(n);
  return "cento";
}

const IT_EXTRA: Record<number, string> = {
  101: "centouno",
  200: "duecento",
  300: "trecento",
  400: "quattrocento",
  500: "cinquecento",
  600: "seicento",
  700: "settecento",
  800: "ottocento",
  900: "novecento",
  1000: "mille",
  2000: "duemila",
};

function italianSpell(n: number): string | null {
  const extra = IT_EXTRA[n];
  if (extra) return extra;
  if (n >= 0 && n <= 100) return italianSpell0to100(n);
  return null;
}

const CZ_UNITS_M = ["nula", "jeden", "dva", "tři", "čtyři", "pět", "šest", "sedm", "osm", "devět"];

const CZ_TEENS = [
  "deset",
  "jedenáct",
  "dvanáct",
  "třináct",
  "čtrnáct",
  "patnáct",
  "šestnáct",
  "sedmnáct",
  "osmnáct",
  "devatenáct",
];

const CZ_TENS = ["", "", "dvacet", "třicet", "čtyřicet", "padesát", "šedesát", "sedmdesát", "osmdesát", "devadesát"];

function czechComposed21to99(n: number): string {
  const tensDigit = Math.floor(n / 10);
  const unitDigit = n % 10;
  if (unitDigit === 0) return CZ_TENS[tensDigit]!;
  const tens = CZ_TENS[tensDigit]!;
  const u = CZ_UNITS_M[unitDigit]!;
  return `${tens} ${u}`;
}

function czechSpell(n: number): string | null {
  if (n < 0) return null;
  if (n < 10) return CZ_UNITS_M[n]!;
  if (n < 20) return CZ_TEENS[n - 10]!;
  if (n < 100 && n % 10 === 0) return CZ_TENS[n / 10]!;
  if (n < 100) return czechComposed21to99(n);
  if (n === 100) return "sto";
  if (n === 200) return "dvě stě";
  if (n === 300) return "tři sta";
  if (n === 400) return "čtyři sta";
  if (n === 500) return "pět set";
  if (n === 600) return "šest set";
  if (n === 700) return "sedm set";
  if (n === 800) return "osm set";
  if (n === 900) return "devět set";
  if (n === 1000) return "tisíc";
  if (n === 2000) return "dva tisíce";
  if (n === 101) return "sto jedna";
  return null;
}

function spellNumber(n: number, lang: "it" | "cs"): string | null {
  return lang === "it" ? italianSpell(n) : czechSpell(n);
}

function spellDigitsInText(text: string, lang: "it" | "cs"): string {
  return text.replace(DIGIT_RUN, (digitChunk, offset) => {
    if (digitChunk.length >= MAX_DIGITS) return digitChunk;
    const n = parseInt(digitChunk, 10);
    if (!Number.isFinite(n) || digitChunk !== String(n)) return digitChunk;
    const word = spellNumber(n, lang);
    if (!word) return digitChunk;
    return applyCaseFromSample(word, digitChunk);
  });
}

export function spellDigitsInPair(it: string, cz: string): { it: string; cz: string } {
  return {
    it: spellDigitsInText(it, "it"),
    cz: spellDigitsInText(cz, "cs"),
  };
}
