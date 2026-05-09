const BUNDLES = [
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

export default async function handler(): Promise<Response> {
  const version = process.env.CONTENT_VERSION ?? "2";
  return new Response(JSON.stringify({ version, bundles: [...BUNDLES] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export const config = { runtime: "edge" };
