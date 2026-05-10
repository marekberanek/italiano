#!/usr/bin/env node
/**
 * Upload every `assets/data/<bundle>.json` to `public.content_bundles` in
 * Supabase, then bump `public.content_meta.value` (key='version') so clients
 * re-pull on next sync.
 *
 * The set of bundle IDs is read from `lib/content/bundle-ids.ts` so this
 * script and the mobile app stay in sync.
 *
 * Setup
 * -----
 * Reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `backend/.env.local`
 * (gitignored). The service role key bypasses RLS and is required to write to
 * `content_bundles` (the `anon` role only has SELECT). Never ship that key in
 * the mobile app.
 *
 * Run
 * ---
 *     npm run db:migrate     # one-off, creates the tables
 *     npm run content:push   # uploads / refreshes all bundles
 *
 * Implementation note: we talk to PostgREST (Supabase REST API) directly via
 * `fetch` instead of `@supabase/supabase-js`, because that library pulls in
 * the realtime websocket client which fails on Node < 22 without a `ws`
 * polyfill — we don't need realtime here.
 */

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const dataDir = join(repoRoot, "assets", "data");
const bundleIdsFile = join(repoRoot, "lib", "content", "bundle-ids.ts");
const dotenvPath = process.env.DOTENV ?? join(repoRoot, "backend", ".env.local");

async function loadDotenv(path) {
  try {
    const raw = await readFile(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

async function loadBundleIds() {
  const src = await readFile(bundleIdsFile, "utf8");
  const match = src.match(/CONTENT_BUNDLE_IDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) {
    throw new Error(`Could not find CONTENT_BUNDLE_IDS in ${bundleIdsFile}`);
  }
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (ids.length === 0) {
    throw new Error(`No bundle IDs parsed from ${bundleIdsFile}`);
  }
  return ids;
}

function shortHash(payload) {
  const json = JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex").slice(0, 12);
}

async function postgrestUpsert(baseUrl, serviceKey, table, rows, onConflict) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PostgREST ${table} upsert ${res.status}: ${body}`);
  }
}

async function main() {
  await loadDotenv(dotenvPath);

  const baseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!baseUrl || !serviceKey) {
    console.error(
      `\nSUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing.\n` +
        `Add both to ${dotenvPath} (Supabase Dashboard → Project Settings → API).\n` +
        `The service role key bypasses RLS and is required to write to content_bundles.\n`,
    );
    process.exit(1);
  }

  const ids = await loadBundleIds();
  const onDisk = new Set((await readdir(dataDir)).filter((f) => f.endsWith(".json")));

  console.log(`Pushing ${ids.length} bundles to ${baseUrl} …\n`);

  const rows = [];
  for (const id of ids) {
    const file = `${id}.json`;
    if (!onDisk.has(file)) {
      console.warn(`· ${id}: missing ${file} in assets/data/, skipped`);
      continue;
    }
    const raw = await readFile(join(dataDir, file), "utf8");
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      console.error(`· ${id}: invalid JSON — ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
    rows.push({ id, version: shortHash(payload), payload });
  }

  const chunkSize = 5;
  let pushed = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    try {
      await postgrestUpsert(baseUrl, serviceKey, "content_bundles", slice, "id");
    } catch (err) {
      console.error(`\n${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
    for (const r of slice) {
      console.log(`· ${r.id.padEnd(16)} ${r.version}`);
    }
    pushed += slice.length;
  }

  const manifestVersion = new Date().toISOString();
  try {
    await postgrestUpsert(
      baseUrl,
      serviceKey,
      "content_meta",
      [{ key: "version", value: manifestVersion, updated_at: manifestVersion }],
      "key",
    );
  } catch (err) {
    console.error(`\n${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  console.log(`\nPushed ${pushed} bundles. Manifest version → ${manifestVersion}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
