import { CONTENT_BUNDLE_IDS_FALLBACK } from "./_lib/bundle-ids";
import { getAnonClient } from "./_lib/supabase";

const ALLOW = new Set<string>(CONTENT_BUNDLE_IDS_FALLBACK);

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Vercel / Node may pass path-only `req.url` (e.g. `/api/content-bundle?bundle=…`).
  const url = new URL(req.url, "http://localhost");
  const bundle = url.searchParams.get("bundle")?.trim();
  if (!bundle) {
    return json({ error: "Missing ?bundle parameter" }, 400);
  }

  const supabase = getAnonClient();
  if (!supabase) {
    return json({ error: "Server not configured (SUPABASE_URL / SUPABASE_ANON_KEY)" }, 500);
  }

  const { data, error } = await supabase
    .from("content_bundles")
    .select("payload")
    .eq("id", bundle)
    .maybeSingle();

  if (error) {
    console.warn("content-bundle: DB read failed:", error.message);
    return json({ error: "Bundle lookup failed" }, 502);
  }

  if (!data) {
    // Distinguish "we know this id, just not seeded yet" from "unknown id".
    if (ALLOW.has(bundle)) {
      return json(
        { error: "Bundle not yet seeded — run `npm run content:push`" },
        503,
      );
    }
    return json({ error: "Unknown bundle" }, 404);
  }

  return new Response(JSON.stringify(data.payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { runtime: "edge" };
