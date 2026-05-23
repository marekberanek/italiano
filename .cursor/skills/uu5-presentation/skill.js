/**
 * UU5 Presentation Slide Template Catalog
 * Search slide templates, get complete JSON structures, list available types.
 * Data: 22 slide templates covering all major pattern groups.
 */

const path = require("path");
const fs = require("fs");

const schema = {
  name: "uu5-presentation",
  description:
    "Search and retrieve UU5 slide templates for ManagementKit presentations. Use slideSearch to find matching slide types, slideTemplateGet to get complete JSON, slideList to see all available templates.",
  parameters: {
    action: {
      type: "string",
      required: true,
      description:
        'Action: "slideSearch" (find slides by query), "slideTemplateGet" (get complete JSON template), "slideList" (list all templates), "slideCategories" (list by category)',
    },
    textQuery: {
      type: "string",
      required: false,
      description:
        'For slideSearch: search query (e.g. "cards 3 items", "chart statistics", "welcome intro")',
    },
    slideId: {
      type: "string",
      required: false,
      description: 'For slideTemplateGet: exact slide ID (e.g. "slide_04", "slide_14")',
    },
    category: {
      type: "string",
      required: false,
      description:
        'Filter by category: "intro", "split", "cards", "content", "media", "data", "text"',
    },
    limit: {
      type: "number",
      required: false,
      description: "Max results for slideSearch (default: 5)",
    },
  },
};

// ─── Data Loading (lazy, cached) ───────────────────────────────────────────

let templatesCache = null;

function loadTemplates() {
  if (templatesCache) return templatesCache;
  const raw = fs.readFileSync(path.join(__dirname, "data", "slide-templates.json"), "utf8");
  templatesCache = JSON.parse(raw);
  for (const t of templatesCache) {
    t._searchText = cleanText(
      [t.id, t.name, t.category, t.description, ...t.keywords].join(" ")
    );
  }
  return templatesCache;
}

// ─── Text Cleaning & Search ────────────────────────────────────────────────

function cleanText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchScore(searchableText, query) {
  const terms = query.split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  let matched = 0;
  for (const term of terms) {
    if (searchableText.includes(term)) matched++;
  }
  return matched / terms.length;
}

// ─── Actions ───────────────────────────────────────────────────────────────

function slideSearch(textQuery, category, limit = 5) {
  if (!textQuery) throw new Error('Parameter "textQuery" is required for slideSearch.');

  const templates = loadTemplates();
  const query = cleanText(textQuery);

  let results = templates;
  if (category) {
    const catLower = category.toLowerCase();
    results = results.filter((t) => t.category === catLower);
  }

  results = results
    .map((t) => ({ ...t, _score: searchScore(t._searchText, query) }))
    .filter((t) => t._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  return results.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    placeholders: t.placeholders,
  }));
}

function slideTemplateGet(slideId) {
  if (!slideId) throw new Error('Parameter "slideId" is required for slideTemplateGet.');

  const templates = loadTemplates();
  const idLower = slideId.toLowerCase();
  const template = templates.find((t) => t.id.toLowerCase() === idLower);

  if (!template) {
    const partial = templates.filter((t) => t.id.toLowerCase().includes(idLower) || t.name.toLowerCase().includes(idLower));
    if (partial.length > 0) {
      return {
        error: `Slide "${slideId}" not found. Did you mean: ${partial.slice(0, 5).map((t) => `${t.id} (${t.name})`).join(", ")}?`,
        suggestions: partial.slice(0, 5).map((t) => t.id),
      };
    }
    return { error: `Slide "${slideId}" not found. Use slideSearch or slideList to find templates.` };
  }

  return {
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    placeholders: template.placeholders,
    template: template.template,
  };
}

function slideList(category) {
  const templates = loadTemplates();

  if (category) {
    const catLower = category.toLowerCase();
    const filtered = templates.filter((t) => t.category === catLower);
    return {
      category,
      count: filtered.length,
      slides: filtered.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description.substring(0, 100),
      })),
    };
  }

  const cats = {};
  for (const t of templates) {
    if (!cats[t.category]) cats[t.category] = [];
    cats[t.category].push({ id: t.id, name: t.name });
  }

  return {
    totalTemplates: templates.length,
    categories: Object.entries(cats).map(([name, slides]) => ({
      name,
      count: slides.length,
      slides,
    })),
  };
}

function slideCategories() {
  const templates = loadTemplates();
  const cats = {};
  for (const t of templates) {
    if (!cats[t.category]) cats[t.category] = { count: 0, ids: [] };
    cats[t.category].count++;
    cats[t.category].ids.push(t.id);
  }
  return {
    categories: Object.entries(cats).map(([name, data]) => ({
      name,
      count: data.count,
      slideIds: data.ids,
    })),
    usage:
      "Use slideSearch to find by query, slideTemplateGet to get full JSON, slideList for details.",
  };
}

// ─── Execute ───────────────────────────────────────────────────────────────

async function execute(params) {
  const { action, textQuery, slideId, category, limit } = params;

  if (!action) throw new Error('Parameter "action" is required.');

  switch (action) {
    case "slideSearch":
      return slideSearch(textQuery, category, limit || 5);
    case "slideTemplateGet":
      return slideTemplateGet(slideId);
    case "slideList":
      return slideList(category);
    case "slideCategories":
      return slideCategories();
    default:
      throw new Error(
        `Unknown action "${action}". Available: slideSearch, slideTemplateGet, slideList, slideCategories`
      );
  }
}

module.exports = { execute, schema };
