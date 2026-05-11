import pkg from "../package.json" with { type: "json" };

/**
 * Deployed API semver lives in `backend/package.json` — bump it when changing
 * translate / account / content handlers, then redeploy (Vercel).
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = {
    name: pkg.name,
    version: pkg.version,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const config = { runtime: "edge" };
