import type { VocabKind } from "@/assets/data/types";

function tokenCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** Classify from the stored pair (after lookup). */
export function inferVocabKind(it: string, cz: string): VocabKind {
  return Math.max(tokenCount(it), tokenCount(cz)) > 1 ? "phrase" : "word";
}

/** Classify from raw user input before translation (same rule). */
export function inferKindFromQuery(query: string): VocabKind {
  return tokenCount(query) > 1 ? "phrase" : "word";
}
