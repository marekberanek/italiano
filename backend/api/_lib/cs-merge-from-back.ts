/**
 * Merge DeepL back-translation (`back`) into the user's Czech (`query`) so we
 * keep the user's shape (gender, register, digits) while borrowing diacritics
 * from `back` where letters align after stripping marks.
 */

function foldBaseCodePoint(cp: number): string {
  return String.fromCodePoint(cp)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function readCp(s: string, i: number): { cp: number; len: number } {
  const cp = s.codePointAt(i);
  if (cp === undefined) return { cp: 0, len: 1 };
  return { cp, len: cp > 0xffff ? 2 : 1 };
}

function foldAt(s: string, i: number): string {
  const { cp } = readCp(s, i);
  if (!cp) return "";
  return foldBaseCodePoint(cp);
}

/** Skip one "word" token in `back` (letters + typical punctuation), then spaces. */
function skipBackWordAndSpaces(back: string, j: number): number {
  let k = j;
  while (k < back.length && /[^\s\d]/u.test(back[k]!)) k++;
  while (k < back.length && /\s/u.test(back[k]!)) k++;
  return k;
}

/**
 * Walk `query` and `back` in parallel; when base letters match, emit from
 * `back` (diacritics). Skip extra letters only on the `back` side (e.g.
 * feminine `a` in `chtěla` vs user's `chtel`). When `query` has a digit run,
 * emit it verbatim and skip the spelled-out number in `back` if present.
 */
export function mergeCzechFromBackTranslation(query: string, back: string): string {
  let i = 0;
  let j = 0;
  let out = "";
  const Q = query.length;
  const B = back.length;

  while (i < Q) {
    if (j >= B) {
      out += query.slice(i);
      break;
    }

    const qi = readCp(query, i);
    if (!qi.cp) {
      i += qi.len;
      continue;
    }

    // Keep user's Arabic numerals; skip a spelled-out number in `back`.
    if (/\d/u.test(String.fromCodePoint(qi.cp))) {
      while (i < Q && /\d/u.test(query[i]!)) {
        out += query[i]!;
        i++;
      }
      j = skipBackWordAndSpaces(back, j);
      continue;
    }

    const bj = readCp(back, j);
    if (!bj.cp) break;

    if (/\d/u.test(String.fromCodePoint(bj.cp))) {
      while (j < B && /\d/u.test(back[j]!)) j++;
      continue;
    }

    if (foldAt(query, i) === foldAt(back, j)) {
      out += String.fromCodePoint(bj.cp);
      i += qi.len;
      j += bj.len;
      continue;
    }

    // Extra letter in `back` (e.g. `chtěla` vs `chtel`): drop `back[j]` if next aligns.
    if (j + bj.len < B) {
      const j2 = j + bj.len;
      if (foldAt(query, i) === foldAt(back, j2)) {
        j += bj.len;
        continue;
      }
    }

    // Extra letter in `query`: emit it, try to stay aligned on `back`.
    if (i + qi.len < Q) {
      const i2 = i + qi.len;
      if (foldAt(query, i2) === foldAt(back, j)) {
        out += String.fromCodePoint(qi.cp);
        i += qi.len;
        continue;
      }
    }

    // No safe alignment: keep user's character and advance both to avoid stalling.
    out += String.fromCodePoint(qi.cp);
    i += qi.len;
    j += bj.len;
  }

  return out;
}
