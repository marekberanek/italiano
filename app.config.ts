import type { ConfigContext, ExpoConfig } from "expo/config";

// Loaded via CommonJS require (not ES import) because Expo CLI runs this file
// through Node directly — `require` works without any TS module-resolution
// gymnastics and is the pattern Expo's own docs use for app.config.*.
const pkg = require("./package.json") as { version: string };

function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * - **Marketing version** comes from `package.json` (`npm run release:*`).
 * - **Secrets / per-environment URLs** come from `EXPO_PUBLIC_*` in `.env`
 *   (local) or EAS project environment variables (builds). They are merged into
 *   `expo.extra` here — do not put them in committed `app.json`.
 *
 * Copy [.env.example](.env.example) → `.env` and fill values, then restart Metro (`npx expo start -c`).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  const baseExtra = (base.extra ?? {}) as Record<string, unknown>;

  const translateEndpoint = env("EXPO_PUBLIC_TRANSLATE_ENDPOINT");
  const contentBaseUrl = env("EXPO_PUBLIC_CONTENT_BASE_URL");
  const supabaseUrl = env("EXPO_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = env("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  /** Same UUID as in Expo → Project → Project ID (OTA + `eas project:info`). */
  const easProjectId = env("EXPO_PUBLIC_EAS_PROJECT_ID") ?? env("EAS_PROJECT_ID");

  const extra: Record<string, unknown> = { ...baseExtra };

  if (translateEndpoint) extra.translateEndpoint = translateEndpoint;
  if (contentBaseUrl) extra.contentBaseUrl = contentBaseUrl;
  if (supabaseUrl) extra.supabaseUrl = supabaseUrl;
  if (supabaseAnonKey) extra.supabaseAnonKey = supabaseAnonKey;

  if (easProjectId) {
    extra.eas = { projectId: easProjectId };
  } else {
    delete extra.eas;
  }

  const out: ExpoConfig = {
    ...base,
    version: pkg.version,
    extra,
  };

  if (easProjectId) {
    out.updates = {
      ...(typeof base.updates === "object" && base.updates !== null ? base.updates : {}),
      url: `https://u.expo.dev/${easProjectId}`,
    };
  } else {
    delete out.updates;
  }

  return out;
};
