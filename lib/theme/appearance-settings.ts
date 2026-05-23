import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * - `auto`: light 7:00–19:00, dark otherwise (local time).
 * - `system`: follow OS light/dark (incl. sunset on many devices).
 * - `light` / `dark`: forced.
 */
export type AppearanceMode = "auto" | "system" | "light" | "dark";

export type AppearanceSettings = {
  mode: AppearanceMode;
};

const STORAGE_KEY = "italiano.appearance.v1";

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  mode: "auto",
};

/** Local hours [start, end) when `auto` uses the light palette. */
export const AUTO_LIGHT_START_HOUR = 7;
export const AUTO_LIGHT_END_HOUR = 19;

function normalize(parsed: Partial<AppearanceSettings> | null | undefined): AppearanceSettings {
  if (!parsed || typeof parsed !== "object") return { ...DEFAULT_APPEARANCE_SETTINGS };
  const mode = parsed.mode;
  if (mode === "system" || mode === "light" || mode === "dark" || mode === "auto") {
    return { mode };
  }
  return { ...DEFAULT_APPEARANCE_SETTINGS };
}

export async function readAppearanceSettings(): Promise<AppearanceSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APPEARANCE_SETTINGS };
    return normalize(JSON.parse(raw) as Partial<AppearanceSettings>);
  } catch {
    return { ...DEFAULT_APPEARANCE_SETTINGS };
  }
}

export async function writeAppearanceSettings(settings: AppearanceSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(settings)));
  } catch {
    // Non-fatal — next write retries.
  }
}
