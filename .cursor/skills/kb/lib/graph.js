"use strict";
const fs = require("fs");
const path = require("path");
const {
  topicDir, topicWikiDir, topicMoc, topicCanvas, topicIndex, topicConfig,
  listFilesRecursive, parseFrontmatter, extractInlineTags, extractWikilinks, extractTitle,
  topicRef,
} = require("./util");

function analyzeTopicArticles(ref) {
  const wikiDir = topicWikiDir(ref);
  const files = listFilesRecursive(wikiDir).filter(f => f.path.endsWith(".md"));
  const articles = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(wikiDir, f.path), "utf-8");
    const fm = parseFrontmatter(content);
    const inlineTags = extractInlineTags(content);
    const wikilinks = extractWikilinks(content);
    const title = extractTitle(content);
    const name = f.path.replace(/\.md$/, "");
    const allTags = [...new Set([...(fm.concepts || []), ...(fm.tags || []), ...inlineTags])];
    articles.push({ name, path: f.path, title, tags: allTags, wikilinks, fm });
  }
  return articles;
}

function buildLinkGraph(articles) {
  const names = new Set(articles.map(a => a.name));
  const incoming = new Map();
  const outgoing = new Map();
  for (const a of articles) { outgoing.set(a.name, []); incoming.set(a.name, []); }
  for (const a of articles) {
    for (const link of a.wikilinks) {
      let target = link.replace(/\.md$/, "");
      if (target.includes("/")) {
        const last = target.split("/").pop();
        if (!names.has(last)) continue;
        target = last;
      }
      if (names.has(target) && target !== a.name) {
        outgoing.get(a.name).push(target);
        incoming.get(target).push(a.name);
      }
    }
  }
  const scored = articles.map(a => ({
    ...a,
    incoming: incoming.get(a.name).length,
    outgoing: outgoing.get(a.name).length,
    total: incoming.get(a.name).length + outgoing.get(a.name).length,
  }));
  return { scored, incoming, outgoing };
}

function clusterByTags(scored) {
  const map = new Map();
  for (const a of scored) {
    for (const tag of a.tags) {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag).push(a);
    }
  }
  return [...map.entries()].filter(([, arts]) => arts.length >= 2).sort((a, b) => b[1].length - a[1].length);
}

// ---------- Map of Content generation ----------

function generateMoc(ref) {
  const articles = analyzeTopicArticles(ref);
  if (articles.length === 0) {
    return { content: `# ${ref.topic} — Map of Content\n\n*No articles yet.*\n`, stats: { total: 0, hubs: 0, orphans: 0 } };
  }
  const { scored } = buildLinkGraph(articles);
  const hubThreshold = Math.max(3, Math.ceil(articles.length * 0.15));
  const hubs = scored.filter(a => a.total >= hubThreshold).sort((a, b) => b.total - a.total);
  const orphans = scored.filter(a => a.total === 0);
  const clusters = clusterByTags(scored);

  const lines = [];
  lines.push(`# ${ref.topic} — Map of Content`);
  lines.push("");
  lines.push(`*${articles.length} articles · ${hubs.length} hubs · ${orphans.length} orphans*`);
  lines.push("");

  if (hubs.length) {
    lines.push("## Hubs");
    lines.push("");
    for (const h of hubs) lines.push(`- [[${h.name}]] (${h.total} links)${h.title ? ` — ${h.title}` : ""}`);
    lines.push("");
  }

  const inCluster = new Set();
  if (clusters.length) {
    lines.push("## By Concept");
    lines.push("");
    for (const [tag, arts] of clusters.slice(0, 20)) {
      lines.push(`### #${tag}`);
      lines.push("");
      for (const a of arts) {
        lines.push(`- [[${a.name}]]${a.title ? ` — ${a.title}` : ""}`);
        inCluster.add(a.name);
      }
      lines.push("");
    }
  }

  const rest = scored.filter(a => !inCluster.has(a.name) && a.total > 0 && !hubs.includes(a));
  if (rest.length) {
    lines.push("## Other Articles");
    lines.push("");
    for (const a of rest) lines.push(`- [[${a.name}]]${a.title ? ` — ${a.title}` : ""}`);
    lines.push("");
  }

  if (orphans.length) {
    lines.push("## Orphans");
    lines.push("");
    lines.push("*No incoming or outgoing wikilinks — consider connecting these.*");
    lines.push("");
    for (const a of orphans) lines.push(`- [[${a.name}]]${a.title ? ` — ${a.title}` : ""}`);
    lines.push("");
  }

  return {
    content: lines.join("\n"),
    stats: { total: articles.length, hubs: hubs.length, orphans: orphans.length, clusters: clusters.length },
  };
}

