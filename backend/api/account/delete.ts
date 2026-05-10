import { createClient } from "@supabase/supabase-js";

import { requireSupabaseUser } from "../_lib/auth";

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

  const auth = await requireSupabaseUser(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const url = process.env.SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !service) {
    return json({ error: "Server misconfigured (Supabase env)" }, 500);
  }

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: delErr } = await admin.auth.admin.deleteUser(auth.userId);
  if (delErr) {
    return json({ error: delErr.message }, 500);
  }

  return new Response(null, { status: 204 });
}

// Edge runtime: Supabase admin API call (auth.admin.deleteUser) is just a
// fetch to GoTrue with the service-role key. Avoids Vercel's ESM/CJS interop
// crash on the Node runtime (no `"type": "module"` in backend/package.json).
export const config = { runtime: "edge" };
