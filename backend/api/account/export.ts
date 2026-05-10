import { createClient } from "@supabase/supabase-js";

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

  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
  if (!jwt) return json({ error: "Missing Authorization Bearer token" }, 401);

  const url = process.env.SUPABASE_URL?.trim();
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return json({ error: "Server misconfigured (Supabase env)" }, 500);
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(jwt);
  if (userErr || !user) {
    return json({ error: "Invalid or expired token" }, 401);
  }

  const [{ data: profile, error: pErr }, { data: vocab, error: vErr }] = await Promise.all([
    supabase.from("profiles").select("id,created_at,display_name,locale").eq("id", user.id).maybeSingle(),
    supabase
      .from("vocab_items")
      .select("client_uuid,it,cz,p,ex_it,ex_cz,learned,streak,updated_at,deleted_at")
      .eq("user_id", user.id),
  ]);

  if (pErr || vErr) {
    return json({ error: pErr?.message ?? vErr?.message ?? "Query failed" }, 500);
  }

  return new Response(
    JSON.stringify({
      user: { id: user.id, email: user.email },
      profile: profile ?? null,
      vocab_items: vocab ?? [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

export const config = { runtime: "nodejs22.x" };
