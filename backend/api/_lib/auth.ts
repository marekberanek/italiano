import { createClient } from "@supabase/supabase-js";

export type AuthSuccess = {
  ok: true;
  userId: string;
  email: string | null;
};

export type AuthFailure = {
  ok: false;
  status: 401 | 500;
  error: string;
};

/**
 * Validates the `Authorization: Bearer <jwt>` header against Supabase Auth.
 *
 * Centralised here so every protected endpoint (translate, account/export,
 * account/delete) shares the exact same flow:
 *   1. Pull the token from the header (case-insensitive).
 *   2. Verify it via `supabase.auth.getUser(jwt)` using the anon key + the
 *      token in `global.headers`.
 *   3. Return the user id (and email) on success, or a 401/500 envelope on
 *      failure that the handler can return verbatim.
 */
export async function requireSupabaseUser(req: Request): Promise<AuthSuccess | AuthFailure> {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
  if (!jwt) {
    return { ok: false, status: 401, error: "Missing Authorization Bearer token" };
  }

  const url = process.env.SUPABASE_URL?.trim();
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return { ok: false, status: 500, error: "Server misconfigured (Supabase env)" };
  }

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser(jwt);
  if (error || !user) {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }

  return { ok: true, userId: user.id, email: user.email ?? null };
}
