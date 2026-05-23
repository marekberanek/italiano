"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");

const KB_ROOT = process.env.KB_ROOT || path.join(os.homedir(), "knowledge-bases");
const TIERS = ["UAF", "PROJECT", "PERSONAL"];

// ---------- Tier + topic references ----------

function tierRoot(ref) {
  if (ref.tier === "UAF") return path.join(KB_ROOT, "UAF");
  if (ref.tier === "PERSONAL") return path.join(KB_ROOT, "PERSONAL");
  if (ref.tier === "PROJECT") {
    if (!ref.project) throw new Error("PROJECT tier requires project name");
    return path.join(KB_ROOT, "PROJECT", ref.project);
  }
  throw new Error(`Unknown tier: ${ref.tier}`);
}

function parseTopicSpec(spec) {
  if (!spec) throw new Error("topic spec is required");
  const parts = spec.split("/").filter(Boolean);
  const tier = parts[0];
  if (!TIERS.includes(tier)) throw new Error(`Topic must start with UAF/, PERSONAL/ or PROJECT/<proj>/ — got: "${spec}"`);
  if (tier === "PROJECT") {
    if (parts.length < 2) throw new Error("PROJECT spec needs project name: PROJECT/<proj>/<topic>");
    return { tier, project: parts[1], topic: parts[2] || null, rest: parts.slice(3).join("/") || null };
  }
  return { tier, project: null, topic: parts[1] || null, rest: parts.slice(2).join("/") || null };
}

// Parse "<TIER>/.../<topic>/<relpath>" → {ref, relPath}
function parseFileSpec(spec) {
  const parts = spec.split("/").filter(Boolean);
  const tier = parts[0];
  if (!TIERS.includes(tier)) throw new Error(`File spec must start with tier: ${spec}`);
  let ref, relStart;
  if (tier === "PROJECT") {
    ref = { tier, project: parts[1], topic: parts[2] };
    relStart = 3;
  } else {
    ref = { tier, project: null, topic: parts[1] };
    relStart = 2;
  }
  if (!ref.topic) throw new Error(`File spec missing topic: ${spec}`);
  const relPath = parts.slice(relStart).join("/");
  if (!relPath) throw new Error(`File spec missing relative path: ${spec}`);
  return { ref, relPath };
}

function topicDir(ref) {
  if (!ref.topic) throw new Error("topic is required");
  return path.join(tierRoot(ref), ref.topic);
}

function topicRef(ref) {
  return ref.tier === "PROJECT"
    ? `PROJECT/${ref.project}/${ref.topic}`
    : `${ref.tier}/${ref.topic}`;
}

function tierRef(ref) {
  return ref.tier === "PROJECT" ? `PROJECT/${ref.project}` : ref.tier;
}

function safePath(base, rel) {
  const resolved = path.resolve(base, rel);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error(`Path "${rel}" escapes "${base}"`);
  }
  return resolved;
}

function topicRawDir(ref) { return path.join(topicDir(ref), "raw"); }
function topicWikiDir(ref) { return path.join(topicDir(ref), "wiki"); }
function topicConfig(ref) { return path.join(topicDir(ref), ".kb.json"); }
function topicIndex(ref) { return path.join(topicDir(ref), "_index.md"); }
function topicMoc(ref) { return path.join(topicDir(ref), "_moc.md"); }
function topicCanvas(ref) { return path.join(topicDir(ref), "_canvas.canvas"); }

// ---------- File helpers ----------

function listFilesRecursive(dir, base) {
  base = base || dir;
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, base));
    else {
      const stat = fs.statSync(full);
      out.push({ path: path.relative(base, full).split(path.sep).join("/"), size: stat.size, modified: stat.mtime.toISOString() });
    }
  }
  return out;
}

function rmRecursive(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function removeEmptyDirs(dir, stopAt) {
  if (dir === stopAt || !dir.startsWith(stopAt)) return;
  try {
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
      removeEmptyDirs(path.dirname(dir), stopAt);
    }
  } catch { /* ignore */ }
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

// ---------- Frontmatter + link extraction ----------

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = m[1];
  const extract = (key) => {
    const mm = fm.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
    return mm ? mm[1].split(",").map(v => v.trim().replace(/['"]/g, "")).filter(Boolean) : [];
  };
  return { concepts: extract("concepts"), tags: extract("tags"), aliases: extract("aliases"), raw: fm };
}

function extractInlineTags(content) {
  const m = content.match(/^#[a-z][\w-]*(?:\s+#[a-z][\w-]*)*\s*$/m);
  if (!m) return [];
  return (m[0].match(/#[a-z][\w-]*/g) || []).map(t => t.slice(1));
}

function extractWikilinks(content) {
  const out = [];
  const re = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let m;
  while ((m = re.exec(content)) !== null) out.push(m[1].trim());
  return out;
}

function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

// ---------- Discovery ----------

function listTopicsInTier(ref) {
  const root = tierRoot(ref);
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
    .map(e => e.name);
}

function listProjects() {
  const root = path.join(KB_ROOT, "PROJECT");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith("."))
    .map(e => e.name);
}

function allTiers() {
  const out = [];
  if (fs.existsSync(path.join(KB_ROOT, "UAF"))) out.push({ tier: "UAF", project: null });
  if (fs.existsSync(path.join(KB_ROOT, "PERSONAL"))) out.push({ tier: "PERSONAL", project: null });
  for (const p of listProjects()) out.push({ tier: "PROJECT", project: p });
  return out;
}

function allTopics() {
  const out = [];
  for (const t of allTiers()) {
    for (const topic of listTopicsInTier(t)) {
      out.push({ ...t, topic });
    }
  }
  return out;
}

module.exports = {
  KB_ROOT, TIERS,
  tierRoot, parseTopicSpec, parseFileSpec, topicDir, topicRef, tierRef,
  safePath, topicRawDir, topicWikiDir, topicConfig, topicIndex, topicMoc, topicCanvas,
  listFilesRecursive, rmRecursive, removeEmptyDirs, ensureDir,
  parseFrontmatter, extractInlineTags, extractWikilinks, extractTitle,
  listTopicsInTier, listProjects, allTiers, allTopics,
};
