"use strict";

const fs = require("fs");
const path = require("path");
const Uu5Validator = require("./uu5-validator.js");

let cachedBrickTags = null;

/**
 * Lazily loads the uu5-components brick catalog and returns it as a Map.
 * The catalog lives in the sibling skill `uu5-components/data/bricks.json`.
 * Returns null silently when the catalog is unreachable so validation still works.
 */
function loadBrickCatalog() {
  if (cachedBrickTags !== null) return cachedBrickTags;
  const candidates = [
    path.join(__dirname, "..", "..", "uu5-components", "data", "bricks.json"),
    path.join(process.env.HOME || "", ".claude", "skills", "uu5-components", "data", "bricks.json"),
  ];
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, "utf8");
      const bricks = JSON.parse(raw);
      const map = new Map();
      for (const brick of bricks) {
        if (brick && brick.tagName) map.set(brick.tagName, brick);
      }
      cachedBrickTags = map;
      return cachedBrickTags;
    } catch (_) {
      // try next candidate
    }
  }
  cachedBrickTags = false;
  return null;
}

function validate(uu5String, availableBrickTags = null, options = {}) {
  const validationOptions = {
    verbosity: options.verbosity || "detailed",
    level: options.level || "standard",
  };

  // Auto-load the brick catalog when the caller did not pass one. This activates
  // the colorScheme value check, missing-required-attribute check and unknown-component
  // warnings that already exist in component-validator.js but were dormant.
  let brickTags = availableBrickTags;
  if (brickTags == null && options.useCatalog !== false) {
    brickTags = loadBrickCatalog();
  }

  return Uu5Validator.validate(uu5String, brickTags, validationOptions);
}

module.exports = {
  validate,
  loadBrickCatalog,
  Uu5Validator,
};
