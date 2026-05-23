#!/usr/bin/env node
"use strict";
// Unified KB skill dispatcher. Runs without MCP. All ops pure Node + git CLI.
//
// Usage: node skill.js <command> [args...]
// See SKILL.md for commands.

const fs = require("fs");
const path = require("path");
const util = require("./lib/util");
const git = require("./lib/git");
const meta = require("./lib/meta");
const search = require("./lib/search");
const graph = require("./lib/graph");
const health = require("./lib/health");

// ---------- argv parsing ----------

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || /^--[a-zA-Z]/.test(next)) { flags[key] = true; }
      else { flags[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, flags };
}

function readStdin() {
  try { return fs.readFileSync(0, "utf-8"); } catch { return ""; }
}

function readContent(flags) {
  if (flags.file) return fs.readFileSync(flags.file, "utf-8");
  if (typeof flags.content === "string") return flags.content;
  return readStdin();
}

// ---------- output helpers ----------

function out(o) {
  if (typeof o === "string") process.stdout.write(o.endsWith("\n") ? o : o + "\n");
  else process.stdout.write(JSON.stringify(o, null, 2) + "\n");
}
function die(msg, code) {
  process.stderr.write("Error: " + msg + "\n");
  process.exit(code || 1);
}

// ---------- commands ----------

const commands = {};

commands.list = ({ flags }) => {
  const tierFilter = flags.tier;
  const topics = util.allTopics();
  const grouped = {};
  for (const ref of topics) {
    const tier = util.tierRef(ref);
    if (tierFilter && tier !== tierFilter && ref.tier !== tierFilter) continue;
    if (!grouped[tier]) grouped[tier] = [];
    grouped[tier].push(ref.topic);
  }
  out(grouped);
};

commands.info = ({ pos }) => {
  const spec = pos[0]; if (!spec) die("usage: info <TIER/.../<topic>>");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  if (!fs.existsSync(util.topicDir(ref))) die(`Topic does not exist: ${util.topicRef(ref)}`);
  const cfg = fs.existsSync(util.topicConfig(ref)) ? JSON.parse(fs.readFileSync(util.topicConfig(ref), "utf-8")) : {};
  const wikiFiles = util.listFilesRecursive(util.topicWikiDir(ref)).filter(f => f.path.endsWith(".md"));
  const rawFiles = util.listFilesRecursive(util.topicRawDir(ref));
  const record = meta.findTopic(ref) || {};
  out({ topic: util.topicRef(ref), config: cfg, metaRecord: record, counts: { wiki: wikiFiles.length, raw: rawFiles.length } });
};

commands["list-files"] = ({ pos }) => {
  const spec = pos[0]; if (!spec) die("usage: list-files <TIER/.../<topic>>");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const files = util.listFilesRecursive(util.topicDir(ref));
  out(files);
};

commands.read = ({ pos }) => {
  const spec = pos[0]; if (!spec) die("usage: read <TIER/.../<topic>/<relpath>>");
  const { ref, relPath } = util.parseFileSpec(spec);
  const base = util.topicDir(ref);
  const full = util.safePath(base, relPath);
  if (!fs.existsSync(full)) die(`File does not exist: ${spec}`);
  process.stdout.write(fs.readFileSync(full, "utf-8"));
};

commands.search = ({ pos, flags }) => {
  const spec = pos[0], query = pos.slice(1).join(" ");
  if (!spec || !query) die("usage: search <TIER/.../<topic>> <query>");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const res = search.searchTopic(ref, query, { mode: flags.mode, context: flags.context != null ? parseInt(flags.context, 10) : 2 });
  out(res);
};

commands["cross-search"] = ({ pos, flags }) => {
  const query = pos.join(" ");
  if (!query) die("usage: cross-search <query>");
  let refs = util.allTopics();
  if (flags.tier) refs = refs.filter(r => util.tierRef(r) === flags.tier || r.tier === flags.tier);
  const res = search.crossSearch(refs, query, { mode: flags.mode, context: flags.context != null ? parseInt(flags.context, 10) : 2 });
  out(res);
};

commands.write = ({ pos, flags }) => {
  const spec = pos[0]; if (!spec) die("usage: write <TIER/.../<topic>/<relpath>> [--content|--file|stdin]");
  const { ref, relPath } = util.parseFileSpec(spec);
  const base = util.topicDir(ref);
  if (!fs.existsSync(base)) die(`Topic does not exist: ${util.topicRef(ref)} — run \`init\` first`);
  const full = util.safePath(base, relPath);
  const content = readContent(flags);
  if (!content) die("No content (pass via --content, --file, or stdin)");
  util.ensureDir(path.dirname(full));
  const isNew = !fs.existsSync(full);
  fs.writeFileSync(full, content);
  const msg = flags.message || `${flags["commit-prefix"] || (isNew ? "add" : "update")}: ${util.topicRef(ref)}/${relPath}`;
  const committed = git.commit(ref, msg, [full]);
  out({ ok: true, action: isNew ? "created" : "updated", file: spec, committed });
};

