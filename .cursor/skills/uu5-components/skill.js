/**
 * UU5 Component Catalog Skill
 * Mirrors uuAiChat's brickSearch, brickDefinitionGet, and gdsIconSearch tools.
 * Data sourced from uu_agenthub_maing01 bricks.json and icons.json.
 */

const path = require("path");
const fs = require("fs");

const schema = {
  name: "uu5-components",
  description:
    "Search UU5 brick components and GDS icons. This skill's data/bricks.json is the single source of truth for known modern UU5 component metadata and is also used by uu5-string-validator. Use brickSearch before writing ANY uu5 component — your training data contains outdated/wrong component names. Use brickDefinitionGet to get exact props before using a component. Use cheatsheet to load the render-safety rules (colorScheme palette, legacy vs modern, RichText limits) before authoring content.",
  parameters: {
    action: {
      type: "string",
      required: true,
      description:
        'Action: "brickSearch" (find components), "brickDefinitionGet" (get props), "gdsIconSearch" (find icons), "list" (list all), "cheatsheet" (return render-safety rules — call once before authoring uu5string content)',
    },
    textQuery: {
      type: "string",
      required: false,
      description:
        'For brickSearch/gdsIconSearch: search query (e.g. "accordion", "chart", "calendar icon")',
    },
    tagName: {
      type: "string",
      required: false,
      description:
        'For brickDefinitionGet: exact component tag (e.g. "Uu5Bricks.Section")',
    },
    library: {
      type: "string",
      required: false,
      description: "Filter by library (e.g. uu5Bricks, uu5ChartsBricks)",
    },
    category: {
      type: "string",
      required: false,
      description: "For gdsIconSearch: filter by icon category",
    },
    limit: {
      type: "number",
      required: false,
      description: "Max results (default: 10 for bricks, 5 for icons)",
    },
  },
};

// ─── Data Loading (lazy, cached) ───────────────────────────────────────────

let bricksCache = null;
let iconsCache = null;

function loadBricks() {
  if (bricksCache) return bricksCache;
  const raw = fs.readFileSync(path.join(__dirname, "data", "bricks.json"), "utf8");
  bricksCache = JSON.parse(raw);
  // Pre-compute searchable text
  for (const brick of bricksCache) {
    brick._searchText = cleanText(
      [brick.tagName, brick.uu5ComponentLibrary, brick.description || ""].join(" ")
    );
  }
  return bricksCache;
}

function loadIcons() {
  if (iconsCache) return iconsCache;
  const raw = fs.readFileSync(path.join(__dirname, "data", "icons.json"), "utf8");
  const iconsData = JSON.parse(raw);
  iconsCache = iconsData.map((icon) => ({
    code: icon.fullCode || icon.code,
    name: icon.name || "",
    category: icon.category || "",
    isCommon: icon.isCommon || false,
    _searchText: cleanText(
      [icon.fullCode || "", icon.name || "", ...(icon.keywords || []), icon.category || ""].join(" ")
    ),
  }));
  return iconsCache;
}

// ─── Text Cleaning & Search ────────────────────────────────────────────────

function cleanText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s.]/g, " ") // keep letters, numbers, dots, spaces
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchScore(searchableText, query) {
  const terms = query.split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;

  let totalMatches = 0;
  for (const term of terms) {
    const pattern = new RegExp(escapeRegex(term), "gi");
    const matches = searchableText.match(pattern);
    if (matches) totalMatches += matches.length;
  }

  return totalMatches > 0 ? totalMatches / searchableText.length : 0;
}

// ─── Actions ───────────────────────────────────────────────────────────────

