import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState, useColorScheme, type AppStateStatus } from "react-native";

import {
  getPalette,
  getShadows,
  type ColorPalette,
  type ThemeShadows,
} from "@/constants/theme";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  readAppearanceSettings,
  writeAppearanceSettings,
  type AppearanceMode,
  type AppearanceSettings,
} from "@/lib/theme/appearance-settings";
import { resolveColorScheme, type ResolvedColorScheme } from "@/lib/theme/resolve-appearance";
import { syncWebChrome } from "@/lib/theme/sync-web-chrome";

type ThemeContextValue = {
  colorScheme: ResolvedColorScheme;
  palette: ColorPalette;
  shadows: ThemeShadows;
  appearanceMode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => Promise<void>;
  hydrated: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void readAppearanceSettings().then((stored) => {
      if (!cancelled) {
        setSettings(stored);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (settings.mode !== "auto") return;
    const interval = setInterval(() => setClockTick((t) => t + 1), 60_000);
    const onAppState = (state: AppStateStatus) => {
      if (state === "active") setClockTick((t) => t + 1);
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [settings.mode]);

  const colorScheme = useMemo(
    () => resolveColorScheme(settings.mode, systemScheme),
  // eslint-disable-next-line react-hooks/exhaustive-deps -- clockTick refreshes auto schedule
    [settings.mode, systemScheme, clockTick],
  );

  const palette = useMemo(() => getPalette(colorScheme), [colorScheme]);
  const shadows = useMemo(() => getShadows(colorScheme), [colorScheme]);

  useEffect(() => {
    if (!hydrated) return;
    syncWebChrome(colorScheme);
  }, [colorScheme, hydrated]);

  const setAppearanceMode = useCallback(async (mode: AppearanceMode) => {
    const next = { mode };
    setSettings(next);
    await writeAppearanceSettings(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      palette,
      shadows,
      appearanceMode: settings.mode,
      setAppearanceMode,
      hydrated,
    }),
    [colorScheme, palette, shadows, settings.mode, setAppearanceMode, hydrated],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
