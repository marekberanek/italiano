import type { GrammarRule } from "@/assets/data/types";

export type RuleCategoryId =
  | "articles"
  | "adjectives"
  | "pronouns"
  | "prepositions"
  | "tenses"
  | "verb-forms"
  | "syntax"
  | "misc";

export type RuleCategory = {
  id: RuleCategoryId;
  label: string;
  /** Short hint shown in the section header. */
  blurb: string;
};

/**
 * Stable display order of categories. Driven by what a learner usually meets
 * first (articles & nouns → adjectives → pronouns …) so the screen reads as a
 * linear curriculum.
 */
export const RULE_CATEGORIES: RuleCategory[] = [
  {
    id: "articles",
    label: "Členy a podst. jména",
    blurb: "Rod, určitý/neurčitý člen, množné číslo.",
  },
  {
    id: "adjectives",
    label: "Přídavná jména a stupňování",
    blurb: "Shoda, pozice, comparativo, superlativ, příslovce.",
  },
  {
    id: "pronouns",
    label: "Zájmena",
    blurb: "Osobní, přivlastňovací, ci, ne, kombinovaná.",
  },
  {
    id: "prepositions",
    label: "Předložky",
    blurb: "a, in, di, da, su, per a artiklované tvary.",
  },
  {
    id: "tenses",
    label: "Slovesné časy a způsoby",
    blurb: "Passato, imperfetto, futuro, condizionale, congiuntivo…",
  },
  {
    id: "verb-forms",
    label: "Slovesné tvary a vazby",
    blurb: "Infinito, gerundio, modální, piacere, reflexivní…",
  },
  {
    id: "syntax",
    label: "Stavba věty a komunikace",
    blurb: "SVO, otázky, negace, spojky, oslovení.",
  },
  {
    id: "misc",
    label: "Číslovky, pravopis, čas",
    blurb: "Cardinali / ordinals, pravopis, časové výrazy.",
  },
];

/**
 * Maps a rule to one of {@link RULE_CATEGORIES} based on its `rule` text.
 * Order of the checks matters — first match wins, so the more specific
 * patterns must come before broader ones (e.g. "Pronomi combinati" before the
 * generic "Zájm" check).
 */
export function categorizeRule(rule: GrammarRule): RuleCategoryId {
  const t = rule.rule;

  if (/Slovesné vazby/i.test(t)) return "verb-forms";
  if (/Pronomi combinati/i.test(t)) return "pronouns";
  if (/Tra \/ fra|Artiklované předl|A \+ město/i.test(t)) return "prepositions";

  if (
    /Rod podstat|Článek|Partitivní|Množné číslo podstat/i.test(t)
  ) {
    return "articles";
  }

  if (
    /adjektiv|Pozice adjektiva|Shoda přídav|Comparativo|Superlativ|-mente|Aggettiv|Avverbi/i.test(
      t,
    )
  ) {
    return "adjectives";
  }

  if (/Zájm|Pronomi|Tonická|Ci \(|Ne \(/i.test(t)) {
    return "pronouns";
  }

  if (/Předlož/i.test(t)) return "prepositions";

  if (
    /Passato|Imperfetto|Futuro|Condizionale|Periodo ipotetico|Trapassato|congiuntivo|Discorso indiretto|Imperativo/i.test(
      t,
    )
  ) {
    return "tenses";
  }

  if (
    /Infinito|Gerund|Participio|Bisogna|Stare \+ gerundio|Andare a \+|Modální slovesa|Si passivante|Koncovka -isco|Reflexivní|Piacere/i.test(
      t,
    )
  ) {
    return "verb-forms";
  }

  if (
    /Stavba věty|Negace|Otázka|Wh-slova|Spojky|Relativní věta|Diskurzní částice|Oslovení|Sì \/ no/i.test(
      t,
    )
  ) {
    return "syntax";
  }

  if (
    /Číslovky|Ortografie|Pravopis c\/g|Časové výrazy|Avverbi di frequenza/i.test(t)
  ) {
    return "misc";
  }

  return "misc";
}

/** Groups rules by category, preserving the order from {@link RULE_CATEGORIES}. */
export function groupRulesByCategory(rules: GrammarRule[]): Map<RuleCategoryId, GrammarRule[]> {
  const out = new Map<RuleCategoryId, GrammarRule[]>();
  for (const cat of RULE_CATEGORIES) out.set(cat.id, []);
  for (const r of rules) {
    const id = categorizeRule(r);
    out.get(id)!.push(r);
  }
  return out;
}
