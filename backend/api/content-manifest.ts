import { CONTENT_BUNDLE_IDS_FALLBACK } from "./_lib/bundle-ids";
import { getAnonClient } from "./_lib/supabase";

export default async function handler(): Promise<Response> {
  const supabase = getAnonClient();

  if (supabase) {
    const [bundlesRes, metaRes] = await Promise.all([
      supabase.from("content_bundles").select("id"),
      supabase.from("content_meta").select("value").eq("key", "version").maybeSingle(),
    ]);

    if (!bundlesRes.error && bundlesRes.data && bundlesRes.data.length > 0) {
      const bundles = bundlesRes.data.map((r) => r.id as string).sort();
      const version =
        (metaRes.data?.value as string | undefined) ??
        process.env.CONTENT_VERSION ??
        "db";
      return new Response(JSON.stringify({ version, bundles }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    if (bundlesRes.error) {
      console.warn("content-manifest: DB read failed:", bundlesRes.error.message);
    }
  }

  // DB unreachable / unconfigured / empty → static fallback so the app keeps
  // working until `npm run content:push` populates `content_bundles`.
  const version = process.env.CONTENT_VERSION ?? "fallback";
  return new Response(
    JSON.stringify({ version, bundles: [...CONTENT_BUNDLE_IDS_FALLBACK] }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}

export const config = { runtime: "edge" };
