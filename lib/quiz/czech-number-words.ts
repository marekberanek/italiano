/**
 * Returns Czech word forms accepted as a translation of a given number.
 *
 * Used by the quiz to accept both the digit ("17") and the natural Czech word
 * ("sedmnáct") when the user is asked to translate an Italian numeral. The
 * matcher normalizes diacritics + whitespace, so we list common variants
 * (gender, with/without inner space) but don't have to enumerate every accent
 * spelling.
 *
 * Coverage: 0–100 in 1-step granularity, then 200, 300, …, 1000, 2000.
 * For composed numbers up to 99 we synthesize "tens unit" (e.g. 33 → "třicet tři").
 */
const UNITS_M = [
  "nula",
  "jeden",
  "dva",
  "tři",
  "čtyři",
  "pět",
  "šest",
  "sedm",
  "osm",
  "devět",
];

/** Feminine / neutral variants we also accept (1, 2). */
const UNITS_EXTRA: Record<number, string[]> = {
  1: ["jedna", "jedno"],
  2: ["dvě"],
};

const TEENS = [
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

const TENS = [
  "",
  "",
  "dvacet",
  "třicet",
  "čtyřicet",
  "padesát",
  "šedesát",
  "sedmdesát",
  "osmdesát",
  "devadesát",
];

function unitWords(n: number): string[] {
  const base = UNITS_M[n];
  const extras = UNITS_EXTRA[n] ?? [];
  return base ? [base, ...extras] : extras;
}

/** Compose tens + unit (e.g. 33 → "třicet tři"). */
function composedWords(n: number): string[] {
  if (n < 20 || n > 99) return [];
  const tensDigit = Math.floor(n / 10);
  const unitDigit = n % 10;
  if (unitDigit === 0) return [TENS[tensDigit]!];
  const tens = TENS[tensDigit]!;
  return unitWords(unitDigit).map((u) => `${tens} ${u}`);
}

const SPECIAL: Record<number, string[]> = {
  100: ["sto"],
  200: ["dvě stě", "dvěstě"],
  300: ["tři sta"],
  400: ["čtyři sta"],
  500: ["pět set"],
  600: ["šest set"],
  700: ["sedm set"],
  800: ["osm set"],
  900: ["devět set"],
  1000: ["tisíc", "jeden tisíc"],
  2000: ["dva tisíce", "dvě tisíce"],
  101: ["sto jedna", "sto jeden", "sto jedno"],
};

export function czechNumberWords(n: number): string[] {
  if (Number.isInteger(n) === false) return [];
  if (n < 0) return [];
  if (n < 10) return unitWords(n);
  if (n < 20) return [TEENS[n - 10]!];
  if (n < 100 && n % 10 === 0) return [TENS[n / 10]!];
  if (n < 100) return composedWords(n);
  if (SPECIAL[n]) return SPECIAL[n]!;
  return [];
}
