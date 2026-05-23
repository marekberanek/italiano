"use strict";
const fs = require("fs");
const path = require("path");
const {
  topicDir, topicIndex, topicMoc, topicRawDir, topicWikiDir,
  listFilesRecursive, parseFrontmatter, extractWikilinks, topicRef, allTopics, parseTopicSpec, tierRoot,
} = require("./util");
const meta = require("./meta");

function checkTopic(ref) {
  const issues = [];
  const add = (severity, msg) => issues.push({ severity, msg });
  const dir = topicDir(ref);
  if (!fs.existsSync(dir)) { add("error", `Topic dir missing: ${dir}`); return issues; }

  if (!fs.existsSync(topicIndex(ref))) add("warning", "Missing _index.md");
  if (!fs.existsSync(topicMoc(ref))) add("info", "Missing _moc.md (run `kb moc`)");

  const rawDir = topicRawDir(ref);
  const wikiDir = topicWikiDir(ref);
  const wikiFiles = listFilesRecursive(wikiDir).filter(f => f.path.endsWith(".md"));
  const wikiStems = new Set(wikiFiles.map(f => f.path.replace(/\.md$/, "").split("/").pop()));
  const rawFiles = listFilesRecursive(rawDir);

  // Unprocessed raw files
  for (const f of rawFiles) {
    const stem = path.basename(f.path).replace(/\.[^.]+$/, "");
    if (!wikiStems.has(stem)) add("info", `Unprocessed raw: raw/${f.path}`);
  }

  // Frontmatter / graph
  const articles = [];
  for (const f of wikiFiles) {
    const content = fs.readFileSync(path.join(wikiDir, f.path), "utf-8");
    const fm = parseFrontmatter(content);
    if (!fm.raw) add("warning", `No frontmatter: wiki/${f.path}`);
    else if (!fm.tags || fm.tags.length === 0) add("info", `No tags in frontmatter: wiki/${f.path}`);
    if (!/^##\s+Related\s*$/m.test(content)) add("info", `Missing "## Related" section: wiki/${f.path}`);
    articles.push({ name: f.path.replace(/\.md$/, "").split("/").pop(), path: f.path, wikilinks: extractWikilinks(content) });
  }

  // Graph orphans
  const incoming = new Set();
  const names = new Set(articles.map(a => a.name));
  for (const a of articles) for (const l of a.wikilinks) {
    const target = l.replace(/\.md$/, "").split("/").pop();
    if (names.has(target)) incoming.add(target);
  }
  for (const a of articles) if (!incoming.has(a.name)) add("info", `Graph orphan: wiki/${a.path}`);

  return issues;
}

function checkTierViolations() {
  const issues = [];
  const topics = allTopics();
  for (const ref of topics) {
    try {
      const data = meta.read(ref);
      for (const cl of (data.crossLinks || [])) {
        const toSpec = cl.to.topicRef;
        let toParts;
        try { toParts = parseTopicSpec(toSpec + "/_"); } catch { issues.push({ severity: "warning", msg: `Bad cross-link target in ${topicRef(ref)}: ${toSpec}` }); continue; }
        const toRef = { tier: toParts.tier, project: toParts.project, topic: toParts.topic };
        const fromRef = { ...ref, topic: cl.from.topic };
        const gate = meta.canLink(fromRef, toRef);
        if (!gate.ok) issues.push({ severity: "error", msg: `Tier violation in ${topicRef(fromRef)}: ${gate.reason} (link to ${toSpec})` });
        // existence
        const toTierRoot = tierRoot(toRef);
        if (!fs.existsSync(path.join(toTierRoot, toRef.topic))) {
          issues.push({ severity: "warning", msg: `Broken cross-link from ${topicRef(fromRef)} → ${toSpec} (target topic missing)` });
        }
      }
    } catch (e) { /* tier may not exist */ }
  }
  return issues;
}

function checkAll() {
  const out = { topics: {}, violations: checkTierViolations() };
  for (const ref of allTopics()) {
    out.topics[topicRef(ref)] = checkTopic(ref);
  }
  return out;
}

module.exports = { checkTopic, checkTierViolations, checkAll };
