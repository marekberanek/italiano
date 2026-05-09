/** Remote lesson / phrase JSON bundles (must match backend manifest). */
export const CONTENT_BUNDLE_IDS = [
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

export type ContentBundleId = (typeof CONTENT_BUNDLE_IDS)[number];

export function isContentBundleId(id: string): id is ContentBundleId {
  return (CONTENT_BUNDLE_IDS as readonly string[]).includes(id);
}
