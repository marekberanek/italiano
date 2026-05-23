"use strict";
const fs = require("fs");
const path = require("path");
const { topicWikiDir, topicDir, listFilesRecursive, topicRef } = require("./util");

function detectMode(query) {
  if (query.startsWith("#")) return "tag";
  if (query.startsWith("[[") && query.endsWith("]]")) return "backlink";
  if (query.startsWith("concept:")) return "concept";
  return "text";
}

function grepFiles(dir, query, contextLines) {
  contextLines = contextLines != null ? contextLines : 2;
  if (!fs.existsSync(dir)) return "";
  const files = listFilesRecursive(dir).filter(f => f.path.endsWith(".md"));
  if (files.length === 0) return "";
  let pattern;
  try { pattern = new RegExp(query, "i"); }
  catch { pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }
  const out = [];
  for (const f of files) {
    const filePath = path.join(dir, f.path);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    const hits = [];
    for (let i = 0; i < lines.length; i++) if (pattern.test(lines[i])) hits.push(i);
    if (hits.length === 0) continue;
    const ranges = [];
    for (const idx of hits) {
      const start = Math.max(0, idx - contextLines);
      const end = Math.min(lines.length - 1, idx + contextLines);
      if (ranges.length && start <= ranges[ranges.length - 1].end + 1) {
        ranges[ranges.length - 1].end = end;
        ranges[ranges.length - 1].matches.push(idx);
      } else ranges.push({ start, end, matches: [idx] });
    }
    for (let r = 0; r < ranges.length; r++) {
      if (r > 0) out.push("--");
      const range = ranges[r];
      for (let i = range.start; i <= range.end; i++) {
        const sep = range.matches.includes(i) ? ":" : "-";
        out.push(`./${f.path}${sep}${i + 1}${sep}${lines[i]}`);
      }
    }
  }
  return out.join("\n");
}

function searchTopic(ref, query, opts) {
  opts = opts || {};
  const mode = opts.mode || detectMode(query);
  const ctx = opts.context != null ? opts.context : 2;
  const wikiDir = topicWikiDir(ref);
  if (mode === "tag") {
    const tag = query.startsWith("#") ? query : "#" + query;
    return { mode, hits: grepFiles(wikiDir, tag, 1) };
  }
  if (mode === "backlink") {
    const name = query.replace(/^\[\[/, "").replace(/\]\]$/, "");
    const pat = "\\[\\[" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return { mode, hits: grepFiles(wikiDir, pat, 1) };
  }
  if (mode === "concept") {
    const name = query.replace(/^concept:/, "");
    const results = [];
    const files = listFilesRecursive(wikiDir).filter(f => f.path.endsWith(".md"));
    for (const f of files) {
      const content = fs.readFileSync(path.join(wikiDir, f.path), "utf-8");
      const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fmMatch) continue;
      const fm = fmMatch[1];
      const check = (key) => {
        const m = fm.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
        if (!m) return null;
        const vals = m[1].split(",").map(s => s.trim().replace(/['"]/g, ""));
        return vals.some(v => v.toLowerCase().includes(name.toLowerCase())) ? vals : null;
      };
      const conceptHit = check("concepts");
      if (conceptHit) { results.push({ file: f.path, field: "concepts", values: conceptHit }); continue; }
      const aliasHit = check("aliases");
      if (aliasHit) results.push({ file: f.path, field: "aliases", values: aliasHit });
    }
    return { mode, hits: results };
  }
  return { mode: "text", hits: grepFiles(wikiDir, query, ctx) };
}

function crossSearch(refs, query, opts) {
  const out = [];
  for (const ref of refs) {
    const res = searchTopic(ref, query, opts);
    const has = Array.isArray(res.hits) ? res.hits.length > 0 : !!res.hits;
    if (has) out.push({ topic: topicRef(ref), ...res });
  }
  return out;
}

module.exports = { detectMode, grepFiles, searchTopic, crossSearch };