commands["add-raw"] = ({ pos, flags }) => {
  const spec = pos[0], filename = pos[1];
  if (!spec || !filename) die("usage: add-raw <TIER/.../<topic>> <filename> [--source URL]");
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) die("Invalid filename");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const rawDir = util.topicRawDir(ref);
  util.ensureDir(rawDir);
  const full = util.safePath(rawDir, filename);
  let content = readContent(flags);
  if (!content) die("No content");
  if (flags.source && !content.startsWith("---")) {
    content = `---\nsource: ${flags.source}\ningested: ${new Date().toISOString()}\n---\n\n` + content;
  }
  fs.writeFileSync(full, content);
  git.commit(ref, `ingest: ${util.topicRef(ref)}/raw/${filename}`, [full]);
  out({ ok: true, file: `${util.topicRef(ref)}/raw/${filename}` });
};

commands.delete = ({ pos }) => {
  const spec = pos[0]; if (!spec) die("usage: delete <TIER/.../<topic>/<relpath>>");
  const { ref, relPath } = util.parseFileSpec(spec);
  const base = util.topicDir(ref);
  const full = util.safePath(base, relPath);
  if (!fs.existsSync(full)) die(`File does not exist: ${spec}`);
  fs.rmSync(full);
  util.removeEmptyDirs(path.dirname(full), base);
  git.commit(ref, `delete: ${util.topicRef(ref)}/${relPath}`);
  out({ ok: true, deleted: spec });
};

commands.move = ({ pos }) => {
  const fromSpec = pos[0], toSpec = pos[1];
  if (!fromSpec || !toSpec) die("usage: move <from> <to>");
  const from = util.parseFileSpec(fromSpec);
  const to = util.parseFileSpec(toSpec);
  if (util.topicRef(from.ref) !== util.topicRef(to.ref)) die("Cannot move across topics");
  const base = util.topicDir(from.ref);
  const src = util.safePath(base, from.relPath);
  const dst = util.safePath(base, to.relPath);
  if (!fs.existsSync(src)) die(`Source does not exist: ${fromSpec}`);
  util.ensureDir(path.dirname(dst));
  fs.renameSync(src, dst);
  util.removeEmptyDirs(path.dirname(src), base);
  git.commit(from.ref, `move: ${util.topicRef(from.ref)}/${from.relPath} → ${to.relPath}`);
  out({ ok: true, from: fromSpec, to: toSpec });
};

commands["compile-status"] = ({ pos }) => {
  const spec = pos[0]; if (!spec) die("usage: compile-status <TIER/.../<topic>>");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const rawFiles = util.listFilesRecursive(util.topicRawDir(ref));
  const wikiFiles = util.listFilesRecursive(util.topicWikiDir(ref)).filter(f => f.path.endsWith(".md"));
  const wikiStems = new Set(wikiFiles.map(f => f.path.replace(/\.md$/, "").split("/").pop()));
  const unprocessed = rawFiles.filter(f => !wikiStems.has(path.basename(f.path).replace(/\.[^.]+$/, "")));
  out({ topic: util.topicRef(ref), raw: rawFiles.length, wiki: wikiFiles.length, unprocessed: unprocessed.map(f => f.path) });
};

commands.moc = ({ pos, flags }) => {
  const spec = pos[0]; if (!spec) die("usage: moc <TIER/.../<topic>>");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const { content, stats } = graph.generateMoc(ref);
  if (flags.dry) { process.stdout.write(content); return; }
  const mocPath = util.topicMoc(ref);
  fs.writeFileSync(mocPath, content);
  const indexes = flags["skip-index"] ? [] : graph.regenerateAllIndexes(ref);
  git.commit(ref, `moc: regenerate ${util.topicRef(ref)}/_moc.md + indexes`, [mocPath, ...indexes]);
  out({ ok: true, path: `${util.topicRef(ref)}/_moc.md`, stats, indexesRegenerated: indexes.length });
};

commands.index = ({ pos, flags }) => {
  const spec = pos[0]; if (!spec) die("usage: index <TIER/.../<topic>> [--dry]");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  if (flags.dry) {
    process.stdout.write("# === " + util.topicRef(ref) + "/_index.md ===\n\n");
    process.stdout.write(graph.generateTopicIndex(ref) + "\n");
    for (const subRel of graph.listSubdirsWithContent(ref)) {
      process.stdout.write(`\n# === ${util.topicRef(ref)}/wiki/${subRel}/_index.md ===\n\n`);
      process.stdout.write(graph.generateSubdirIndex(ref, subRel) + "\n");
    }
    return;
  }
  const written = graph.regenerateAllIndexes(ref);
  git.commit(ref, `index: regenerate ${util.topicRef(ref)} indexes (${written.length} files)`, written);
  out({ ok: true, topic: util.topicRef(ref), files: written.length });
};

