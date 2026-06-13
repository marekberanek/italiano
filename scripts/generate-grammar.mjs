/**
 * Generates assets/data/grammar.json with:
 * - Seven tenses for common regular + irregular Italian verbs
 * - Grammar rules (Czech explanations + Italian examples)
 *
 * Run: node scripts/generate-grammar.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { IRREGULAR_META } from "./lib/irregular-verbs-meta.mjs";
import { bracket, italianToCzechPron } from "./lib/italian-pron.mjs";
import { buildRegularVerb, buildVerb, PERSONS } from "./lib/verb-engine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "assets", "data", "grammar.json");
const backendOutPath = path.join(__dirname, "..", "backend", "content", "grammar.json");

function pron(it) {
  return bracket(italianToCzechPron(it));
}

/** @param {string} id @param {string} title @param {[string,string,string][]} rows */
function irregularVerb(id, title, rows) {
  const meta = IRREGULAR_META[id] ?? {};
  return buildVerb(id, title, rows, meta, pron);
}

function conjAre(inf, czTitle, cz) {
  const id = inf.replace(/[^a-z]/gi, "_");
  return buildRegularVerb(
    id,
    `${inf.toUpperCase()} (-are) — ${czTitle}`,
    inf,
    "are",
    czTitle,
    cz,
    pron,
  );
}

function conjEre(inf, czTitle, cz) {
  const id = inf.replace(/[^a-z]/gi, "_");
  return buildRegularVerb(
    id,
    `${inf.toUpperCase()} (-ere) — ${czTitle}`,
    inf,
    "ere",
    czTitle,
    cz,
    pron,
  );
}

function conjIre(inf, czTitle, cz) {
  const id = inf.replace(/[^a-z]/gi, "_");
  return buildRegularVerb(
    id,
    `${inf.toUpperCase()} (-ire) — ${czTitle}`,
    inf,
    "ire",
    czTitle,
    cz,
    pron,
  );
}

function conjIreIsco(inf, czTitle, cz) {
  const id = inf.replace(/[^a-z]/gi, "_");
  return buildRegularVerb(
    id,
    `${inf.toUpperCase()} (-ire, -isco) — ${czTitle}`,
    inf,
    "ire_isco",
    czTitle,
    cz,
    pron,
  );
}

function verbCareGare(id, title, itForms, cz) {
  const rows = PERSONS.map((p, i) => [p, itForms[i], cz[i]]);
  const meta = IRREGULAR_META[id] ?? {};
  return buildVerb(id, title, rows, meta, pron);
}

