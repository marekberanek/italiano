import type { ConfigContext, ExpoConfig } from "expo/config";

// Loaded via CommonJS require (not ES import) because Expo CLI runs this file
// through Node directly — `require` works without any TS module-resolution
// gymnastics and is the pattern Expo's own docs use for app.config.*.
const pkg = require("./package.json") as { version: string };

/**
 * Single source of truth for the marketing version.
 *
 * Why this file exists: when both `app.json` and `app.config.ts` are present,
 * Expo loads `app.config.ts` AND passes the parsed `app.json` as `context.config`.
 * We spread it through unchanged and only override `version` so the value comes
 * from `package.json` — that's what `npm version patch/minor/major` updates.
 *
 * Workflow:
 *   1. `npm run release:patch` (or `:minor` / `:major`) → bumps package.json + git tag
 *   2. `eas build --profile production` → picks up the new `version` automatically,
 *       EAS auto-increments the build number remotely (see eas.json `autoIncrement`).
 *
 * Result: only `package.json` needs a semver bump (via `npm run release:*`).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  version: pkg.version,
});
