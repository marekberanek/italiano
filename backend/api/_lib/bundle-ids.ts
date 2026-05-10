/**
 * Fallback list used by /api/content-manifest when the database is empty
 * or unreachable. Kept in sync manually with `lib/content/bundle-ids.ts`
 * in the mobile app — see docs/DEPLOYMENT.md § 2.6.
 *
 * After `npm run content:push` has run, /api/content-manifest reads the
 * actual list from `public.content_bundles` and ignores this constant.
 */
export const CONTENT_BUNDLE_IDS_FALLBACK = [
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