const irregularVerbs = [
  irregularVerb("essere", "ESSERE — být", [
    ["io", "sono", "jsem"],
    ["tu", "sei", "jsi"],
    ["lui/lei", "è", "je"],
    ["noi", "siamo", "jsme"],
    ["voi", "siete", "jste"],
    ["loro", "sono", "jsou"],
  ]),
  irregularVerb("avere", "AVERE — mít", [
    ["io", "ho", "mám"],
    ["tu", "hai", "máš"],
    ["lui/lei", "ha", "má"],
    ["noi", "abbiamo", "máme"],
    ["voi", "avete", "máte"],
    ["loro", "hanno", "mají"],
  ]),
  irregularVerb("andare", "ANDARE — jít", [
    ["io", "vado", "jdu"],
    ["tu", "vai", "jdeš"],
    ["lui/lei", "va", "jde"],
    ["noi", "andiamo", "jdeme"],
    ["voi", "andate", "jdete"],
    ["loro", "vanno", "jdou"],
  ]),
  irregularVerb("dare", "DARE — dát", [
    ["io", "do", "dávám"],
    ["tu", "dai", "dáváš"],
    ["lui/lei", "dà", "dává"],
    ["noi", "diamo", "dáváme"],
    ["voi", "date", "dáváte"],
    ["loro", "danno", "dávají"],
  ]),
  irregularVerb("fare", "FARE — dělat", [
    ["io", "faccio", "dělám"],
    ["tu", "fai", "děláš"],
    ["lui/lei", "fa", "dělá"],
    ["noi", "facciamo", "děláme"],
    ["voi", "fate", "děláte"],
    ["loro", "fanno", "dělají"],
  ]),
  irregularVerb("stare", "STARE — být (stav) / stát", [
    ["io", "sto", "jsem / stojím"],
    ["tu", "stai", "jsi / stojíš"],
    ["lui/lei", "sta", "je / stojí"],
    ["noi", "stiamo", "jsme / stojíme"],
    ["voi", "state", "jste / stojíte"],
    ["loro", "stanno", "jsou / stojí"],
  ]),
  irregularVerb("dire", "DIRE — říct", [
    ["io", "dico", "říkám"],
    ["tu", "dici", "říkáš"],
    ["lui/lei", "dice", "říká"],
    ["noi", "diciamo", "říkáme"],
    ["voi", "dite", "říkáte"],
    ["loro", "dicono", "říkají"],
  ]),
  irregularVerb("uscire", "USCÍRE — vyjít", [
    ["io", "esco", "vyjdu"],
    ["tu", "esci", "vyjdeš"],
    ["lui/lei", "esce", "vyjde"],
    ["noi", "usciamo", "vyjdeme"],
    ["voi", "uscite", "vyjdete"],
    ["loro", "escono", "vyjdou"],
  ]),
  irregularVerb("venire", "VENIRE — přijít", [
    ["io", "vengo", "přicházím"],
    ["tu", "vieni", "přicházíš"],
    ["lui/lei", "viene", "přichází"],
    ["noi", "veniamo", "přicházíme"],
    ["voi", "venite", "přicházíte"],
    ["loro", "vengono", "přicházejí"],
  ]),
  irregularVerb("bere", "BERE — pít", [
    ["io", "bevo", "piju"],
    ["tu", "bevi", "piješ"],
    ["lui/lei", "beve", "pije"],
    ["noi", "beviamo", "pijeme"],
    ["voi", "bevete", "pijete"],
    ["loro", "bevono", "pijí"],
  ]),
  irregularVerb("sapere", "SAPERE — vědět / umět", [
    ["io", "so", "vím"],
    ["tu", "sai", "víš"],
    ["lui/lei", "sa", "ví"],
    ["noi", "sappiamo", "víme"],
    ["voi", "sapete", "víte"],
    ["loro", "sanno", "vědí"],
  ]),
  irregularVerb("dovere", "DOVERE — muset", [
    ["io", "devo", "musím"],
    ["tu", "devi", "musíš"],
    ["lui/lei", "deve", "musí"],
    ["noi", "dobbiamo", "musíme"],
    ["voi", "dovete", "musíte"],
    ["loro", "devono", "musí"],
  ]),
  irregularVerb("potere", "POTERE — moci", [
    ["io", "posso", "mohu"],
    ["tu", "puoi", "můžeš"],
    ["lui/lei", "può", "může"],
    ["noi", "possiamo", "můžeme"],
    ["voi", "potete", "můžete"],
    ["loro", "possono", "mohou"],
  ]),
  irregularVerb("volere", "VOLERE — chtít", [
    ["io", "voglio", "chci"],
    ["tu", "vuoi", "chceš"],
    ["lui/lei", "vuole", "chce"],
    ["noi", "vogliamo", "chceme"],
    ["voi", "volete", "chcete"],
    ["loro", "vogliono", "chtějí"],
  ]),
  irregularVerb("vedere", "VEDERE — vidět", [
    ["io", "vedo", "vidím"],
    ["tu", "vedi", "vidíš"],
    ["lui/lei", "vede", "vidí"],
    ["noi", "vediamo", "vidíme"],
    ["voi", "vedete", "vidíte"],
    ["loro", "vedono", "vidí"],
  ]),
  irregularVerb("tenere", "TENERE — držet / mít", [
    ["io", "tengo", "držím"],
    ["tu", "tieni", "držíš"],
    ["lui/lei", "tiene", "drží"],
    ["noi", "teniamo", "držíme"],
    ["voi", "tenete", "držíte"],
    ["loro", "tengono", "drží"],
  ]),
  irregularVerb("rimanere", "RIMANERE — zůstat", [
    ["io", "rimango", "zůstávám"],
    ["tu", "rimani", "zůstáváš"],
    ["lui/lei", "rimane", "zůstává"],
    ["noi", "rimaniamo", "zůstáváme"],
    ["voi", "rimanete", "zůstáváte"],
    ["loro", "rimangono", "zůstávají"],
  ]),
  irregularVerb("salire", "SALIRE — stoupat / nastoupit", [
    ["io", "salgo", "stoupám"],
    ["tu", "sali", "stoupáš"],
    ["lui/lei", "sale", "stoupá"],
    ["noi", "saliamo", "stoupáme"],
    ["voi", "salite", "stoupáte"],
    ["loro", "salgono", "stoupají"],
  ]),
  irregularVerb("morire", "MORIRE — umírat", [
    ["io", "muoio", "umírám"],
    ["tu", "muori", "umíráš"],
    ["lui/lei", "muore", "umírá"],
    ["noi", "moriamo", "umíráme"],
    ["voi", "morite", "umíráte"],
    ["loro", "muoiono", "umírají"],
  ]),
  irregularVerb("scegliere", "SCEGLIERE — vybrat", [
    ["io", "scelgo", "vybírám"],
    ["tu", "scegli", "vybíráš"],
    ["lui/lei", "sceglie", "vybírá"],
    ["noi", "scegliamo", "vybíráme"],
    ["voi", "scegliete", "vybíráte"],
    ["loro", "scelgono", "vybírají"],
  ]),
  irregularVerb("cogliere", "COGLIERE — sklidit", [
    ["io", "colgo", "sklízím"],
    ["tu", "cogli", "sklízíš"],
    ["lui/lei", "coglie", "sklízí"],
    ["noi", "cogliamo", "sklízíme"],
    ["voi", "cogliete", "sklízíte"],
    ["loro", "colgono", "sklízejí"],
  ]),
  irregularVerb("porre", "PORRE — položit", [
    ["io", "pongo", "kladu"],
    ["tu", "poni", "kladeš"],
    ["lui/lei", "pone", "klade"],
    ["noi", "poniamo", "klademe"],
    ["voi", "ponete", "kláděte"],
    ["loro", "pongono", "kladou"],
  ]),
  irregularVerb("trarre", "TRARRE — táhnout / vytáhnout", [
    ["io", "traggo", "táhnu"],
    ["tu", "trai", "táhneš"],
    ["lui/lei", "trae", "táhne"],
    ["noi", "traiamo", "táhneme"],
    ["voi", "traete", "táhnete"],
    ["loro", "traggono", "táhnou"],
  ]),
  irregularVerb("piacere", "PIACERE — líbit se", [
    ["io", "piaccio", "líbím se"],
    ["tu", "piaci", "líbíš se"],
    ["lui/lei", "piace", "líbí se"],
    ["noi", "piacciamo", "líbíme se"],
    ["voi", "piacete", "líbíte se"],
    ["loro", "piacciono", "líbí se"],
  ]),
  irregularVerb("valere", "VALERE — mít cenu", [
    ["io", "valgo", "mám cenu"],
    ["tu", "vali", "máš cenu"],
    ["lui/lei", "vale", "má cenu"],
    ["noi", "valiamo", "máme cenu"],
    ["voi", "valete", "máte cenu"],
    ["loro", "valgono", "mají cenu"],
  ]),
  irregularVerb("cuocere", "CUOCERE — vařit / péci", [
    ["io", "cuocio", "vařím"],
    ["tu", "cuoci", "vaříš"],
    ["lui/lei", "cuoce", "vaří"],
    ["noi", "cociamo", "vaříme"],
    ["voi", "cocete", "vaříte"],
    ["loro", "cuociono", "vaří"],
  ]),
  irregularVerb("giungere", "GIUNGERE — dorazit", [
    ["io", "giungo", "dorazím"],
    ["tu", "giungi", "dorazíš"],
    ["lui/lei", "giunge", "dorazí"],
    ["noi", "giungiamo", "dorazíme"],
    ["voi", "giungete", "dorazíte"],
    ["loro", "giungono", "dorazí"],
  ]),
  irregularVerb("cadere", "CADERE — padat", [
    ["io", "cado", "padám"],
    ["tu", "cadi", "padáš"],
    ["lui/lei", "cade", "padá"],
    ["noi", "cadiamo", "padáme"],
    ["voi", "cadete", "padáte"],
    ["loro", "cadono", "padají"],
  ]),
  irregularVerb("conoscere", "CONOSCERE — znát", [
    ["io", "conosco", "znám"],
    ["tu", "conosci", "znáš"],
    ["lui/lei", "conosce", "zná"],
    ["noi", "conosciamo", "známe"],
    ["voi", "conoscete", "znáte"],
    ["loro", "conoscono", "znají"],
  ]),
  irregularVerb("parere", "PARERE — zdát se", [
    ["io", "paio", "zdám se"],
    ["tu", "pari", "zdáš se"],
    ["lui/lei", "pare", "zdá se"],
    ["noi", "paiamo", "zdáme se"],
    ["voi", "parete", "zdáte se"],
    ["loro", "paiono", "zdají se"],
  ]),
  irregularVerb("correre", "CORRERE — běžet", [
    ["io", "corro", "běžím"],
    ["tu", "corri", "běžíš"],
    ["lui/lei", "corre", "běží"],
    ["noi", "corriamo", "běžíme"],
    ["voi", "correte", "běžíte"],
    ["loro", "corrono", "běží"],
  ]),
  irregularVerb("accendere", "ACCENDERE — zapnout", [
    ["io", "accendo", "zapínám"],
    ["tu", "accendi", "zapínáš"],
    ["lui/lei", "accende", "zapíná"],
    ["noi", "accendiamo", "zapínáme"],
    ["voi", "accendete", "zapínáte"],
    ["loro", "accendono", "zapínají"],
  ]),
  irregularVerb("spegnere", "SPEGNERE — vypnout", [
    ["io", "spengo", "vypínám"],
    ["tu", "spegni", "vypínáš"],
    ["lui/lei", "spegne", "vypíná"],
    ["noi", "spegniamo", "vypínáme"],
    ["voi", "spegnete", "vypínáte"],
    ["loro", "spengono", "vypínají"],
  ]),
  irregularVerb("nascere", "NASCERE — narodit se / vzniknout", [
    ["io", "nasco", "rodím se"],
    ["tu", "nasci", "rodíš se"],
    ["lui/lei", "nasce", "rodí se"],
    ["noi", "nasciamo", "rodíme se"],
    ["voi", "nascete", "rodíte se"],
    ["loro", "nascono", "rodí se"],
  ]),
  irregularVerb("vincere", "VINCERE — vyhrát", [
    ["io", "vinco", "vyhrávám"],
    ["tu", "vinci", "vyhráváš"],
    ["lui/lei", "vince", "vyhrává"],
    ["noi", "vinciamo", "vyhráváme"],
    ["voi", "vincete", "vyhráváte"],
    ["loro", "vincono", "vyhrávají"],
  ]),
  irregularVerb("apparire", "APPARIRE — objevit se", [
    ["io", "appaio", "objevuji se"],
    ["tu", "appari", "objevuješ se"],
    ["lui/lei", "appare", "objevuje se"],
    ["noi", "appariamo", "objevujeme se"],
    ["voi", "apparite", "objevujete se"],
    ["loro", "appaiono", "objevují se"],
  ]),
  irregularVerb("condurre", "CONDURRE — vést / řídit", [
    ["io", "conduco", "vedu"],
    ["tu", "conduci", "vedeš"],
    ["lui/lei", "conduce", "vede"],
    ["noi", "conduciamo", "vedeme"],
    ["voi", "conducete", "vedete"],
    ["loro", "conducono", "vedou"],
  ]),
  irregularVerb("tradurre", "TRADURRE — přeložit", [
    ["io", "traduco", "překládám"],
    ["tu", "traduci", "překládáš"],
    ["lui/lei", "traduce", "překládá"],
    ["noi", "traduciamo", "překládáme"],
    ["voi", "traducete", "překládáte"],
    ["loro", "traducono", "překládají"],
  ]),
  irregularVerb("produrre", "PRODURRE — vyrábět", [
    ["io", "produco", "vyrábím"],
    ["tu", "produci", "vyrábíš"],
    ["lui/lei", "produce", "vyrábí"],
    ["noi", "produciamo", "vyrábíme"],
    ["voi", "producete", "vyrábíte"],
    ["loro", "producono", "vyrábějí"],
  ]),
  irregularVerb("piangere", "PIANGERE — plakat", [
    ["io", "piango", "pláču"],
    ["tu", "piangi", "pláčeš"],
    ["lui/lei", "piange", "pláče"],
    ["noi", "piangiamo", "pláčeme"],
    ["voi", "piangete", "pláčete"],
    ["loro", "piangono", "pláčou"],
  ]),
  irregularVerb("decidere", "DECIDERE — rozhodnout se", [
    ["io", "decido", "rozhodnu se"],
    ["tu", "decidi", "rozhodneš se"],
    ["lui/lei", "decide", "rozhodne se"],
    ["noi", "decidiamo", "rozhodneme se"],
    ["voi", "decidete", "rozhodnete se"],
    ["loro", "decidono", "rozhodnou se"],
  ]),
  verbCareGare(
    "cercare",
    "CERCARE (-care) — hledat",
    ["cerco", "cerchi", "cerca", "cerchiamo", "cercate", "cercano"],
    ["hledám", "hledáš", "hledá", "hledáme", "hledáte", "hledají"],
  ),
  verbCareGare(
    "pagare",
    "PAGARE (-gare) — platit",
    ["pago", "paghi", "paga", "paghiamo", "pagate", "pagano"],
    ["platím", "platíš", "platí", "platíme", "platíte", "platí"],
  ),
  verbCareGare(
    "dimenticare",
    "DIMENTICARE (-care) — zapomenout",
    ["dimentico", "dimentichi", "dimentica", "dimentichiamo", "dimenticate", "dimenticano"],
    ["zapomínám", "zapomínáš", "zapomíná", "zapomínáme", "zapomínáte", "zapomínají"],
  ),
  verbCareGare(
    "indicare",
    "INDICARE (-care) — ukázat",
    ["indico", "indichi", "indica", "indichiamo", "indicate", "indicano"],
    ["ukazuji", "ukazuješ", "ukazuje", "ukazujeme", "ukazujete", "ukazují"],
  ),
  verbCareGare(
    "giocare",
    "GIOCARE (-care) — hrát",
    ["gioco", "giochi", "gioca", "giochiamo", "giocate", "giocano"],
    ["hraji", "hraješ", "hraje", "hrajeme", "hrajete", "hrají"],
  ),
];

