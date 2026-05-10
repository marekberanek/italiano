/**
 * Renders an interactive API reference (Scalar) at `/api/docs`.
 *
 * Why Scalar over classic Swagger UI:
 *   - single `<script>` from CDN, no build step,
 *   - native OpenAPI 3.1 support (Swagger UI stable lags behind),
 *   - cleaner, mobile-friendly look matches our app.
 *
 * The page just points the viewer at `/api/openapi`, which is served by
 * `backend/api/openapi.ts`. To regenerate the docs you only update the spec.
 */

const HTML = /* html */ `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Italiano API — Reference</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" href="data:," />
    <style>
      body { margin: 0; }
      .topbar {
        font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 10px 16px;
        background: #1f6f3a;
        color: #fff;
        display: flex; gap: 12px; align-items: center; justify-content: space-between;
      }
      .topbar a { color: #fff; text-decoration: underline; }
    </style>
  </head>
  <body>
    <header class="topbar">
      <strong>Italiano API</strong>
      <span>
        <a href="/api/openapi">openapi.json</a>
        &nbsp;·&nbsp;
        <a href="https://github.com/marekberanek/italiano" target="_blank" rel="noreferrer">repo</a>
      </span>
    </header>

    <script
      id="api-reference"
      data-url="/api/openapi"
      data-configuration='{"theme":"default","layout":"modern","hideClientButton":false}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
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
