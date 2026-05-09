/**
 * Adds Czech-friendly pronunciation hints to JSON content files
 * (numbers, alphabet, weekdays, months) and mirrors the result into
 * `backend/content/` so the remote sync ships the same data.
 *
 * Run: node scripts/generate-pron.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bracket, italianToCzechPron } from "./lib/italian-pron.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "assets", "data");
const backendDir = path.join(__dirname, "..", "backend", "content");

function pron(it) {
  return bracket(italianToCzechPron(it));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(filename, payload) {
  const serialized = JSON.stringify(payload, null, 2);
  fs.writeFileSync(path.join(dataDir, filename), serialized, "utf8");
  fs.writeFileSync(path.join(backendDir, filename), serialized, "utf8");
}

function withTriplePron(rows) {
  return rows.map((r) => {
    const [num, label] = r;
    return [num, label, pron(label)];
  });
}

function processNumbers() {
  const file = "numbers.json";
  const src = readJson(path.join(dataDir, file));
  const next = {
    list: withTriplePron(src.list),
    composition: withTriplePron(src.composition),
  };
  writeJson(file, next);
  return next;
}

/**
 * Italian alphabet entries are kept as `[LETTER, italianName, czechPron]`.
 * The "italianName" is the regular Italian spelling of the letter name
 * (e.g. "ci" for C); the third value is the Czech-friendly pronunciation.
 *
 * The current source uses the Czech pronunciation in slot 2; the canonical
 * Italian spelling is hardcoded here so we don't have to maintain two
 * separate lists.
 */
const ITALIAN_LETTER_NAMES = {
  A: "a",
  B: "bi",
  C: "ci",
  D: "di",
  E: "e",
  F: "effe",
  G: "gi",
  H: "acca",
  I: "i",
  L: "elle",
  M: "emme",
  N: "enne",
  O: "o",
  P: "pi",
  Q: "cu",
  R: "erre",
  S: "esse",
  T: "ti",
  U: "u",
  V: "vu",
  Z: "zeta",
};

function processAlphabet() {
  const file = "alphabet.json";
  const src = readJson(path.join(dataDir, file));
  const letters = src.letters.map((row) => {
    const letter = row[0];
    const italianName = ITALIAN_LETTER_NAMES[letter] ?? row[1];
    return [letter, italianName, pron(italianName)];
  });
  const next = { letters };
  writeJson(file, next);
  return next;
}

function withDictPron(items) {
  return items.map((it) => ({ ...it, p: pron(it.it) }));
}

function processWeekdays() {
  const file = "weekdays.json";
  const src = readJson(path.join(dataDir, file));
  const next = {
    days: withDictPron(src.days),
    notes: src.notes ? src.notes.map((n) => ({ ...n, p: pron(n.it) })) : src.notes,
  };
  writeJson(file, next);
  return next;
}

function processMonths() {
  const file = "months.json";
  const src = readJson(path.join(dataDir, file));
  const next = {
    months: withDictPron(src.months),
    notes: src.notes ? src.notes.map((n) => ({ ...n, p: pron(n.it) })) : src.notes,
  };
  writeJson(file, next);
  return next;
}

const numbers = processNumbers();
const alphabet = processAlphabet();
const weekdays = processWeekdays();
const months = processMonths();

console.log(
  `Updated:\n  numbers (${numbers.list.length} + ${numbers.composition.length})` +
    `\n  alphabet (${alphabet.letters.length})` +
    `\n  weekdays (${weekdays.days.length})` +
    `\n  months (${months.months.length})`,
);