const regularAre = [
  ["parlare", "mluvit", ["mluvím", "mluvíš", "mluví", "mluvíme", "mluvíte", "mluví"]],
  ["amare", "milovat", ["miluji", "miluješ", "miluje", "milujeme", "milujete", "milují"]],
  ["lavorare", "pracovat", ["pracuji", "pracuješ", "pracuje", "pracujeme", "pracujete", "pracují"]],
  ["studiare", "studovat", ["studuji", "studuješ", "studuje", "studujeme", "studujete", "studují"]],
  ["mangiare", "jíst", ["jím", "jíš", "jí", "jíme", "jíte", "jedí"]],
  ["cambiare", "měnit", ["měním", "měníš", "mění", "měníme", "měníte", "mění"]],
  ["comprare", "kupovat", ["kupuji", "kupuješ", "kupuje", "kupujeme", "kupujete", "kupují"]],
  ["aspettare", "čekat", ["čekám", "čekáš", "čeká", "čekáme", "čekáte", "čekají"]],
  ["trovare", "nacházet", ["nacházím", "nacházíš", "nachází", "nacházíme", "nacházíte", "nacházejí"]],
  ["abitare", "bydlet", ["bydlím", "bydlíš", "bydlí", "bydlíme", "bydlíte", "bydlí"]],
  ["entrare", "vstoupit", ["vstupuji", "vstupuješ", "vstupuje", "vstupujeme", "vstupujete", "vstupují"]],
  ["tornare", "vracet se", ["vracím se", "vracíš se", "vrací se", "vracíme se", "vracíte se", "vrací se"]],
  ["chiamare", "volat", ["volám", "voláš", "volá", "voláme", "voláte", "volají"]],
  ["lasciare", "nechat", ["nechávám", "necháváš", "nechává", "necháváme", "necháváte", "nechávají"]],
  ["spiegare", "vysvětlovat", ["vysvětluji", "vysvětluješ", "vysvětluje", "vysvětlujeme", "vysvětlujete", "vysvětlují"]],
  ["organizzare", "organizovat", ["organizuji", "organizuješ", "organizuje", "organizujeme", "organizujete", "organizují"]],
  ["viaggiare", "cestovat", ["cestuji", "cestuješ", "cestuje", "cestujeme", "cestujete", "cestují"]],
  ["visitare", "navštěvovat", ["navštěvuji", "navštěvuješ", "navštěvuje", "navštěvujeme", "navštěvujete", "navštěvují"]],
  ["lavare", "mýt", ["myji", "myješ", "myje", "myjeme", "myjete", "myjí"]],
  ["cucinare", "vařit", ["vařím", "vaříš", "vaří", "vaříme", "vaříte", "vaří"]],
  ["desiderare", "přát si", ["přeji si", "přeješ si", "přeje si", "přejeme si", "přejete si", "přejí si"]],
  ["diventare", "stávat se", ["stávám se", "stáváš se", "stává se", "stáváme se", "stáváte se", "stávají se"]],
  ["pensare", "myslet", ["myslím", "myslíš", "myslí", "myslíme", "myslíte", "myslí"]],
  ["sperare", "doufat", ["doufám", "doufáš", "doufá", "doufáme", "doufáte", "doufají"]],
  ["iniziare", "začínat", ["začínám", "začínáš", "začíná", "začínáme", "začínáte", "začínají"]],
  ["continuare", "pokračovat", ["pokračuji", "pokračuješ", "pokračuje", "pokračujeme", "pokračujete", "pokračují"]],
  ["arrivare", "přijíždět", ["přijíždím", "přijíždíš", "přijíždí", "přijíždíme", "přijíždíte", "přijíždějí"]],
  ["ascoltare", "poslouchat", ["poslouchám", "posloucháš", "poslouchá", "posloucháme", "posloucháte", "poslouchají"]],
  ["cantare", "zpívat", ["zpívám", "zpíváš", "zpívá", "zpíváme", "zpíváte", "zpívají"]],
  ["ballare", "tancovat", ["tancuji", "tancuješ", "tancuje", "tancujeme", "tancujete", "tancují"]],
  ["cenare", "večeřet", ["večeřím", "večeříš", "večeří", "večeříme", "večeříte", "večeří"]],
  ["guidare", "řídit", ["řídím", "řídíš", "řídí", "řídíme", "řídíte", "řídí"]],
  ["usare", "používat", ["používám", "používáš", "používá", "používáme", "používáte", "používají"]],
];

