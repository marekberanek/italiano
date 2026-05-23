/**
 * BookKit Download Skill
 *
 * Two-phase book download:
 *   Phase 1 (download) — Fetch all pages from BookKit API and save raw JSON
 *                         responses into bookkit/<name>/.
 *   Phase 2 (convert)  — Read raw JSON files from bookkit/<name>/ and convert
 *                         each page to Markdown in books/<name>/.
 *
 * Modes (controlled by `mode` parameter):
 *   "all"     — Phase 1 + Phase 2 (default)
 *   "download" — Phase 1 only
 *   "convert"  — Phase 2 only (requires existing raw data)
 */

const path = require("path");
const fs = require("fs");
const { parseBookKitUri } = require(
  path.join(__dirname, "../shared/bookkit.js"),
);
const { convertUu5StringToMarkdown } = require(
  path.join(__dirname, "../uu5string-to-markdown/lib/uu5string-to-markdown.js"),
);

const schema = {
  name: "bookkit-download",
  description:
    "Download a BookKit book and convert to Markdown. Raw JSON → bookkit/<name>/, Markdown → books/<name>/.",
  parameters: {
    url: {
      type: "string",
      required: true,
      description: "Any BookKit URL from the book",
    },
    name: {
      type: "string",
      required: true,
      description: "Book directory name (e.g. 'GCCIA'). Used for both bookkit/<name>/ and books/<name>/.",
    },
    mode: {
      type: "string",
      required: false,
      description:
        'Execution mode: "all" (download + convert, default), "download" (raw JSON only), "convert" (from existing raw data only).',
    },
  },
  returns: {
    message: "Summary of what was done",
    pageCount: "Number of pages processed",
    rawDir: "Directory with raw JSON pages (bookkit/<name>/)",
    booksDir: "Directory with Markdown pages (books/<name>/)",
  },
};

const BATCH_SIZE = 5;
const VALID_MODES = ["all", "download", "convert"];

