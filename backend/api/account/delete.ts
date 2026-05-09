import { createClient } from "@supabase/supabase-js";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "DELETE" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
  if (!jwt) return json({ error: "Missing Authorization Bearer token" }, 401);

  const url = process.env.SUPABASE_URL?.trim();
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anon || !service) {
    return json({ error: "Server misconfigured (Supabase env)" }, 500);
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser(jwt);
  if (userErr || !user) {
    return json({ error: "Invalid or expired token" }, 401);
  }

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    return json({ error: delErr.message }, 500);
  }

  return new Response(null, { status: 204 });
}

export const config = { runtime: "nodejs22.x" };
