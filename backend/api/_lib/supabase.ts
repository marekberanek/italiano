import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only Supabase client used by public content endpoints
 * (`/api/content-manifest`, `/api/content-bundle`).
 *
 * Uses the `anon` key — RLS on `public.content_bundles` / `public.content_meta`
 * grants `select` to anyone. Never use the service role key here.
 *
 * Cached at module scope so subsequent invocations on the same edge instance
 * reuse the same client (and its underlying fetch keep-alive).
 */
let cachedAnon: SupabaseClient | null = null;

export function getAnonClient(): SupabaseClient | null {
  if (cachedAnon) return cachedAnon;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  cachedAnon = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAnon;
}