commands.canvas = ({ pos, flags }) => {
  if (flags.vault || (pos[0] === "--vault")) {
    // Vault-level canvas: all topics as nodes with their MOC files.
    const NODE_W = 300, NODE_H = 100, COL_GAP = 80, ROW_GAP = 60, COLS = 4;
    const topics = util.allTopics();
    const nodes = [];
    const nodeByTopic = new Map();
    topics.forEach((ref, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const id = `v${i}`;
      const color = ref.tier === "UAF" ? "4" : ref.tier === "PROJECT" ? "5" : "6";
      const tRef = util.topicRef(ref);
      const mocPath = `${tRef}/_moc.md`;
      nodes.push({ id, type: "file", file: mocPath, x: col * (NODE_W + COL_GAP), y: row * (NODE_H + ROW_GAP), width: NODE_W, height: NODE_H, color });
      nodeByTopic.set(tRef, { id, x: col * (NODE_W + COL_GAP), y: row * (NODE_H + ROW_GAP) });
    });
    const edges = [];
    const seen = new Set();
    for (const ref of topics) {
      const data = meta.read(ref);
      for (const cl of (data.crossLinks || [])) {
        const fromTopic = util.topicRef({ ...ref, topic: cl.from.topic });
        const toTopic = cl.to.topicRef;
        const key = [fromTopic, toTopic].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const a = nodeByTopic.get(fromTopic), b = nodeByTopic.get(toTopic);
        if (!a || !b) continue;
        edges.push({ id: `ve${edges.length}`, fromNode: a.id, fromSide: "right", toNode: b.id, toSide: "left" });
      }
    }
    const canvas = { nodes, edges };
    const p = path.join(util.KB_ROOT, "_vault.canvas");
    fs.writeFileSync(p, JSON.stringify(canvas, null, 2));
    out({ ok: true, path: p, topics: topics.length });
    return;
  }
  const spec = pos[0]; if (!spec) die("usage: canvas <TIER/.../<topic>> | --vault");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const canvas = graph.generateCanvasTopic(ref);
  const p = graph.writeCanvas(ref, canvas);
  git.commit(ref, `canvas: regenerate ${util.topicRef(ref)}/_canvas.canvas`, [p]);
  out({ ok: true, path: p, nodes: canvas.nodes.length, edges: canvas.edges.length });
};

commands["fix-tags"] = ({ pos, flags }) => {
  const spec = pos[0]; if (!spec) die("usage: fix-tags <TIER/.../<topic>> [--dry]");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const wikiDir = util.topicWikiDir(ref);
  const files = util.listFilesRecursive(wikiDir).filter(f => f.path.endsWith(".md"));
  const changed = [];
  const missingRelated = [];
  for (const f of files) {
    const full = path.join(wikiDir, f.path);
    const content = fs.readFileSync(full, "utf-8");
    const res = graph.fixTagsArticle(content);
    if (res.changed) {
      changed.push(f.path);
      if (!flags.dry) fs.writeFileSync(full, res.content);
    }
    if (res.missingRelated) missingRelated.push(f.path);
  }
  if (!flags.dry && changed.length) git.commit(ref, `lint: fix-tags on ${util.topicRef(ref)}`);
  out({ ok: true, dry: !!flags.dry, changed, missingRelated });
};

commands.health = ({ pos }) => {
  if (pos[0]) {
    const parsed = util.parseTopicSpec(pos[0]);
    const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
    out({ topic: util.topicRef(ref), issues: health.checkTopic(ref) });
    return;
  }
  out(health.checkAll());
};

commands.init = ({ pos, flags }) => {
  const spec = pos[0]; if (!spec) die("usage: init <TIER/.../<topic>> [--description \"...\"] [--tags a,b]");
  const parsed = util.parseTopicSpec(spec);
  if (!parsed.topic) die("topic name required");
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const dir = util.topicDir(ref);
  if (fs.existsSync(dir)) die(`Topic already exists: ${util.topicRef(ref)}`);
  git.ensureRepo(ref);
  util.ensureDir(util.topicRawDir(ref));
  util.ensureDir(util.topicWikiDir(ref));
  const tags = flags.tags ? String(flags.tags).split(",").map(s => s.trim()).filter(Boolean) : [];
  const description = flags.description || `${ref.topic} knowledge base`;
  const cfg = { topic: ref.topic, tier: util.tierRef(ref), description, tags, created: new Date().toISOString(), autoCompile: true };
  fs.writeFileSync(util.topicConfig(ref), JSON.stringify(cfg, null, 2) + "\n");
  fs.writeFileSync(util.topicIndex(ref), graph.generateTopicIndex(ref) + "\n");
  meta.registerTopic(ref, { description, tags });
  git.commit(ref, `init: ${util.topicRef(ref)}`, [dir]);
  out({ ok: true, topic: util.topicRef(ref), path: dir });
};

