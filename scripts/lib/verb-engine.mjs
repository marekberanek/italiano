/**
 * Italian verb conjugation engine for grammar.json generation.
 * Produces 7 tenses: presente, imperfetto, passato_prossimo, futuro,
 * condizionale, congiuntivo, imperativo.
 */

export const PERSONS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
export const IMPERATIVE_PERSONS = ["tu", "Lei", "noi", "voi"];

const FUT_END = ["o", "ai", "à", "emo", "ete", "anno"];
const COND_END = ["ei", "esti", "ebbe", "emmo", "este", "ebbero"];

const AVERE_IT = ["ho", "hai", "ha", "abbiamo", "avete", "hanno"];
const AVERE_CZ = ["mám", "máš", "má", "máme", "máte", "mají"];
const ESSERE_IT = ["sono", "sei", "è", "siamo", "siete", "sono"];
const ESSERE_CZ = ["jsem", "jsi", "je", "jsme", "jste", "jsou"];

export const TENSE_LABELS = {
  presente: "Přítomný",
  imperfetto: "Imperfektum",
  passato_prossimo: "Minulý (passato prossimo)",
  futuro: "Budoucí",
  condizionale: "Podmiňovací",
  congiuntivo: "Konjunktiv",
  imperativo: "Rozkazovací",
};

const ESSERE_AUX_IDS = new Set([
  "andare",
  "venire",
  "uscire",
  "rimanere",
  "salire",
  "morire",
  "nascere",
  "cadere",
  "tornare",
  "partire",
  "arrivare",
  "entrare",
  "diventare",
  "essere",
  "stare",
  "partire",
]);

/** @param {string} inf */
function futureStemAre(inf, careGare = false) {
  const base = inf.slice(0, -3);
  if (careGare) return `${base}h`;
  return `${base}er`;
}

/** @param {string} inf */
function futureStemEre(inf) {
  return inf.slice(0, -3) + "r";
}

/** @param {string} inf */
function futureStemIre(inf) {
  return inf.slice(0, -3) + "ir";
}

/** @param {string[]} stems @param {string[]} endings */
function combine(stems, endings) {
  return stems.map((s, i) => s + endings[i]);
}

/** @param {string} stem @param {string[]} endings */
function stemEnd(stem, endings) {
  return endings.map((e) => stem + e);
}

/**
 * @param {string} inf
 * @param {"are"|"ere"|"ire"|"ire_isco"|"care_gare"} group
 * @param {string} czTitle
 * @param {string[]} presentCz
 * @param {string} id
 */
