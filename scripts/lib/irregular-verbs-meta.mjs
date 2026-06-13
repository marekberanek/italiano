/**
 * Override metadata for irregular Italian verbs.
 * Present tense rows stay in generate-grammar.mjs; other tenses are built here.
 */

const EVO = ["evo", "evi", "eva", "evamo", "evate", "evano"];
const IVO = ["ivo", "ivi", "iva", "ivamo", "ivate", "ivano"];

/** @param {string} stem @param {string[]} endings */
function stemEnd(stem, endings) {
  return endings.map((e) => stem + e);
}

/** @param {object} m */
function meta(m) {
  return m;
}

export const IRREGULAR_META = {
  essere: meta({
    aux: "essere",
    participle: "stato",
    participleCz: "byl",
    imperfetto: ["ero", "eri", "era", "eravamo", "eravate", "erano"],
    imperfettoCz: ["byl jsem", "byl jsi", "byl", "byli jsme", "byli jste", "byli"],
    futuro: ["sarò", "sarai", "sarà", "saremo", "sarete", "saranno"],
    futuroCz: ["budu", "budeš", "bude", "budeme", "budete", "budou"],
    condizionale: ["sarei", "saresti", "sarebbe", "saremmo", "sareste", "sarebbero"],
    condizionaleCz: ["byl bych", "byl bys", "byl by", "byli bychom", "byli byste", "byli by"],
    congiuntivo: ["sia", "sia", "sia", "siamo", "siate", "siano"],
    congiuntivoCz: ["buď", "buď", "buď", "buďme", "buďte", "buďte"],
    imperativo: ["sii", "sia", "siamo", "siate"],
    imperativoCz: ["buď", "buďte (vyk.)", "buďme", "buďte"],
  }),

  avere: meta({
    aux: "avere",
    participle: "avuto",
    participleCz: "měl",
    imperfetto: stemEnd("avev", ["o", "i", "a", "amo", "ate", "ano"]),
    imperfettoCz: ["měl jsem", "měl jsi", "měl", "měli jsme", "měli jste", "měli"],
    futuro: ["avrò", "avrai", "avrà", "avremo", "avrete", "avranno"],
    condizionale: ["avrei", "avresti", "avrebbe", "avremmo", "avreste", "avrebbero"],
    congiuntivo: ["abbia", "abbia", "abbia", "abbiamo", "abbiate", "abbiano"],
    imperativo: ["abbi", "abbia", "abbiamo", "abbiate"],
  }),

  andare: meta({
    aux: "essere",
    participle: "andato",
    participleCz: "šel",
    futureStem: "andr",
    imperfetto: stemEnd("and", EVO),
    congiuntivo: ["vada", "vada", "vada", "andiamo", "andiate", "vadano"],
    imperativo: ["va'", "vada", "andiamo", "andate"],
  }),

  venire: meta({
    aux: "essere",
    participle: "venuto",
    participleCz: "přišel",
    futureStem: "verr",
    imperfetto: stemEnd("ven", IVO),
    congiuntivo: ["venga", "venga", "venga", "veniamo", "veniate", "vengano"],
    imperativo: ["vieni", "venga", "veniamo", "venite"],
  }),

  uscire: meta({
    aux: "essere",
    participle: "uscito",
    participleCz: "vyšel",
    futureStem: "uscir",
    imperfetto: stemEnd("usc", IVO),
    congiuntivo: ["esca", "esca", "esca", "usciamo", "uscite", "escano"],
    imperativo: ["esci", "esca", "usciamo", "uscite"],
  }),

  dare: meta({
    participle: "dato",
    participleCz: "dal",
    futureStem: "dar",
    imperfetto: stemEnd("d", EVO),
    congiuntivo: ["dia", "dia", "dia", "diamo", "diate", "diano"],
    imperativo: ["da'", "dia", "diamo", "date"],
  }),

  fare: meta({
    participle: "fatto",
    participleCz: "udělal",
    futureStem: "far",
    imperfetto: stemEnd("facev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["faccia", "faccia", "faccia", "facciamo", "facciate", "facciano"],
    imperativo: ["fa'", "faccia", "facciamo", "fate"],
  }),

  stare: meta({
    aux: "essere",
    participle: "stato",
    participleCz: "stál",
    futureStem: "star",
    imperfetto: stemEnd("stav", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["stia", "stia", "stia", "stiamo", "stiate", "stiano"],
    imperativo: ["sta'", "stia", "stiamo", "state"],
  }),

  dire: meta({
    participle: "detto",
    participleCz: "řekl",
    futureStem: "dir",
    imperfetto: stemEnd("dicev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["dica", "dica", "dica", "diciamo", "diciate", "dicano"],
    imperativo: ["di'", "dica", "diciamo", "dite"],
  }),

  bere: meta({
    participle: "bevuto",
    participleCz: "pil",
    futureStem: "berr",
    imperfetto: stemEnd("bevev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["beva", "beva", "beva", "beviamo", "beviate", "bevano"],
    imperativo: ["bevi", "beva", "beviamo", "bevete"],
  }),

  sapere: meta({
    participle: "saputo",
    participleCz: "věděl",
    futureStem: "sapr",
    imperfetto: stemEnd("sapev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["sappia", "sappia", "sappia", "sappiamo", "sappiate", "sappiano"],
    imperativo: ["sappi", "sappia", "sappiamo", "sappiate"],
  }),

  dovere: meta({
    participle: "dovuto",
    participleCz: "musel",
    futureStem: "dovr",
    imperfetto: stemEnd("dovev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["debba", "debba", "debba", "dobbiamo", "dobbiate", "debbano"],
    imperativo: ["", "debba", "dobbiamo", "dovete"],
  }),

  potere: meta({
    participle: "potuto",
    participleCz: "mohl",
    futureStem: "potr",
    imperfetto: stemEnd("potev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["possa", "possa", "possa", "possiamo", "possiate", "possano"],
    imperativo: ["", "possa", "possiamo", "potete"],
  }),

  volere: meta({
    participle: "voluto",
    participleCz: "chtěl",
    futureStem: "vorr",
    imperfetto: stemEnd("volev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["voglia", "voglia", "voglia", "vogliamo", "vogliate", "vogliano"],
    imperativo: ["", "voglia", "vogliamo", "volete"],
  }),

  vedere: meta({
    participle: "visto",
    participleCz: "viděl",
    futureStem: "vedr",
    imperfetto: stemEnd("vedev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["veda", "veda", "veda", "vediamo", "vediate", "vedano"],
    imperativo: ["vedi", "veda", "vediamo", "vedete"],
  }),

  tenere: meta({
    participle: "tenuto",
    participleCz: "držel",
    futureStem: "terr",
    imperfetto: stemEnd("tenev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["tenga", "tenga", "tenga", "teniamo", "teniate", "tengano"],
    imperativo: ["tieni", "tenga", "teniamo", "tenete"],
  }),

  rimanere: meta({
    aux: "essere",
    participle: "rimasto",
    participleCz: "zůstal",
    futureStem: "rimarr",
    imperfetto: stemEnd("rimanev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["rimanga", "rimanga", "rimanga", "rimaniamo", "rimaniate", "rimangano"],
    imperativo: ["rimani", "rimanga", "rimaniamo", "rimanete"],
  }),

  salire: meta({
    aux: "essere",
    participle: "salito",
    participleCz: "vystoupil",
    futureStem: "salir",
    imperfetto: stemEnd("sal", IVO),
    congiuntivo: ["salga", "salga", "salga", "saliamo", "salite", "salgano"],
    imperativo: ["sali", "salga", "saliamo", "salite"],
  }),

  morire: meta({
    aux: "essere",
    participle: "morto",
    participleCz: "zemřel",
    futureStem: "morr",
    imperfetto: stemEnd("mor", IVO),
    congiuntivo: ["muoia", "muoia", "muoia", "moriamo", "moriate", "muoiano"],
    imperativo: ["muori", "muoia", "moriamo", "morite"],
  }),

  scegliere: meta({
    participle: "scelto",
    participleCz: "vybral",
    futureStem: "sceglier",
    imperfetto: stemEnd("scegliev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["scelga", "scelga", "scelga", "scegliamo", "scegliate", "scelgano"],
    imperativo: ["scegli", "scelga", "scegliamo", "scegliete"],
  }),

  cogliere: meta({
    participle: "colto",
    participleCz: "sklidil",
    futureStem: "coglier",
    imperfetto: stemEnd("cogliev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["colga", "colga", "colga", "cogliamo", "cogliate", "colgano"],
    imperativo: ["cogli", "colga", "cogliamo", "cogliete"],
  }),

  porre: meta({
    participle: "posto",
    participleCz: "položil",
    futureStem: "porr",
    imperfetto: stemEnd("ponev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["ponga", "ponga", "ponga", "poniamo", "poniate", "pongano"],
    imperativo: ["poni", "ponga", "poniamo", "ponete"],
  }),

  trarre: meta({
    participle: "tratto",
    participleCz: "táhl",
    futureStem: "trarr",
    imperfetto: stemEnd("traev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["tragga", "tragga", "tragga", "traiamo", "traiate", "traggono"],
    imperativo: ["trai", "tragga", "traiamo", "traete"],
  }),

  piacere: meta({
    aux: "essere",
    participle: "piaciuto",
    participleCz: "líbil se",
    futureStem: "piacer",
    imperfetto: stemEnd("piacev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["piaccia", "piaccia", "piaccia", "piacciamo", "piacciate", "piacciano"],
    imperativo: ["", "piaccia", "piacciamo", "piacete"],
  }),

  valere: meta({
    participle: "valso",
    participleCz: "měl cenu",
    futureStem: "varr",
    imperfetto: stemEnd("valev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["valga", "valga", "valga", "valiamo", "valiate", "valgano"],
    imperativo: ["", "valga", "valiamo", "valete"],
  }),

  cuocere: meta({
    participle: "cotto",
    participleCz: "uvaril",
    futureStem: "cuocer",
    imperfetto: stemEnd("cuocev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["cuocia", "cuocia", "cuocia", "cociamo", "cociate", "cuociano"],
    imperativo: ["cuoci", "cuocia", "cociamo", "cocete"],
  }),

  giungere: meta({
    aux: "essere",
    participle: "giunto",
    participleCz: "dorazil",
    futureStem: "giunger",
    imperfetto: stemEnd("giungev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["giunga", "giunga", "giunga", "giungiamo", "giungiate", "giungano"],
    imperativo: ["giungi", "giunga", "giungiamo", "giungete"],
  }),

  cadere: meta({
    aux: "essere",
    participle: "caduto",
    participleCz: "padl",
    futureStem: "cadr",
    imperfetto: stemEnd("cadev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["cada", "cada", "cada", "cadiamo", "cadiate", "cadano"],
    imperativo: ["cadi", "cada", "cadiamo", "cadete"],
  }),

  conoscere: meta({
    participle: "conosciuto",
    participleCz: "poznal",
    futureStem: "conoscer",
    imperfetto: stemEnd("conoscev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["conosca", "conosca", "conosca", "conosciamo", "conosciate", "conoscano"],
    imperativo: ["conosci", "conosca", "conosciamo", "conoscete"],
  }),

  parere: meta({
    participle: "parso",
    participleCz: "zdál se",
    futureStem: "parr",
    imperfetto: stemEnd("parev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["paia", "paia", "paia", "paiamo", "paite", "paiano"],
    imperativo: ["", "paia", "paiamo", "parete"],
  }),

  correre: meta({
    aux: "essere",
    participle: "corso",
    participleCz: "běžel",
    futureStem: "correr",
    imperfetto: stemEnd("correv", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["corra", "corra", "corra", "corriamo", "corriate", "corrano"],
    imperativo: ["corri", "corra", "corriamo", "correte"],
  }),

  accendere: meta({
    participle: "acceso",
    participleCz: "zapnul",
    futureStem: "accender",
    imperfetto: stemEnd("accendev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["accenda", "accenda", "accenda", "accendiamo", "accendiate", "accendano"],
    imperativo: ["accendi", "accenda", "accendiamo", "accendete"],
  }),

  spegnere: meta({
    participle: "spento",
    participleCz: "vypnul",
    futureStem: "spegner",
    imperfetto: stemEnd("spegnev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["spenga", "spenga", "spenga", "spegniamo", "spegniate", "spegnano"],
    imperativo: ["spegni", "spenga", "spegniamo", "spegnete"],
  }),

  nascere: meta({
    aux: "essere",
    participle: "nato",
    participleCz: "narodil se",
    futureStem: "nascer",
    imperfetto: stemEnd("nascev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["nasca", "nasca", "nasca", "nasciamo", "nasciate", "nascano"],
    imperativo: ["nasci", "nasca", "nasciamo", "nascete"],
  }),

  vincere: meta({
    participle: "vinto",
    participleCz: "vyhrál",
    futureStem: "vincer",
    imperfetto: stemEnd("vincev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["vinca", "vinca", "vinca", "vinciamo", "vinciate", "vincano"],
    imperativo: ["vinci", "vinca", "vinciamo", "vincete"],
  }),

  apparire: meta({
    aux: "essere",
    participle: "apparso",
    participleCz: "objevil se",
    futureStem: "apparir",
    imperfetto: stemEnd("appar", IVO),
    congiuntivo: ["appaia", "appaia", "appaia", "appariamo", "appariate", "appaiano"],
    imperativo: ["appari", "appaia", "appariamo", "apparite"],
  }),

  condurre: meta({
    participle: "condotto",
    participleCz: "vedl",
    futureStem: "condurr",
    imperfetto: stemEnd("conducev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["conduca", "conduca", "conduca", "conduciamo", "conduciate", "conducano"],
    imperativo: ["conduci", "conduca", "conduciamo", "conducete"],
  }),

  tradurre: meta({
    participle: "tradotto",
    participleCz: "přeložil",
    futureStem: "tradurr",
    imperfetto: stemEnd("traducev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["traduca", "traduca", "traduca", "traduciamo", "traduciate", "traducano"],
    imperativo: ["traduci", "traduca", "traduciamo", "traducete"],
  }),

  produrre: meta({
    participle: "prodotto",
    participleCz: "vyráběl",
    futureStem: "produrr",
    imperfetto: stemEnd("producev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["produca", "produca", "produca", "produciamo", "produciate", "producano"],
    imperativo: ["produci", "produca", "produciamo", "producete"],
  }),

  piangere: meta({
    participle: "pianto",
    participleCz: "plakal",
    futureStem: "pianger",
    imperfetto: stemEnd("piangev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["pianga", "pianga", "pianga", "piangiamo", "piangiate", "piangano"],
    imperativo: ["piangi", "pianga", "piangiamo", "piangete"],
  }),

  decidere: meta({
    participle: "deciso",
    participleCz: "rozhodl se",
    futureStem: "decider",
    imperfetto: stemEnd("decidev", ["o", "i", "a", "amo", "ate", "ano"]),
    congiuntivo: ["decida", "decida", "decida", "decidiamo", "decidiate", "decidano"],
    imperativo: ["decidi", "decida", "decidiamo", "decidete"],
  }),

  cercare: meta({
    participle: "cercato",
    participleCz: "hledal",
    futureStem: "cercher",
    imperfetto: stemEnd("cerc", EVO),
    congiuntivo: ["cerchi", "cerchi", "cerchi", "cerchiamo", "cerchiate", "cerchino"],
    imperativo: ["cerca", "cerchi", "cerchiamo", "cerchate"],
  }),

  pagare: meta({
    participle: "pagato",
    participleCz: "platil",
    futureStem: "pagher",
    imperfetto: stemEnd("pag", EVO),
    congiuntivo: ["paghi", "paghi", "paghi", "paghiamo", "paghiate", "paghino"],
    imperativo: ["paga", "paghi", "paghiamo", "pagate"],
  }),

  dimenticare: meta({
    participle: "dimenticato",
    participleCz: "zapomněl",
    futureStem: "dimenticher",
    imperfetto: stemEnd("dimentic", EVO),
    congiuntivo: ["dimentichi", "dimentichi", "dimentichi", "dimentichiamo", "dimentichiate", "dimentichino"],
    imperativo: ["dimentica", "dimentichi", "dimentichiamo", "dimenticate"],
  }),

  indicare: meta({
    participle: "indicato",
    participleCz: "ukázal",
    futureStem: "indicher",
    imperfetto: stemEnd("indic", EVO),
    congiuntivo: ["indichi", "indichi", "indichi", "indichiamo", "indichiate", "indichino"],
    imperativo: ["indica", "indichi", "indichiamo", "indicate"],
  }),

  giocare: meta({
    participle: "giocato",
    participleCz: "hrál",
    futureStem: "giocher",
    imperfetto: stemEnd("gioc", EVO),
    congiuntivo: ["giochi", "giochi", "giochi", "giochiamo", "giochiate", "giochino"],
    imperativo: ["gioca", "giochi", "giochiamo", "giocate"],
  }),
};
