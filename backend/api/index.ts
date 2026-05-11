/**
 * Tiny `/api/` landing page. Useful when somebody hits the bare API host —
 * instead of a 404 they get a list of endpoints + a link to the docs.
 */

const HTML = /* html */ `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Italiano API</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" href="data:," />
    <style>
      :root { color-scheme: light dark; }
      body {
        font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 720px;
        margin: 40px auto;
        padding: 0 20px;
      }
      h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
      .lead { color: #555; margin-top: 0; }
      ul { padding-left: 1.2rem; }
      code { background: rgba(127,127,127,0.15); padding: 2px 6px; border-radius: 4px; }
      a { color: #1f6f3a; }
    </style>
  </head>
  <body>
    <h1>Italiano API</h1>
    <p class="lead">Serverless backend for the Italiano mobile app.</p>

    <p>
      <strong>📖 Interactive docs:</strong>
      <a href="/api/docs">/api/docs</a>
      &nbsp;·&nbsp;
      <strong>OpenAPI:</strong>
      <a href="/api/openapi">/api/openapi</a>
    </p>

    <h2>Endpoints</h2>
    <ul>
      <li><code>GET&nbsp; /api/version</code> — API semver from <code>package.json</code> (+ optional Vercel git/deployment ids).</li>
      <li><code>POST /api/translate</code> — DeepL proxy.</li>
      <li><code>GET&nbsp; /api/content-manifest</code> — list of lesson bundles + version stamp.</li>
      <li><code>GET&nbsp; /api/content-bundle?bundle=…</code> — JSON of one bundle.</li>
      <li><code>GET&nbsp; /api/account/export</code> — export user data (Bearer JWT).</li>
      <li><code>POST/DELETE /api/account/delete</code> — delete user (Bearer JWT).</li>
    </ul>
  </body>
</html>`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response(HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}

export const config = { runtime: "edge" };