const regularEreTuples = [
  ["vendere", "prodávat", ["prodávám", "prodáváš", "prodává", "prodáváme", "prodáváte", "prodávají"]],
  ["credere", "věřit", ["věřím", "věříš", "věří", "věříme", "věříte", "věří"]],
  ["ricevere", "dostávat", ["dostávám", "dostáváš", "dostává", "dostáváme", "dostáváte", "dostávají"]],
  ["mettere", "klást", ["pokládám", "pokládáš", "pokládá", "pokládáme", "pokládáte", "pokládají"]],
  ["prendere", "brát", ["beru", "bereš", "bere", "bereme", "berete", "berou"]],
  ["scrivere", "psát", ["píšu", "píšeš", "píše", "píšeme", "píšete", "píší"]],
  ["vivere", "žít", ["žiji", "žiješ", "žije", "žijeme", "žijete", "žijí"]],
  ["chiedere", "ptát se", ["ptám se", "ptáš se", "ptá se", "ptáme se", "ptáte se", "ptají se"]],
  ["perdere", "ztrácet", ["ztrácím", "ztrácíš", "ztrácí", "ztrácíme", "ztrácíte", "ztrácejí"]],
  ["leggere", "číst", ["čtu", "čteš", "čte", "čteme", "čtete", "čtou"]],
  ["battere", "tlouci", ["buším", "bušíš", "buší", "bušíme", "bušíte", "bují"]],
  ["temere", "bát se", ["bojím se", "bojíš se", "bojí se", "bojíme se", "bojíte se", "bojí se"]],
  ["ripetere", "opakovat", ["opakuji", "opakuješ", "opakuje", "opakujeme", "opakujete", "opakují"]],
];

