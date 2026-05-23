import type { ColorSchemeName } from "react-native";

import {
  AUTO_LIGHT_END_HOUR,
  AUTO_LIGHT_START_HOUR,
  type AppearanceMode,
} from "@/lib/theme/appearance-settings";

export type ResolvedColorScheme = "light" | "dark";

export function isAutoLightHours(now = new Date()): boolean {
  const hour = now.getHours();
  return hour >= AUTO_LIGHT_START_HOUR && hour < AUTO_LIGHT_END_HOUR;
}

export function resolveColorScheme(
  mode: AppearanceMode,
  systemScheme: ColorSchemeName | null | undefined,
  now = new Date(),
): ResolvedColorScheme {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (mode === "system") return systemScheme === "dark" ? "dark" : "light";
  return isAutoLightHours(now) ? "light" : "dark";
}