function brickSearch(textQuery, library, limit = 10) {
  if (!textQuery) throw new Error('Parameter "textQuery" is required for brickSearch.');

  const bricks = loadBricks();
  const query = cleanText(textQuery);

  let results = bricks;

  // Filter by library if provided
  if (library) {
    const libLower = library.toLowerCase();
    results = results.filter(
      (b) => b.uu5ComponentLibrary && b.uu5ComponentLibrary.toLowerCase() === libLower
    );
  }

  // Score and rank
  results = results
    .map((b) => ({ ...b, _score: searchScore(b._searchText, query) }))
    .filter((b) => b._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  // Return compact results
  return results.map((b) => ({
    tagName: b.tagName,
    library: b.uu5ComponentLibrary,
    description: (b.description || "").substring(0, 200),
    propCount: Object.keys(b.properties || {}).length,
  }));
}

function brickDefinitionGet(tagName) {
  if (!tagName) throw new Error('Parameter "tagName" is required for brickDefinitionGet.');

  const bricks = loadBricks();
  const tagLower = tagName.toLowerCase();
  const brick = bricks.find((b) => b.tagName.toLowerCase() === tagLower);

  if (!brick) {
    // Try partial match
    const partial = bricks.filter((b) => b.tagName.toLowerCase().includes(tagLower));
    if (partial.length > 0) {
      return {
        error: `Component "${tagName}" not found. Did you mean: ${partial
          .slice(0, 5)
          .map((b) => b.tagName)
          .join(", ")}?`,
        suggestions: partial.slice(0, 5).map((b) => b.tagName),
      };
    }
    return { error: `Component "${tagName}" not found in catalog. Use brickSearch to find components.` };
  }

  return {
    tagName: brick.tagName,
    uu5ComponentLibrary: brick.uu5ComponentLibrary,
    description: brick.description,
    properties: brick.properties || {},
  };
}

function gdsIconSearch(textQuery, category, limit = 5) {
  if (!textQuery) throw new Error('Parameter "textQuery" is required for gdsIconSearch.');

  let icons = loadIcons();
  const query = cleanText(textQuery);

  // Filter by category
  if (category) {
    const catLower = category.toLowerCase();
    icons = icons.filter((i) => i.category.toLowerCase() === catLower);
  }

  // Score and rank
  const results = icons
    .map((i) => ({ ...i, _score: searchScore(i._searchText, query) }))
    .filter((i) => i._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  return results.map((i) => ({
    code: i.code,
    name: i.name,
    category: i.category,
  }));
}

function getCheatsheet() {
  // Single source of truth: shared/uu5-render-rules.md
  const candidates = [
    path.join(__dirname, "..", "shared", "uu5-render-rules.md"),
    path.join(process.env.HOME || "", ".claude", "skills", "shared", "uu5-render-rules.md"),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return {
          source: candidate,
          content: fs.readFileSync(candidate, "utf8"),
        };
      }
    } catch (_) {
      // try next
    }
  }
  return {
    error: "Cheatsheet file not found. Expected at .claude/skills/shared/uu5-render-rules.md",
  };
}

function listComponents(library) {
  const bricks = loadBricks();

  if (library) {
    const libLower = library.toLowerCase();
    const filtered = bricks.filter(
      (b) => b.uu5ComponentLibrary && b.uu5ComponentLibrary.toLowerCase() === libLower
    );
    return {
      library,
      count: filtered.length,
      components: filtered.map((b) => b.tagName).sort(),
    };
  }

  // Group by library
  const libs = {};
  for (const b of bricks) {
    const lib = b.uu5ComponentLibrary || "unknown";
    if (!libs[lib]) libs[lib] = [];
    libs[lib].push(b.tagName);
  }

  return {
    totalComponents: bricks.length,
    libraries: Object.entries(libs)
      .map(([name, components]) => ({
        name,
        count: components.length,
        components: components.sort(),
      }))
      .sort((a, b) => b.count - a.count),
  };
}

// ─── Execute ───────────────────────────────────────────────────────────────

async function execute(params) {
  const { action, textQuery, tagName, library, category, limit } = params;

  if (!action) throw new Error('Parameter "action" is required.');

  switch (action) {
    case "brickSearch":
      return brickSearch(textQuery, library, limit || 10);

    case "brickDefinitionGet":
      return brickDefinitionGet(tagName);

    case "gdsIconSearch":
      return gdsIconSearch(textQuery, category, limit || 5);

    case "list":
      return listComponents(library);

    case "cheatsheet":
      return getCheatsheet();

    default:
      throw new Error(
        `Unknown action "${action}". Available: brickSearch, brickDefinitionGet, gdsIconSearch, list, cheatsheet`
      );
  }
}

module.exports = { execute, schema };
