/**
 * Lowercase + strip combining marks (diacritics) + collapse whitespace.
 * Mirror of `lib/text/normalize.ts` in the mobile app — kept here so the
 * backend doesn't have to import from outside its own package boundary.
 */
export function foldForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}
