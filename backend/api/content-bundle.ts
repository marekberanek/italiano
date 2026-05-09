import abbreviations from "../content/abbreviations.json";
import alphabet from "../content/alphabet.json";
import bodyHealth from "../content/body-health.json";
import colorsShapes from "../content/colors-shapes.json";
import curatedVocab from "../content/curated-vocab.json";
import falseFriends from "../content/false-friends.json";
import family from "../content/family.json";
import foodDrinks from "../content/food-drinks.json";
import grammar from "../content/grammar.json";
import holidaysIt from "../content/holidays-it.json";
import months from "../content/months.json";
import numbers from "../content/numbers.json";
import ordinals from "../content/ordinals.json";
import pronRules from "../content/pron-rules.json";
import seasons from "../content/seasons.json";
import situations from "../content/situations.json";
import time from "../content/time.json";
import weather from "../content/weather.json";
import weekdays from "../content/weekdays.json";

const ALLOW = new Set([
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
]);

const BUNDLES: Record<string, unknown> = {
  situations,
  months,
  weekdays,
  numbers,
  alphabet,
  "pron-rules": pronRules,
  grammar,
  "curated-vocab": curatedVocab,
  time,
  seasons,
  "colors-shapes": colorsShapes,
  ordinals,
  "holidays-it": holidaysIt,
  weather,
  family,
  "body-health": bodyHealth,
  "food-drinks": foodDrinks,
  "false-friends": falseFriends,
  abbreviations,
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const bundle = url.searchParams.get("bundle")?.trim();
  if (!bundle || !ALLOW.has(bundle)) {
    return new Response(JSON.stringify({ error: "Unknown or missing bundle" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = BUNDLES[bundle];
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}

export const config = { runtime: "nodejs" };