export function buildRegularTenses(inf, group, czTitle, presentCz, id) {
  const stem = inf.slice(0, -3);
  const careGare = group === "care_gare";
  const isco = group === "ire_isco";

  let presentIt;
  let imperfIt;
  let congIt;
  let partIt;
  let futStem;

  if (group === "are" || careGare) {
    const s = stem;
    presentIt = [`${s}o`, `${s}i`, `${s}a`, `${s}iamo`, `${s}ate`, `${s}ano`];
    if (careGare) {
      presentIt = [`${s}o`, `${s}hi`, `${s}a`, `${s}hiamo`, `${s}ate`, `${s}ano`];
    }
    imperfIt = stemEnd(s, ["avo", "avi", "ava", "avamo", "avate", "avano"]);
    congIt = stemEnd(s, ["i", "i", "i", "iamo", "iate", "ino"]);
    if (careGare) {
      congIt = stemEnd(s, ["hi", "hi", "hi", "hiamo", "hiate", "hino"]);
    }
    partIt = `${s}ato`;
    futStem = futureStemAre(inf, careGare);
  } else if (group === "ere") {
    presentIt = stemEnd(stem, ["o", "i", "e", "iamo", "ete", "ono"]);
    imperfIt = stemEnd(stem, ["evo", "evi", "eva", "evamo", "evate", "evano"]);
    congIt = stemEnd(stem, ["a", "a", "a", "iamo", "iate", "ano"]);
    partIt = `${stem}uto`;
    futStem = futureStemEre(inf);
  } else {
    presentIt = stemEnd(stem, ["o", "i", "e", "iamo", "ite", "ono"]);
    imperfIt = stemEnd(stem, ["ivo", "ivi", "iva", "ivamo", "ivate", "ivano"]);
    if (isco) {
      presentIt = stemEnd(stem, ["isco", "isci", "isce", "iamo", "ite", "iscono"]);
      congIt = stemEnd(stem, ["isca", "isca", "isca", "iamo", "iate", "iscano"]);
    } else {
      congIt = stemEnd(stem, ["a", "a", "a", "iamo", "iate", "ano"]);
    }
    partIt = `${stem}ito`;
    futStem = futureStemIre(inf);
  }

  const futIt = stemEnd(futStem, FUT_END);
  const condIt = stemEnd(futStem, COND_END);

  const imperfCz = presentCz.map((cz) => {
    if (cz.includes(" ")) return cz.replace(/[áéíóúů]/g, (m) => m) + " (imp.)";
    return `${cz} (imp.)`;
  });

  const partCz = participleCz(czTitle, group);
  const aux = ESSERE_AUX_IDS.has(id) ? "essere" : "avere";
  const passato = buildPassatoProssimo(aux, partIt, partCz);

  let impTu;
  let impLei;
  let impNoi;
  let impVoi;
  if (group === "are" || careGare) {
    impTu = careGare ? `${stem}ha` : `${stem}a`;
    impLei = congIt[0];
    impNoi = `${stem}iamo`;
    impVoi = `${stem}ate`;
    if (careGare) {
      impTu = `${stem}ha`;
      impNoi = `${stem}hiamo`;
      impVoi = `${stem}hate`;
    }
  } else if (group === "ere") {
    impTu = `${stem}i`;
    impLei = congIt[0];
    impNoi = `${stem}iamo`;
    impVoi = `${stem}ete`;
  } else {
    impTu = `${stem}i`;
    impLei = congIt[0];
    impNoi = `${stem}iamo`;
    impVoi = `${stem}ite`;
  }

  const imperativoIt = [impTu, impLei, impNoi, impVoi];
  const imperativoCz = ["", "vykání", "my", "vy"];

  return {
    presente: { it: presentIt, cz: presentCz },
    imperfetto: { it: imperfIt, cz: imperfCz },
    passato_prossimo: passato,
    futuro: { it: futIt, cz: presentCz.map((c) => `${c} (bud.)`) },
    condizionale: { it: condIt, cz: presentCz.map((c) => `${c} (podm.)`) },
    congiuntivo: { it: congIt, cz: presentCz.map((c) => `${c} (konj.)`) },
    imperativo: {
      it: imperativoIt,
      cz: imperativoCz,
      persons: IMPERATIVE_PERSONS,
    },
  };
}

/** @param {string} czTitle @param {string} group */
function participleCz(czTitle, group) {
  const base = czTitle.split("/")[0].trim();
  if (base.endsWith("it")) return base.slice(0, -2) + "il";
  if (base.endsWith("t")) return base.slice(0, -1) + "l";
  return `${base} (příč.)`;
}

/**
 * @param {"essere"|"avere"} aux
 * @param {string} participle
 * @param {string} partCz
 */
export function buildPassatoProssimo(aux, participle, partCz) {
  const auxIt = aux === "essere" ? ESSERE_IT : AVERE_IT;
  const auxCz = aux === "essere" ? ESSERE_CZ : AVERE_CZ;
  return {
    it: auxIt.map((a) => `${a} ${participle}`),
    cz: auxCz.map((a) => `${partCz} (${a})`),
    persons: PERSONS,
  };
}

/**
 * @param {Record<string, { it: string[], cz: string[], persons?: string[] }>} tenseMap
 * @param {(it: string) => string} pronFn
 */
export function tenseToRows(tenseMap, pronFn) {
  const result = {};
  for (const [id, data] of Object.entries(tenseMap)) {
    const persons = data.persons ?? PERSONS;
    result[id] = persons.map((p, i) => [p, data.it[i], data.cz[i] ?? "", pronFn(data.it[i])]);
  }
  return result;
}

