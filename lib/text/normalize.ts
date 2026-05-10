/**
 * Lowercase + strip combining marks (diacritics) + collapse whitespace.
 *
 * Use whenever you need diacritics-insensitive comparison, e.g.:
 * - filtering vocabulary by user-typed query (`citta` should match `città`)
 * - quiz answer matching (Czech `nedele` should match `neděle`)
 *
 * Returns the input unchanged when it's empty.
 */
export function foldForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}
