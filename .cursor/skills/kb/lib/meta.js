"use strict";
const fs = require("fs");
const path = require("path");
const { tierRoot, ensureDir, topicRef, tierRef } = require("./util");

function metaPath(ref) {
  return path.join(tierRoot(ref), "_meta", "index.json");
}

function read(ref) {
  const p = metaPath(ref);
  if (!fs.existsSync(p)) return { tier: tierRef(ref), topics: [], crossLinks: [] };
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function write(ref, data) {
  const p = metaPath(ref);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function registerTopic(ref, entry) {
  const data = read(ref);
  const idx = data.topics.findIndex(t => t.topic === ref.topic);
  const now = new Date().toISOString();
  const record = { topic: ref.topic, ...entry, lastUpdated: now };
  if (idx === -1) {
    record.created = record.created || now;
    data.topics.push(record);
  } else {
    Object.assign(data.topics[idx], record);
  }
  write(ref, data);
}

function unregisterTopic(ref) {
  const data = read(ref);
  data.topics = data.topics.filter(t => t.topic !== ref.topic);
  data.crossLinks = (data.crossLinks || []).filter(
    cl => !(cl.from.topic === ref.topic || cl.to.topicRef === topicRef(ref))
  );
  write(ref, data);
}

function findTopic(ref) {
  const data = read(ref);
  return data.topics.find(t => t.topic === ref.topic) || null;
}

// ---------- Cross-link direction policy ----------
// Stored in `from` tier's meta (so UAF stays clean of outbound records).
// Rule: UAF → UAF only. PROJECT/p → UAF + self. PERSONAL → anything.

function canLink(fromRef, toRef) {
  const sameRepo = fromRef.tier === toRef.tier && fromRef.project === toRef.project;
  if (sameRepo) return { ok: true };
  if (fromRef.tier === "UAF") return { ok: false, reason: "UAF cannot link outward (top tier)" };
  if (fromRef.tier === "PROJECT") {
    if (toRef.tier === "UAF") return { ok: true };
    return { ok: false, reason: `PROJECT/${fromRef.project} may only link to UAF or itself` };
  }
  if (fromRef.tier === "PERSONAL") {
    if (toRef.tier === "UAF" || toRef.tier === "PROJECT") return { ok: true };
    return { ok: false, reason: "PERSONAL can only link outward to UAF or PROJECT tiers" };
  }
  return { ok: false, reason: `Unknown tier ${fromRef.tier}` };
}

function addCrossLink(fromRef, fromArticle, toRef, toArticle, relation) {
  const gate = canLink(fromRef, toRef);
  if (!gate.ok) throw new Error(`Tier-violation: ${gate.reason}`);
  const data = read(fromRef);
  data.crossLinks = data.crossLinks || [];
  const entry = {
    from: { topic: fromRef.topic, article: fromArticle },
    to: { topicRef: topicRef(toRef), article: toArticle },
    relation: relation || "related-to",
  };
  const dupe = data.crossLinks.find(cl =>
    cl.from.topic === entry.from.topic &&
    cl.from.article === entry.from.article &&
    cl.to.topicRef === entry.to.topicRef &&
    cl.to.article === entry.to.article &&
    cl.relation === entry.relation
  );
  if (dupe) return false;
  data.crossLinks.push(entry);
  write(fromRef, data);
  return true;
}

function removeCrossLink(fromRef, fromArticle, toRef, toArticle) {
  const data = read(fromRef);
  const before = (data.crossLinks || []).length;
  data.crossLinks = (data.crossLinks || []).filter(cl => !(
    cl.from.topic === fromRef.topic &&
    cl.from.article === fromArticle &&
    cl.to.topicRef === topicRef(toRef) &&
    cl.to.article === toArticle
  ));
  write(fromRef, data);
  return before - data.crossLinks.length;
}

module.exports = { metaPath, read, write, registerTopic, unregisterTopic, findTopic, canLink, addCrossLink, removeCrossLink };