const regularIre = [
  ["dormire", "spat", ["spím", "spíš", "spí", "spíme", "spíte", "spí"]],
  ["aprire", "otevřít", ["otevírám", "otevíráš", "otevírá", "otevíráme", "otevíráte", "otevírají"]],
  ["sentire", "slyšet / cítit", ["cítím", "cítíš", "cítí", "cítíme", "cítíte", "cítí"]],
  ["partire", "odjet", ["odjíždím", "odjíždíš", "odjíždí", "odjíždíme", "odjíždíte", "odjíždějí"]],
  ["seguire", "následovat", ["následuji", "následuješ", "následuje", "následujeme", "následujete", "následují"]],
  ["servire", "sloužit", ["sloužím", "sloužíš", "slouží", "sloužíme", "sloužíte", "slouží"]],
  ["vestire", "oblékat", ["oblékám", "oblékáš", "obléká", "oblékáme", "oblékáte", "oblékají"]],
  ["offrire", "nabídnout", ["nabídnu", "nabídneš", "nabídne", "nabídneme", "nabídnete", "nabídnou"]],
];

const regularIreIsco = [
  ["finire", "dokončit", ["dokončuji", "dokončuješ", "dokončuje", "dokončujeme", "dokončujete", "dokončují"]],
  ["capire", "rozumět", ["rozumím", "rozumíš", "rozumí", "rozumíme", "rozumíte", "rozumějí"]],
  ["preferire", "preferovat", ["preferuji", "preferuješ", "preferuje", "preferujeme", "preferujete", "preferují"]],
  ["pulire", "čistit", ["čistím", "čistíš", "čistí", "čistíme", "čistíte", "čistí"]],
  ["costruire", "stavět", ["stavím", "stavíš", "staví", "stavíme", "stavíte", "staví"]],
  ["spedire", "odeslat", ["odesílám", "odesíláš", "odesílá", "odesíláme", "odesíláte", "odesílají"]],
];

