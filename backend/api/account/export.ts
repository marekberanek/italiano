import { createClient } from "@supabase/supabase-js";

import { requireSupabaseUser } from "../_lib/auth";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const auth = await requireSupabaseUser(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const url = process.env.SUPABASE_URL?.trim();
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return json({ error: "Server misconfigured (Supabase env)" }, 500);
  }

  // We re-derive the JWT here from the request because the export query needs
  // a Supabase client that runs *as the user* (so RLS lets us read only their
  // rows). `requireSupabaseUser` only returned the verified user id.
  const jwt = req.headers.get("authorization")!.replace(/^Bearer\s+/i, "").trim();
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: profile, error: pErr }, { data: vocab, error: vErr }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,created_at,display_name,locale")
      .eq("id", auth.userId)
      .maybeSingle(),
    supabase
      .from("vocab_items")
      .select("client_uuid,it,cz,p,ex_it,ex_cz,learned,streak,updated_at,deleted_at")
      .eq("user_id", auth.userId),
  ]);

  if (pErr || vErr) {
    return json({ error: pErr?.message ?? vErr?.message ?? "Query failed" }, 500);
  }

  return new Response(
    JSON.stringify({
      user: { id: auth.userId, email: auth.email },
      profile: profile ?? null,
      vocab_items: vocab ?? [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

// Edge runtime: Supabase JS SDK uses `fetch` only. Avoids Vercel's
// ESM/CJS interop crash on the Node runtime (no `"type": "module"`
// in backend/package.json).
export const config = { runtime: "edge" };
