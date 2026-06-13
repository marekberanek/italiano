#!/usr/bin/env node
/**
 * Build static Expo web export and inject PWA service worker precache lists.
 *
 * Usage: npm run build:web
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const distDir = join(repoRoot, "dist");
const swTemplatePath = join(repoRoot, "public", "sw.js");
const bundleIdsFile = join(repoRoot, "lib", "content", "bundle-ids.ts");

async function readBundleIds() {
  const src = await readFile(bundleIdsFile, "utf8");
  const match = src.match(/export const CONTENT_BUNDLE_IDS = \[([\s\S]*?)\] as const/);
  if (!match) throw new Error("Could not parse CONTENT_BUNDLE_IDS from bundle-ids.ts");
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (ids.length === 0) throw new Error("CONTENT_BUNDLE_IDS is empty");
  return ids;
}

async function walkFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(full, base)));
    } else if (ent.isFile()) {
      out.push(relative(base, full));
    }
  }
  return out;
}

function shouldPrecache(relPath) {
  const p = relPath.replace(/\\/g, "/");
  if (p === "sw.js") return false;
  if (p.endsWith(".map")) return false;
  return (
    p.endsWith(".html") ||
    p.endsWith(".js") ||
    p.endsWith(".css") ||
    p.endsWith(".json") ||
    p.endsWith(".png") ||
    p.endsWith(".jpg") ||
    p.endsWith(".jpeg") ||
    p.endsWith(".webp") ||
    p.endsWith(".svg") ||
    p.endsWith(".ico") ||
    p.endsWith(".woff") ||
    p.endsWith(".woff2") ||
    p.endsWith(".ttf") ||
    p.endsWith(".otf")
  );
}

function runExpoExport() {
  const result = spawnSync("npx", ["expo", "export", "-p", "web"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  console.log("Exporting Expo web build…");
  runExpoExport();

  const files = await walkFiles(distDir);
  const precachePaths = files
    .filter(shouldPrecache)
    .map((f) => `/${posix.normalize(f.replace(/\\/g, "/"))}`)
    .sort();

  if (!precachePaths.includes("/index.html")) {
    const hasRootHtml = precachePaths.some((p) => p.endsWith(".html"));
    if (!hasRootHtml) {
      throw new Error("dist/ has no HTML entry — expo export may have failed");
    }
  }

  const bundleIds = await readBundleIds();
  const buildId = createHash("sha256")
    .update(precachePaths.join("\n") + bundleIds.join(","))
    .digest("hex")
    .slice(0, 12);

  let sw = await readFile(swTemplatePath, "utf8");
  sw = sw
    .replaceAll("__BUILD_ID__", buildId)
    .replaceAll("__PRECACHE_URLS__", JSON.stringify(precachePaths))
    .replaceAll("__CONTENT_BUNDLE_IDS__", JSON.stringify(bundleIds));

  await writeFile(join(distDir, "sw.js"), sw, "utf8");

  console.log(`PWA build ready: dist/ (${precachePaths.length} precached assets, ${bundleIds.length} content bundles, build ${buildId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