const verbs = [
  ...irregularVerbs,
  ...regularAre.map(([inf, czTitle, cz]) => conjAre(inf, czTitle, cz)),
  ...regularEreTuples.map(([inf, czTitle, cz]) => conjEre(inf, czTitle, cz)),
  ...regularIre.map(([inf, czTitle, cz]) => conjIre(inf, czTitle, cz)),
  ...regularIreIsco.map(([inf, czTitle, cz]) => conjIreIsco(inf, czTitle, cz)),
];

const seen = new Set();
for (const v of verbs) {
  if (seen.has(v.id)) throw new Error(`Duplicate verb id: ${v.id}`);
  seen.add(v.id);
}

const rules = [
  { rule: "Rod podstatných jmen (m. / ž.)", example: "Il libro — la penna.", translation: "Kniha — pero." },
  { rule: "Článek určitý (il, lo, l', la, i, gli, le)", example: "Lo studente — gli uomini.", translation: "Student — muži." },
  { rule: "Článek neurčitý (un, uno, una, un')", example: "Una pizza — un'idea.", translation: "Pizza — nápad." },
  { rule: "Partitivní člen (del, della, dei…)", example: "Vorrei del pane.", translation: "Chtěl bych trochu chleba." },
  { rule: "Množné číslo podstatných jmen", example: "I libri — le donne.", translation: "Knihy — ženy." },
  { rule: "Shoda přídavného jména", example: "Una casa grande — due case grandi.", translation: "Velký dům — dvě velké domy." },
  { rule: "Pozice adjektiva (význam)", example: "Una grande casa — una casa grande.", translation: "Velký dům vs dům, který je velký." },
  { rule: "Zájmena osobní (subjekt)", example: "Io e tu andiamo.", translation: "Ty a já jdeme." },
  { rule: "Tonická zájmena", example: "Vengo con te.", translation: "Jdu s tebou." },
  { rule: "Přivlastňovací zájmena", example: "Il mio libro — la sua casa.", translation: "Moje kniha — jeho/její dům." },
  { rule: "Ukazovací zájmena", example: "Questo / quello / codesto.", translation: "Tento / tamten." },
  { rule: "Záporná zájmena (nessuno, niente, mai)", example: "Non ho niente.", translation: "Nemám nic." },
  { rule: "Stavba věty SVO", example: "Io mangio la pizza.", translation: "Jím pizzu." },
  { rule: "Předložka a (směr, čas)", example: "Vado a scuola.", translation: "Jdu do školy." },
  { rule: "Předložka in (místo, stát)", example: "Vivo in Italia.", translation: "Žiju v Itálii." },
  { rule: "Předložka di (původ, obsah)", example: "Il libro di Marco.", translation: "Markova kniha." },
  { rule: "Předložka da (odkud, od koho)", example: "Vengo da Praga.", translation: "Jsem z Prahy." },
  { rule: "Předložka su (na, o tématu)", example: "Il libro sul tavolo.", translation: "Kniha na stole." },
  { rule: "Předložka per (účel, doprava)", example: "Studio per l'esame.", translation: "Učím se na zkoušku." },
  { rule: "Tra / fra (mezi, za čas)", example: "Tra due ore.", translation: "Za dvě hodiny." },
  { rule: "Artiklované předložky", example: "Vado al cinema — torno dal lavoro.", translation: "Jdu do kina — vracím se z práce." },
  { rule: "Negace non", example: "Non capisco.", translation: "Nerozumím." },
  { rule: "Negace s mica / più", example: "Non è mica vero.", translation: "To přece není pravda." },
  { rule: "Otázka intonací", example: "Parli italiano?", translation: "Mluvíš italsky?" },
  { rule: "Wh-slova", example: "Dove — quando — perché — come.", translation: "Kde — kdy — proč — jak." },
  { rule: "Comparativo (più … di / che)", example: "Roma è più grande di Firenze.", translation: "Řím je větší než Florencie." },
  { rule: "Superlativ relativní", example: "Il film più bello.", translation: "Nejkrásnější film." },
  { rule: "Superlativ absolutní (-issimo)", example: "Buonissimo!", translation: "Výborné!" },
  { rule: "Číslovky: cardinali / ordinals", example: "Tre — terzo.", translation: "Tři — třetí." },
  { rule: "Passato prossimo: avere vs essere", example: "Ho mangiato — sono andato.", translation: "Snědl jsem — šel jsem." },
  { rule: "Shoda participia s essere", example: "Maria è arrivata.", translation: "Marie přijela." },
  { rule: "Imperfetto (popis, zvyk)", example: "Da bambino giocavo.", translation: "Jako dítě jsem hrával." },
  { rule: "Imperfetto vs passato prossimo", example: "Mentre studiavo, è squillato il telefono.", translation: "Zatímco jsem studoval, zazvonil telefon." },
  { rule: "Futuro semplice", example: "Domani partiremo.", translation: "Zítra vyrazíme." },
  { rule: "Condizionale (zdvořilost)", example: "Vorrei un caffè.", translation: "Chtěl bych kávu." },
  { rule: "Periodo ipotetico (stručně)", example: "Se avessi tempo, viaggerei.", translation: "Kdybych měl čas, cestoval bych." },
  { rule: "Presente congiuntivo", example: "Penso che sia vero.", translation: "Myslím, že je to pravda." },
  { rule: "Imperfetto congiuntivo", example: "Speravo che potessi venire.", translation: "Doufal jsem, že můžeš přijít." },
  { rule: "Imperativo (tu, voi, Lei)", example: "Parla! — Parlate! — Parli!", translation: "Mluv! — Mluvte! — Mluvte (vykání)." },
  { rule: "Imperativo se zájmeny", example: "Dimmelo — non farlo.", translation: "Řekni mi to — nedělej to." },
  { rule: "Infinito", example: "Voglio imparare.", translation: "Chci se naučit." },
  { rule: "Gerundio", example: "Sto mangiando.", translation: "Právě jím." },
  { rule: "Participio passato", example: "mangiato — scritto — detto", translation: "tvary příčestí." },
  { rule: "Reflexivní slovesa (si)", example: "Mi alzo alle sette.", translation: "Vstávám v sedm." },
  { rule: "Ci (místo / náhrada)", example: "Ci vado spesso.", translation: "Často tam chodím." },
  { rule: "Ne (předmět / partitiva)", example: "Ne ho comprati due.", translation: "Koupil jsem jich dva." },
  { rule: "Bisogna + infinito", example: "Bisogna studiare.", translation: "Je třeba studovat." },
  { rule: "Piacere (3. osoba)", example: "Mi piace la pizza.", translation: "Líbí se mi pizza." },
  { rule: "Stare + gerundio", example: "Sto leggendo.", translation: "Právě čtu." },
  { rule: "Andare a + infinito", example: "Vado a comprare il pane.", translation: "Jdu koupit chleba." },
  { rule: "Modální slovesa + infinito", example: "Devo — posso — voglio.", translation: "Musím — mohu — chci." },
  { rule: "Oslovení (Lei vs tu)", example: "Come sta? — Come stai?", translation: "Jak se máte? — Jak se máš?" },
  { rule: "Sì / no u záporné otázky", example: "Non hai fame? — Sì, ho fame.", translation: "Pozor na význam ano/ne v italštině." },
  { rule: "Spojky", example: "Ma, però, quindi, perché.", translation: "Ale, avšak, proto, protože." },
  { rule: "Relativní věta (che, cui)", example: "Il libro che leggo.", translation: "Kniha, kterou čtu." },
  { rule: "Diskurzní částice", example: "Allora, dunque, insomma.", translation: "Takže, tedy, zkrátka." },
  { rule: "A + město / in + region", example: "Vado a Roma — vivo in Toscana.", translation: "Jedu do Říma — žiju v Toskánsku." },
  { rule: "Časové výrazy", example: "Ieri — oggi — domani — già — ancora.", translation: "Včera — dnes — zítra — už — ještě." },
  { rule: "Slovesné vazby (pensare a / di)", example: "Penso a te.", translation: "Myslím na tebe." },
  { rule: "Koncovka -isco u -ire", example: "Capisco — finisco.", translation: "Rozumím — dokončuji." },
  { rule: "Pravopis c/g + e/i", example: "Cena — chiave — ghiaccio.", translation: "Výslovnostní pravidla." },
  { rule: "Aggettivi e avverbi (-mente)", example: "Lenta — lentamente.", translation: "Pomalý — pomalu." },
  { rule: "Avverbi di frequenza", example: "Sempre — spesso — qualche volta — mai.", translation: "Vždy — často — někdy — nikdy." },
  { rule: "Pronomi combinati (me lo)", example: "Te lo dico.", translation: "Řeknu ti to." },
  { rule: "Si passivante / impersonale", example: "Si parla italiano.", translation: "Mluví se italsky." },
  { rule: "Trapassato prossimo", example: "Avevo già mangiato.", translation: "Už jsem byl snědl (předminulý)." },
  { rule: "Futuro anteriore (souvislost)", example: "Quando avrò finito, uscirò.", translation: "Až skončím, vyjdu." },
  { rule: "Discorso indiretto", example: "Dice che viene.", translation: "Říká, že přijde." },
  { rule: "Congiuntivo v nezávislé větě", example: "Benché sia stanco, studia.", translation: "Ačkoliv je unavený, studuje." },
];

const rulesWithPron = rules.map((r) => ({ ...r, p: pron(r.example) }));
const payload = { verbs, rules: rulesWithPron };
const serialized = JSON.stringify(payload, null, 2);
fs.mkdirSync(path.dirname(backendOutPath), { recursive: true });
fs.writeFileSync(outPath, serialized, "utf8");
fs.writeFileSync(backendOutPath, serialized, "utf8");
console.log(`Wrote ${verbs.length} verbs and ${rules.length} rules to:\n  ${outPath}\n  ${backendOutPath}`);