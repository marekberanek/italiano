#!/usr/bin/env node
/**
 * Apply every `supabase/migrations/*.sql` file (sorted by filename) to the
 * Supabase Postgres pointed at by SUPABASE_DB_URL.
 *
 * Why this exists
 * ---------------
 * The official `supabase` CLI is the "right" way to do this, but it requires a
 * separate install + login + link step. For a single-developer project that's
 * a lot of friction, so this script lets you run migrations using just Node
 * and a connection string from `backend/.env.local` (or any env file you
 * point it at via DOTENV).
 *
 * Setup
 * -----
 * 1. Supabase Dashboard → open your project → click the green **Connect**
 *    button (top bar). In the modal, pick **Session pooler** (or "Session
 *    mode" / port 5432 on the pooler host `*.pooler.supabase.com`) → copy the
 *    **URI** string. Replace `[YOUR-PASSWORD]` with the database password from
 *    project creation (or reset under *Database → Settings* in the Database
 *    area — not under ⚙ Project Settings).
 * 2. Add to `backend/.env.local` (gitignored):
 *
 *      SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<host>:6543/postgres
 *
 * 3. Run:
 *
 *      npm run db:migrate
 *
 * The script is idempotent — every shipped migration uses
 * `create … if not exists`, `add column if not exists`, `drop policy if
 * exists` + `create policy`, so re-running it is safe.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");
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

async function main() {
  await loadDotenv(dotenvPath);

  const connectionString = process.env.SUPABASE_DB_URL?.trim();
  if (!connectionString) {
    console.error(
      `\n❌ SUPABASE_DB_URL is not set.\n` +
        `   Add it to ${dotenvPath} (Supabase Dashboard → Settings → Database → "Connection string" → URI).\n` +
        `   Format: postgresql://postgres.<ref>:<password>@<host>:6543/postgres\n`,
    );
    process.exit(1);
  }

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.warn(`No .sql files in ${migrationsDir} — nothing to do.`);
    return;
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Connecting to Supabase Postgres…`);
  await client.connect();

  try {
    for (const file of files) {
      const sql = await readFile(join(migrationsDir, file), "utf8");
      const trimmed = sql.trim();
      if (!trimmed) {
        console.log(`· ${file}: empty, skipped`);
        continue;
      }
      process.stdout.write(`· ${file}… `);
      try {
        await client.query(trimmed);
        console.log("ok");
      } catch (err) {
        console.log("FAILED");
        throw new Error(
          `Migration ${file} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  } finally {
    await client.end();
  }

  console.log(`\nApplied ${files.length} migration${files.length === 1 ? "" : "s"}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