/**
 * @param {string} id
 * @param {string} title
 * @param {[string,string,string][]} presentRows — without pron
 * @param {Record<string, unknown>} meta
 * @param {(it: string) => string} pronFn
 */
export function buildVerb(id, title, presentRows, meta, pronFn) {
  const presentIt = presentRows.map((r) => r[1]);
  const presentCz = presentRows.map((r) => r[2]);

  const tenses = {};

  tenses.presente = {
    it: presentIt,
    cz: presentCz,
    persons: PERSONS,
  };

  if (meta.imperfetto) {
    tenses.imperfetto = { it: meta.imperfetto, cz: meta.imperfettoCz ?? presentCz.map((c) => `${c} (imp.)`), persons: PERSONS };
  }

  if (meta.futuro) {
    tenses.futuro = { it: meta.futuro, cz: meta.futuroCz ?? presentCz.map((c) => `${c} (bud.)`), persons: PERSONS };
  } else if (meta.futureStem) {
    tenses.futuro = { it: stemEnd(meta.futureStem, FUT_END), cz: presentCz.map((c) => `${c} (bud.)`), persons: PERSONS };
    tenses.condizionale = { it: stemEnd(meta.futureStem, COND_END), cz: presentCz.map((c) => `${c} (podm.)`), persons: PERSONS };
  }

  if (meta.condizionale && !tenses.condizionale) {
    tenses.condizionale = { it: meta.condizionale, cz: meta.condizionaleCz ?? presentCz.map((c) => `${c} (podm.)`), persons: PERSONS };
  }

  if (meta.congiuntivo) {
    tenses.congiuntivo = { it: meta.congiuntivo, cz: meta.congiuntivoCz ?? presentCz.map((c) => `${c} (konj.)`), persons: PERSONS };
  }

  if (meta.imperativo) {
    tenses.imperativo = {
      it: meta.imperativo,
      cz: meta.imperativoCz ?? ["", "vykání", "my", "vy"],
      persons: IMPERATIVE_PERSONS,
    };
  }

  const aux = meta.aux ?? (ESSERE_AUX_IDS.has(id) ? "essere" : "avere");
  if (meta.participle) {
    tenses.passato_prossimo = buildPassatoProssimo(aux, meta.participle, meta.participleCz ?? meta.participle);
  }

  return assembleVerb(id, title, tenses, presentRows, pronFn);
}

/**
 * @param {string} id
 * @param {string} title
 * @param {Record<string, { it: string[], cz: string[], persons?: string[] }>} tenses
 * @param {[string,string,string][]} presentRows
 * @param {(it: string) => string} pronFn
 */
export function assembleVerb(id, title, tenses, presentRows, pronFn) {
  const tenseOrder = [
    "presente",
    "imperfetto",
    "passato_prossimo",
    "futuro",
    "condizionale",
    "congiuntivo",
    "imperativo",
  ];

  const presentRowsFull = presentRows.map(([p, it, cz]) => [p, it, cz, pronFn(it)]);

  const tensesOut = tenseOrder
    .filter((tid) => tenses[tid])
    .map((tid) => {
      const t = tenses[tid];
      const persons = t.persons ?? PERSONS;
      const rows = persons.map((person, i) => [
        person,
        t.it[i],
        t.cz[i] ?? "",
        pronFn(t.it[i]),
      ]);
      return { id: tid, label: TENSE_LABELS[tid], rows };
    });

  return {
    id,
    title,
    tenses: tensesOut,
    rows: presentRowsFull,
  };
}

/**
 * @param {string} id
 * @param {string} title
 * @param {string} inf
 * @param {"are"|"ere"|"ire"|"ire_isco"|"care_gare"} group
 * @param {string} czTitle
 * @param {string[]} presentCz
 * @param {(it: string) => string} pronFn
 */
export function buildRegularVerb(id, title, inf, group, czTitle, presentCz, pronFn) {
  const built = buildRegularTenses(inf, group, czTitle, presentCz, id);
  const presentRows = PERSONS.map((p, i) => [p, built.presente.it[i], built.presente.cz[i]]);
  return assembleVerb(id, title, built, presentRows, pronFn);
}
