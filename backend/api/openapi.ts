/**
 * OpenAPI 3.1 specification for the Italiano backend.
 *
 * The spec is intentionally hand-written (no decorator generators) so it stays
 * tiny, has no build step, and can be served from a single edge function. It
 * documents every public endpoint exposed under `/api/*`.
 *
 * Renderable via `/api/docs` (Scalar API Reference UI) or any external tool
 * (`https://editor.swagger.io/?url=https://italiano-api.vercel.app/api/openapi`).
 */

const BUNDLE_NAMES = [
  "situations",
  "months",
  "weekdays",
  "numbers",
  "alphabet",
  "pron-rules",
  "grammar",
  "curated-vocab",
  "time",
  "seasons",
  "colors-shapes",
  "ordinals",
  "holidays-it",
  "weather",
  "family",
  "body-health",
  "food-drinks",
  "false-friends",
  "abbreviations",
] as const;

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Italiano API",
    version: "1.0.0",
    description:
      "Serverless API for the Italiano mobile app: DeepL translation proxy, " +
      "lesson content bundles, and account export / deletion endpoints.",
    contact: { name: "Italiano repo", url: "https://github.com/marekberanek/italiano" },
    license: { name: "MIT" },
  },
  servers: [
    { url: "https://italiano-api.vercel.app", description: "Production" },
    { url: "http://localhost:3000", description: "Local (vercel dev)" },
  ],
  tags: [
    { name: "Translation", description: "DeepL proxy used by the Hledat (Search) screen." },
    { name: "Content", description: "Lesson bundle manifest + JSON downloads." },
    { name: "Account", description: "User-scoped admin endpoints (require Supabase JWT)." },
    { name: "Meta", description: "Spec + Swagger / Scalar UI." },
  ],
  components: {
    securitySchemes: {
      BearerJwt: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Supabase access token from the mobile app.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string", example: "DEEPL_API_KEY is not configured." },
        },
      },
      TranslateRequest: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "Czech or Italian word/phrase to translate.",
            example: "postel",
          },
        },
      },
      TranslateResponse: {
        type: "object",
        required: ["it", "cz", "p"],
        properties: {
          it: { type: "string", example: "letto" },
          cz: { type: "string", example: "postel" },
          p: { type: "string", description: "Phonetic hint (often empty; client generates fallback).", example: "" },
          ex_it: { type: "string", nullable: true },
          ex_cz: { type: "string", nullable: true },
          detected: {
            type: "string",
            description: "Source language as detected by DeepL (CS / IT / …).",
            example: "CS",
          },
        },
      },
      ContentManifest: {
        type: "object",
        required: ["version", "bundles"],
        properties: {
          version: {
            type: "string",
            description: "Cache-busting stamp. Bumped via CONTENT_VERSION env on every content change.",
            example: "2",
          },
          bundles: {
            type: "array",
            items: { type: "string", enum: BUNDLE_NAMES as unknown as string[] },
          },
        },
      },
      AccountExport: {
        type: "object",
        required: ["user", "profile", "vocab_items"],
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email", nullable: true },
            },
          },
          profile: { type: "object", nullable: true, additionalProperties: true },
          vocab_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                client_uuid: { type: "string" },
                it: { type: "string" },
                cz: { type: "string" },
                p: { type: "string", nullable: true },
                ex_it: { type: "string", nullable: true },
                ex_cz: { type: "string", nullable: true },
                learned: { type: "boolean" },
                streak: { type: "integer" },
                updated_at: { type: "string", format: "date-time" },
                deleted_at: { type: "string", format: "date-time", nullable: true },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/translate": {
      post: {
        tags: ["Translation"],
        summary: "Translate a single word/phrase via DeepL.",
        description:
          "Auto-detects direction. Czech diacritics short-circuit the detection; otherwise " +
          "calls DeepL once toward Italian and uses DeepL's source detection to decide if a " +
          "second IT→CS call is needed.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/TranslateRequest" } },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/TranslateResponse" } },
            },
          },
          "400": { description: "Missing or invalid `query`.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "405": { description: "Method other than POST." },
          "502": { description: "Upstream DeepL failure or missing API key.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/content-manifest": {
      get: {
        tags: ["Content"],
        summary: "Get the manifest of available lesson bundles.",
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContentManifest" } } },
          },
        },
      },
    },
    "/api/content-bundle": {
      get: {
        tags: ["Content"],
        summary: "Download a single lesson bundle by name.",
        parameters: [
          {
            in: "query",
            name: "bundle",
            required: true,
            description: "Bundle id (matches `bundles[]` in the manifest).",
            schema: { type: "string", enum: BUNDLE_NAMES as unknown as string[] },
            example: "curated-vocab",
          },
        ],
        responses: {
          "200": {
            description: "Raw bundle JSON (shape depends on the bundle).",
            content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
          },
          "404": {
            description: "Unknown or missing bundle.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/api/account/export": {
      get: {
        tags: ["Account"],
        summary: "Export the signed-in user's profile and vocab items.",
        security: [{ BearerJwt: [] }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AccountExport" } } },
          },
          "401": { description: "Missing or invalid JWT." },
          "500": { description: "Server misconfiguration or query failure." },
        },
      },
    },
    "/api/account/delete": {
      delete: {
        tags: ["Account"],
        summary: "Delete the signed-in user's account (admin action).",
        description:
          "Verifies the Bearer JWT, then calls `auth.admin.deleteUser` with the service-role " +
          "key. RLS policies cascade cleanup of `vocab_items`, `study_events`, `profiles`.",
        security: [{ BearerJwt: [] }],
        responses: {
          "204": { description: "Account deleted." },
          "401": { description: "Missing or invalid JWT." },
          "500": { description: "Supabase admin call failed." },
        },
      },
      post: {
        tags: ["Account"],
        summary: "Same as DELETE — accepted for clients that can't issue DELETE with a body.",
        security: [{ BearerJwt: [] }],
        responses: {
          "204": { description: "Account deleted." },
          "401": { description: "Missing or invalid JWT." },
          "500": { description: "Supabase admin call failed." },
        },
      },
    },
    "/api/openapi": {
      get: {
        tags: ["Meta"],
        summary: "This OpenAPI 3.1 specification (machine-readable).",
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
          },
        },
      },
    },
    "/api/docs": {
      get: {
        tags: ["Meta"],
        summary: "Interactive Swagger / Scalar UI for this spec.",
        responses: {
          "200": { description: "HTML page with the embedded spec viewer." },
        },
      },
    },
  },
} as const;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response(JSON.stringify(spec), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const config = { runtime: "edge" };
