import { Platform } from "react-native";

import type { ResolvedColorScheme } from "@/lib/theme/resolve-appearance";

/** Matches `PaletteLight.background` / manifest `background_color`. */
export const WEB_THEME_COLOR_LIGHT = "#FBF7EE";
/** Matches `PaletteDark.background`. */
export const WEB_THEME_COLOR_DARK = "#1A1208";

function themeColorFor(scheme: ResolvedColorScheme): string {
  return scheme === "dark" ? WEB_THEME_COLOR_DARK : WEB_THEME_COLOR_LIGHT;
}

function appleStatusBarStyleFor(scheme: ResolvedColorScheme): "default" | "black" {
  return scheme === "dark" ? "black" : "default";
}

/**
 * Syncs browser/PWA chrome (theme-color, iOS status bar, page background) with the
 * active app color scheme. No-op on native.
 */
export function syncWebChrome(scheme: ResolvedColorScheme): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const themeColor = themeColorFor(scheme);
  const statusStyle = appleStatusBarStyleFor(scheme);

  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement("meta");
    themeMeta.setAttribute("name", "theme-color");
    document.head.appendChild(themeMeta);
  }
  themeMeta.setAttribute("content", themeColor);

  const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleMeta) appleMeta.setAttribute("content", statusStyle);

  document.documentElement.style.backgroundColor = themeColor;
  document.documentElement.style.colorScheme = scheme;
  if (document.body) document.body.style.backgroundColor = themeColor;
}

/** Initial paint before React hydrates (inline script in +html.tsx). */
export function bootWebChromeScript(): string {
  return `
(function () {
  var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = dark ? "${WEB_THEME_COLOR_DARK}" : "${WEB_THEME_COLOR_LIGHT}";
  var status = dark ? "black" : "default";
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", theme);
  var a = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (a) a.setAttribute("content", status);
  document.documentElement.style.backgroundColor = theme;
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
})();
`;
}
