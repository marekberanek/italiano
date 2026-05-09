/**
 * Adds `p` (Czech-friendly pronunciation) to topic lesson JSON lines that have `it` + `cz`.
 * Writes both `assets/data/` and `backend/content/`.
 *
 * Run: node scripts/fill-topic-pron.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bracket, italianToCzechPron } from "./lib/italian-pron.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "assets", "data");
const backendDir = path.join(root, "backend", "content");

const FILES = [
  "time.json",
  "seasons.json",
  "colors-shapes.json",
  "ordinals.json",
  "holidays-it.json",
  "weather.json",
  "family.json",
  "body-health.json",
  "food-drinks.json",
  "false-friends.json",
  "abbreviations.json",
];

function fillPron(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const el of obj) fillPron(el);
    return;
  }
  if (typeof obj.it === "string" && typeof obj.cz === "string" && obj.p === undefined) {
    obj.p = bracket(italianToCzechPron(obj.it));
  }
  for (const k of Object.keys(obj)) fillPron(obj[k]);
}

for (const name of FILES) {
  const srcPath = path.join(dataDir, name);
  if (!fs.existsSync(srcPath)) {
    console.warn(`Skip (missing): ${name}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  fillPron(data);
  const out = JSON.stringify(data, null, 2);
  fs.writeFileSync(srcPath, out, "utf8");
  fs.writeFileSync(path.join(backendDir, name), out, "utf8");
  console.log(`Filled pron: ${name}`);
}