commands.destroy = ({ pos, flags }) => {
  const spec = pos[0]; if (!spec) die("usage: destroy <TIER/.../<topic>> --yes");
  if (!flags.yes) die("Refusing to destroy without --yes");
  const parsed = util.parseTopicSpec(spec);
  const ref = { tier: parsed.tier, project: parsed.project, topic: parsed.topic };
  const dir = util.topicDir(ref);
  if (!fs.existsSync(dir)) die(`Topic does not exist: ${util.topicRef(ref)}`);
  util.rmRecursive(dir);
  try { meta.unregisterTopic(ref); } catch { /* ignore */ }
  git.commit(ref, `destroy: ${util.topicRef(ref)}`);
  out({ ok: true, destroyed: util.topicRef(ref) });
};

commands["cross-link"] = ({ pos, flags }) => {
  const action = pos[0];
  if (!["add", "remove"].includes(action)) die("usage: cross-link add|remove --from <file-spec> --to <file-spec> [--relation R]");
  if (!flags.from || !flags.to) die("--from and --to required");
  const from = util.parseFileSpec(flags.from);
  const to = util.parseFileSpec(flags.to);
  const fromArticle = from.relPath.replace(/^wiki\//, "").replace(/\.md$/, "");
  const toArticle = to.relPath.replace(/^wiki\//, "").replace(/\.md$/, "");
  if (action === "add") {
    const added = meta.addCrossLink(from.ref, fromArticle, to.ref, toArticle, flags.relation);
    if (added) git.commit(from.ref, `meta: cross-link ${util.topicRef(from.ref)}/${fromArticle} → ${util.topicRef(to.ref)}/${toArticle}`);
    out({ ok: true, added });
  } else {
    const removed = meta.removeCrossLink(from.ref, fromArticle, to.ref, toArticle);
    if (removed) git.commit(from.ref, `meta: remove cross-link ${util.topicRef(from.ref)}/${fromArticle} → ${util.topicRef(to.ref)}/${toArticle}`);
    out({ ok: true, removed });
  }
};

commands.sync = ({ pos }) => {
  const results = {};
  if (pos[0]) {
    const parsed = util.parseTopicSpec(pos[0] + (pos[0].includes("/") ? "" : "/_"));
    const ref = { tier: parsed.tier, project: parsed.project };
    results[util.tierRef(ref)] = git.pull(ref);
  } else {
    // All tier repos
    const seen = new Set();
    for (const t of util.allTiers()) {
      const key = util.tierRef(t);
      if (seen.has(key)) continue;
      seen.add(key);
      results[key] = git.pull(t);
    }
  }
  out(results);
};

commands.help = () => {
  out([
    "Commands:",
    "  list [--tier UAF|PERSONAL|PROJECT/<p>]",
    "  info <TIER/.../<topic>>",
    "  list-files <TIER/.../<topic>>",
    "  read <TIER/.../<topic>/<relpath>>",
    "  search <TIER/.../<topic>> <query> [--mode text|tag|backlink|concept] [--context N]",
    "  cross-search <query> [--tier T]",
    "  write <TIER/.../<topic>/<relpath>> [--content '...'|--file path|stdin] [--message M]",
    "  add-raw <TIER/.../<topic>> <filename> [--source URL]",
    "  delete <TIER/.../<topic>/<relpath>>",
    "  move <from> <to>",
    "  compile-status <TIER/.../<topic>>",
    "  moc <TIER/.../<topic>> [--dry] [--skip-index]",
    "  index <TIER/.../<topic>> [--dry]",
    "  canvas <TIER/.../<topic>> | canvas --vault",
    "  fix-tags <TIER/.../<topic>> [--dry]",
    "  health [<TIER/.../<topic>>]",
    "  init <TIER/.../<topic>> [--description D] [--tags a,b]",
    "  destroy <TIER/.../<topic>> --yes",
    "  cross-link add|remove --from <file-spec> --to <file-spec> [--relation R]",
    "  sync [<tier>]",
    "",
    "TIER = UAF | PERSONAL | PROJECT/<proj>",
    "Env: KB_ROOT (default ~/knowledge-bases)",
  ].join("\n"));
};

// ---------- main ----------

function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === "--help" || cmd === "-h") { commands.help({ pos: [], flags: {} }); return; }
  const handler = commands[cmd];
  if (!handler) die(`Unknown command: ${cmd}. Run with no args for help.`, 2);
  const parsed = parseArgs(rest);
  try { handler(parsed); }
  catch (e) { die(e.message); }
}

main();
