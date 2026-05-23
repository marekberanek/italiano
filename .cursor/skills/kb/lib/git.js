"use strict";
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { tierRoot, ensureDir } = require("./util");

function run(cwd, args) {
  return cp.execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function repoRoot(ref) {
  return tierRoot(ref);
}

function ensureRepo(ref) {
  const root = repoRoot(ref);
  ensureDir(root);
  if (!fs.existsSync(path.join(root, ".git"))) {
    run(root, ["init"]);
    const gi = path.join(root, ".gitignore");
    if (!fs.existsSync(gi)) fs.writeFileSync(gi, ".obsidian/\n.trash/\n");
    run(root, ["add", ".gitignore"]);
    try { run(root, ["commit", "-m", "init: initialize knowledge base repository"]); } catch { /* nothing to commit */ }
  }
  return root;
}

function commit(ref, message, paths) {
  const root = ensureRepo(ref);
  if (paths && paths.length) {
    for (const p of paths) {
      const rel = path.relative(root, p) || ".";
      try { run(root, ["add", rel]); } catch (e) { /* ignore */ }
    }
  } else {
    run(root, ["add", "-A"]);
  }
  // Always try to include _meta
  const metaRel = path.relative(root, path.join(root, "_meta"));
  if (fs.existsSync(path.join(root, "_meta"))) {
    try { run(root, ["add", metaRel]); } catch { /* ignore */ }
  }
  try {
    run(root, ["diff", "--cached", "--quiet"]);
    return false; // nothing staged
  } catch {
    run(root, ["commit", "-m", message]);
    return true;
  }
}

function status(ref) {
  const root = repoRoot(ref);
  if (!fs.existsSync(path.join(root, ".git"))) return "uninitialized";
  try { return run(root, ["status", "--short"]); } catch { return ""; }
}

function pull(ref) {
  const root = repoRoot(ref);
  try { run(root, ["fetch"]); } catch { return { ok: false, reason: "no remote" }; }
  try {
    const counts = run(root, ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]).split(/\s+/);
    const ahead = parseInt(counts[0] || "0", 10);
    const behind = parseInt(counts[1] || "0", 10);
    if (behind === 0) return { ok: true, behind: 0, ahead };
    run(root, ["pull", "--ff-only"]);
    return { ok: true, behind, ahead, pulled: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

module.exports = { run, repoRoot, ensureRepo, commit, status, pull };