// ---------- Topic & subdir _index.md generation ----------

function humanize(name) {
  return name.split(/[-_]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join(" ");
}

function readTopicConfig(ref) {
  const cfgPath = topicConfig(ref);
  if (!fs.existsSync(cfgPath)) return {};
  try { return JSON.parse(fs.readFileSync(cfgPath, "utf-8")); } catch { return {}; }
}

// Group wiki files by their top-level path component under wiki/
function groupWikiFiles(ref) {
  const wikiDir = topicWikiDir(ref);
  if (!fs.existsSync(wikiDir)) return { rootFiles: [], subdirs: new Map() };
  const files = listFilesRecursive(wikiDir)
    .filter(f => f.path.endsWith(".md"))
    .filter(f => path.basename(f.path) !== "_index.md");
  const rootFiles = [];
  const subdirs = new Map();
  for (const f of files) {
    const parts = f.path.split("/");
    if (parts.length === 1) rootFiles.push(f);
    else {
      const top = parts[0];
      if (!subdirs.has(top)) subdirs.set(top, []);
      subdirs.get(top).push(f);
    }
  }
  return { rootFiles, subdirs };
}

function articleSummary(wikiDir, relPath) {
  try {
    const content = fs.readFileSync(path.join(wikiDir, relPath), "utf-8");
    const title = extractTitle(content);
    const stem = path.basename(relPath).replace(/\.md$/, "");
    return { stem, title, relPath };
  } catch {
    const stem = path.basename(relPath).replace(/\.md$/, "");
    return { stem, title: null, relPath };
  }
}

function generateTopicIndex(ref) {
  const cfg = readTopicConfig(ref);
  const title = humanize(ref.topic);
  const description = cfg.description || `${ref.topic} knowledge base`;
  const wikiDir = topicWikiDir(ref);
  const { rootFiles, subdirs } = groupWikiFiles(ref);
  const totalArticles = rootFiles.length + [...subdirs.values()].reduce((n, arr) => n + arr.length, 0);

  const lines = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(description);
  lines.push("");
  lines.push(`*${totalArticles} articles · ${subdirs.size} sub-area${subdirs.size === 1 ? "" : "s"}*`);
  lines.push("");

  if (totalArticles === 0) {
    lines.push("## Articles");
    lines.push("");
    lines.push("*No articles yet.*");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`See [[_moc]] for the full Map of Content (hubs, concept clusters, orphans).`);
  lines.push("");

  if (subdirs.size) {
    lines.push("## Sub-areas");
    lines.push("");
    const sortedSubs = [...subdirs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [name, arr] of sortedSubs) {
      lines.push(`- [[wiki/${name}/_index|${humanize(name)}]] — ${arr.length} article${arr.length === 1 ? "" : "s"}`);
    }
    lines.push("");
  }

  if (rootFiles.length) {
    lines.push("## Articles");
    lines.push("");
    const summaries = rootFiles
      .map(f => articleSummary(wikiDir, f.path))
      .sort((a, b) => a.stem.localeCompare(b.stem));
    for (const s of summaries) {
      lines.push(`- [[${s.stem}]]${s.title ? ` — ${s.title}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function generateSubdirIndex(ref, subDirRel) {
  const wikiDir = topicWikiDir(ref);
  const subDir = path.join(wikiDir, subDirRel);
  const all = listFilesRecursive(subDir);
  const mdFiles = all.filter(f => f.path.endsWith(".md") && f.path !== "_index.md");
  const directFiles = mdFiles.filter(f => !f.path.includes("/"));
  const nestedSubs = new Map();
  for (const f of mdFiles) {
    if (!f.path.includes("/")) continue;
    const top = f.path.split("/")[0];
    if (!nestedSubs.has(top)) nestedSubs.set(top, []);
    nestedSubs.get(top).push(f);
  }

  const title = humanize(subDirRel.split("/").pop());
  const lines = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`*${mdFiles.length} article${mdFiles.length === 1 ? "" : "s"} in this sub-area*`);
  lines.push("");

  if (nestedSubs.size) {
    lines.push("## Sub-areas");
    lines.push("");
    const sortedSubs = [...nestedSubs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [name, arr] of sortedSubs) {
      lines.push(`- [[${name}/_index|${humanize(name)}]] — ${arr.length} article${arr.length === 1 ? "" : "s"}`);
    }
    lines.push("");
  }

  if (directFiles.length) {
    lines.push("## Articles");
    lines.push("");
    const summaries = directFiles
      .map(f => articleSummary(subDir, f.path))
      .sort((a, b) => a.stem.localeCompare(b.stem));
    for (const s of summaries) {
      lines.push(`- [[${s.stem}]]${s.title ? ` — ${s.title}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// Walk every directory under wiki/ that contains markdown content.
function listSubdirsWithContent(ref) {
  const wikiDir = topicWikiDir(ref);
  if (!fs.existsSync(wikiDir)) return [];
  const out = [];
  function walk(absDir, relDir) {
    let entries;
    try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      if (!e.isDirectory()) continue;
      const childAbs = path.join(absDir, e.name);
      const childRel = relDir ? `${relDir}/${e.name}` : e.name;
      const md = listFilesRecursive(childAbs).filter(f => f.path.endsWith(".md") && f.path !== "_index.md");
      if (md.length) out.push(childRel);
      walk(childAbs, childRel);
    }
  }
  walk(wikiDir, "");
  return out;
}

function regenerateAllIndexes(ref) {
  const written = [];
  const topicIdxPath = topicIndex(ref);
  fs.writeFileSync(topicIdxPath, generateTopicIndex(ref) + "\n");
  written.push(topicIdxPath);

  const wikiDir = topicWikiDir(ref);
  for (const subRel of listSubdirsWithContent(ref)) {
    const subIdxPath = path.join(wikiDir, subRel, "_index.md");
    fs.writeFileSync(subIdxPath, generateSubdirIndex(ref, subRel) + "\n");
    written.push(subIdxPath);
  }
  return written;
}

// ---------- Canvas generation (Obsidian Canvas JSON) ----------

let _uidCounter = 0;
function uid() {
  const stamp = Date.now().toString(36).slice(-4);
  return `c${(_uidCounter++).toString(36)}${stamp}`;
}

function edgeSides(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? ["right", "left"] : ["left", "right"];
  return dy > 0 ? ["bottom", "top"] : ["top", "bottom"];
}

function generateCanvasTopic(ref) {
  const articles = analyzeTopicArticles(ref);
  const { scored } = buildLinkGraph(articles);
  const clusters = clusterByTags(scored);
  const hubThreshold = Math.max(3, Math.ceil(articles.length * 0.15));
  const hubNames = new Set(scored.filter(a => a.total >= hubThreshold).map(a => a.name));

  const NODE_W = 240, NODE_H = 80, COL_GAP = 60, ROW_GAP = 40, COLS = 3;
  const nodes = [];
  const nodeById = new Map();

  const placed = new Set();
  const putNode = (a, x, y) => {
    const id = uid();
    const node = {
      id, type: "file", file: `${ref.topic}/wiki/${a.path}`,
      x, y, width: NODE_W, height: NODE_H,
      color: hubNames.has(a.name) ? "4" : undefined,
    };
    if (!node.color) delete node.color;
    nodes.push(node);
    nodeById.set(a.name, node);
    placed.add(a.name);
  };

  let y = 0;
  // Place clusters first
  for (const [tag, arts] of clusters.slice(0, 10)) {
    let col = 0;
    let rowY = y;
    for (const a of arts) {
      if (placed.has(a.name)) continue;
      putNode(a, col * (NODE_W + COL_GAP), rowY);
      col++;
      if (col >= COLS) { col = 0; rowY += NODE_H + ROW_GAP; }
    }
    y = rowY + (col > 0 ? NODE_H + ROW_GAP : 0) + ROW_GAP;
  }
  // Remaining
  let col = 0;
  let rowY = y;
  for (const a of scored) {
    if (placed.has(a.name)) continue;
    putNode(a, col * (NODE_W + COL_GAP), rowY);
    col++;
    if (col >= COLS) { col = 0; rowY += NODE_H + ROW_GAP; }
  }

  // Edges (dedupe pair)
  const edges = [];
  const seen = new Set();
  for (const a of scored) {
    const from = nodeById.get(a.name);
    if (!from) continue;
    for (const target of a.wikilinks.map(l => l.replace(/\.md$/, "").split("/").pop())) {
      if (!nodeById.has(target)) continue;
      const key = [a.name, target].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const to = nodeById.get(target);
      const [fromSide, toSide] = edgeSides(from.x, from.y, to.x, to.y);
      edges.push({ id: uid(), fromNode: from.id, fromSide, toNode: to.id, toSide });
    }
  }

  return { nodes, edges };
}

function writeCanvas(ref, canvas) {
  const outPath = topicCanvas(ref);
  fs.writeFileSync(outPath, JSON.stringify(canvas, null, 2));
  return outPath;
}

// ---------- Tag normalization (from kb-fix-tags) ----------

function fixTagsArticle(content) {
  const inline = extractInlineTags(content);
  const hasFm = /^---\r?\n/.test(content);
  let changed = false;
  let out = content;
  if (!hasFm && inline.length) {
    const fm = `---\nconcepts: [${inline.join(", ")}]\naliases: []\ntags: [${inline.join(", ")}]\n---\n\n`;
    out = fm + content;
    changed = true;
  } else if (hasFm && inline.length) {
    const fmMatch = out.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fm = fmMatch[1];
    const mergeField = (key, values) => {
      const re = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`);
      const m = fm.match(re);
      if (!m) return fm + `\n${key}: [${values.join(", ")}]`;
      const existing = m[1].split(",").map(s => s.trim().replace(/['"]/g, "")).filter(Boolean);
      const merged = [...new Set([...existing, ...values])];
      if (merged.length === existing.length) return fm;
      return fm.replace(re, `${key}: [${merged.join(", ")}]`);
    };
    let newFm = mergeField("tags", inline);
    // Sync concepts only if empty
    const conceptsMatch = newFm.match(/concepts:\s*\[([^\]]*)\]/);
    if (conceptsMatch && !conceptsMatch[1].trim()) {
      newFm = newFm.replace(/concepts:\s*\[[^\]]*\]/, `concepts: [${inline.join(", ")}]`);
    }
    if (newFm !== fm) {
      out = out.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFm}\n---`);
      changed = true;
    }
  }
  const hasRelated = /^##\s+Related\s*$/m.test(out);
  return { content: out, changed, missingRelated: !hasRelated };
}

module.exports = {
  analyzeTopicArticles, buildLinkGraph, clusterByTags,
  generateMoc, generateCanvasTopic, writeCanvas, fixTagsArticle,
  generateTopicIndex, generateSubdirIndex, listSubdirsWithContent, regenerateAllIndexes,
};