async function execute(params, http) {
  const { url, name } = params;
  const mode = params.mode || "all";

  if (!name) throw new Error("name parameter is required");
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Invalid mode "${mode}". Must be one of: ${VALID_MODES.join(", ")}`);
  }
  if (mode !== "convert" && !url) {
    throw new Error("url parameter is required for download");
  }
  if (mode !== "convert" && !http) {
    throw new Error("http parameter is required. Use skilled-plus4u-mcp to execute this skill.");
  }

  const safeName = sanitizeFilename(name);
  const rawDir = path.resolve("bookkit", safeName);
  const booksDir = path.resolve("books", safeName);

  let pageEntries;
  let downloadedCount = 0;
  let convertedCount = 0;
  const errors = [];

  // ── Phase 1: Download ──

  if (mode === "all" || mode === "download") {
    const parsed = parseBookKitUri(url);
    const structure = await http.get(`${parsed.baseUri}/getBookStructure`);
    const itemMap = structure.itemMap;

    if (!itemMap || Object.keys(itemMap).length === 0) {
      return { message: "No pages found in the book", pageCount: 0, rawDir, booksDir };
    }

    const orderedPages = linearizeStructure(itemMap);
    const tree = buildTree(orderedPages);
    pageEntries = assignPaths(tree, "");

    const meta = {
      baseUri: parsed.baseUri,
      downloadedAt: new Date().toISOString(),
      pageCount: pageEntries.length,
      pages: pageEntries.map((e) => ({
        code: e.code,
        name: e.name,
        filePath: e.filePath,
      })),
    };
    fs.mkdirSync(rawDir, { recursive: true });
    fs.writeFileSync(path.join(rawDir, "_meta.json"), JSON.stringify(meta, null, 2), "utf-8");

    for (let i = 0; i < pageEntries.length; i += BATCH_SIZE) {
      const batch = pageEntries.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (entry) => {
          try {
            const apiUrl = `${parsed.baseUri}/loadPage?code=${encodeURIComponent(entry.code)}`;
            const pageData = await http.get(apiUrl);
            return { entry, pageData };
          } catch (err) {
            errors.push({ code: entry.code, error: err.message });
            return { entry, pageData: null };
          }
        }),
      );

      for (const { entry, pageData } of results) {
        if (!pageData) continue;
        const rawPath = path.join(rawDir, entry.filePath.replace(/\.md$/, ".json"));
        fs.mkdirSync(path.dirname(rawPath), { recursive: true });
        fs.writeFileSync(rawPath, JSON.stringify(pageData, null, 2), "utf-8");
        downloadedCount++;
      }
    }
  }

  // ── Phase 2: Convert ──

  if (mode === "all" || mode === "convert") {
    const metaPath = path.join(rawDir, "_meta.json");
    if (!fs.existsSync(metaPath)) {
      throw new Error(`No raw data found at ${rawDir}. Run with mode "download" first.`);
    }

    if (!pageEntries) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      pageEntries = meta.pages;
    }

    for (const entry of pageEntries) {
      const rawPath = path.join(rawDir, entry.filePath.replace(/\.md$/, ".json"));
      if (!fs.existsSync(rawPath)) continue;

      const pageData = JSON.parse(fs.readFileSync(rawPath, "utf-8"));
      const markdown = convertPageToMarkdown(entry, pageData);
      const mdPath = path.join(booksDir, entry.filePath);

      fs.mkdirSync(path.dirname(mdPath), { recursive: true });
      fs.writeFileSync(mdPath, markdown, "utf-8");
      convertedCount++;
    }
  }

  // ── Result ──

  const totalPages = pageEntries ? pageEntries.length : 0;
  const parts = [];
  if (mode === "all" || mode === "download") {
    parts.push(`Downloaded ${downloadedCount}/${totalPages} raw pages to ${rawDir}`);
  }
  if (mode === "all" || mode === "convert") {
    parts.push(`Converted ${convertedCount}/${totalPages} pages to ${booksDir}`);
  }

  const result = {
    message: parts.join(". "),
    pageCount: totalPages,
    rawDir,
    booksDir,
  };

  if (errors.length > 0) {
    result.errors = errors;
    result.message += ` (${errors.length} errors)`;
  }

  return result;
}

// --- Helpers ---

function getName(name) {
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    return name.en || name.cs || name.uk || Object.values(name)[0] || "";
  }
  return "";
}

function sanitizeFilename(str) {
  return str
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Traverses the itemMap linked list (previous/next pointers)
 * to produce an ordered array of { code, name, indent }.
 */
function linearizeStructure(itemMap) {
  let firstCode = null;
  for (const [code, item] of Object.entries(itemMap)) {
    if (!item.previous) {
      firstCode = code;
      break;
    }
  }

  if (!firstCode) {
    return Object.entries(itemMap).map(([code, item]) => ({
      code,
      name: getName(item.label),
      indent: item.indent || 0,
    }));
  }

  const ordered = [];
  let current = firstCode;
  const visited = new Set();

  while (current && itemMap[current] && !visited.has(current)) {
    visited.add(current);
    const item = itemMap[current];
    ordered.push({
      code: current,
      name: getName(item.label),
      indent: item.indent || 0,
    });
    current = item.next || null;
  }

  return ordered;
}

/**
 * Builds a tree from a flat page list ordered by DFS with indent levels.
 */
function buildTree(pages) {
  const root = { children: [] };
  const stack = [{ node: root, indent: -1 }];

  for (const page of pages) {
    const indent = page.indent || 0;
    const node = {
      code: page.code,
      name: page.name,
      indent,
      children: [],
    };

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, indent });
  }

  return root.children;
}

/**
 * Assigns filesystem paths to each page node.
 *
 * - Pages with children → directory with README.md
 * - Leaf pages → {code}.md file
 * - Single root → promoted to top level
 */
function assignPaths(nodes, basePath) {
  if (
    basePath === "" &&
    nodes.length === 1 &&
    nodes[0].children.length > 0
  ) {
    const root = nodes[0];
    const stem = makeFileStem(root.code, root.name);
    const entries = [
      {
        code: root.code,
        name: root.name,
        indent: root.indent,
        filePath: `${stem}.md`,
      },
    ];
    entries.push(...assignPathsInner(root.children, ""));
    return entries;
  }

  return assignPathsInner(nodes, basePath);
}

function makeFileStem(code, name) {
  const safeName = sanitizeFilename(name);
  return safeName ? `${code}-${safeName}` : code;
}

function assignPathsInner(nodes, basePath) {
  const result = [];

  for (const node of nodes) {
    const hasChildren = node.children.length > 0;
    const stem = makeFileStem(node.code, node.name);

    if (hasChildren) {
      const dirPath = path.join(basePath, stem);
      result.push({
        code: node.code,
        name: node.name,
        indent: node.indent,
        filePath: path.join(dirPath, "README.md"),
      });
      result.push(...assignPathsInner(node.children, dirPath));
    } else {
      result.push({
        code: node.code,
        name: node.name,
        indent: node.indent,
        filePath: path.join(basePath, stem + ".md"),
      });
    }
  }

  return result;
}

/**
 * Converts a loaded BookKit page to Markdown.
 */
function convertPageToMarkdown(entry, pageData) {
  const pageName = getName(pageData.name) || entry.name;
  const state = pageData.state || "";
  const pageCode = pageData.code || entry.code;

  const lines = [`# ${pageName}`, ""];

  if (state) lines.push(`**State:** ${state}`);
  lines.push(`**Page Code:** ${pageCode}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (pageData.desc && pageData.desc.content) {
    const descMd = convertUu5StringToMarkdown(pageData.desc.content);
    if (descMd) {
      lines.push(descMd);
      lines.push("");
    }
  }

  const sections = pageData.body || [];
  for (const section of sections) {
    if (!section.content) continue;
    const md = convertUu5StringToMarkdown(section.content);
    if (md) {
      lines.push(md);
      lines.push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

module.exports = { execute, schema };
