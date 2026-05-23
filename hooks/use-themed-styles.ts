import { useMemo } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";

import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { useTheme } from "@/lib/theme/theme-context";

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function useThemedStyles<T extends NamedStyles>(
  factory: (palette: ColorPalette, shadows: ThemeShadows) => T,
): T {
  const { palette, shadows } = useTheme();
  return useMemo(() => StyleSheet.create(factory(palette, shadows)), [palette, shadows, factory]);
}
