import { Platform, type ViewStyle } from "react-native";

import type { ResolvedColorScheme } from "@/lib/theme/resolve-appearance";

export type ColorPalette = {
  brand: string;
  brandDark: string;
  brandSoft: string;
  accent: string;
  accentSoft: string;
  ochre: string;
  ochreSoft: string;
  navy: string;
  navySoft: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  textStrong: string;
  text: string;
  textMuted: string;
  textInverse: string;
  textOnDark: string;
  textOnDarkMuted: string;
  success: string;
  warning: string;
  warningSoft: string;
  danger: string;
  border: string;
  borderStrong: string;
  overlayLight: string;
  overlayLighter: string;
  tabIconActive: string;
  tabIconInactive: string;
  glassBar: string;
  glassHighlight: string;
  glassEdge: string;
};

export const PaletteLight: ColorPalette = {
  brand: "#009246",
  brandDark: "#006B33",
  brandSoft: "#D4F1DD",
  accent: "#CE2B37",
  accentSoft: "#FCE4E6",
  ochre: "#B97324",
  ochreSoft: "#FCE6C8",
  navy: "#1E3A5F",
  navySoft: "#D6DEEA",
  background: "#FBF7EE",
  surface: "#FFFFFF",
  surfaceMuted: "#F2EBDB",
  textStrong: "#2A1A0F",
  text: "#4A3A2A",
  textMuted: "#857461",
  textInverse: "#FFFFFF",
  textOnDark: "rgba(255, 255, 255, 0.85)",
  textOnDarkMuted: "rgba(255, 255, 255, 0.55)",
  success: "#009246",
  warning: "#B97324",
  warningSoft: "#FCEFD4",
  danger: "#B91C2D",
  border: "rgba(42, 26, 15, 0.10)",
  borderStrong: "rgba(42, 26, 15, 0.18)",
  overlayLight: "rgba(255, 255, 255, 0.13)",
  overlayLighter: "rgba(255, 255, 255, 0.07)",
  tabIconActive: "#009246",
  tabIconInactive: "#A89884",
  glassBar: "rgba(255, 255, 255, 0.55)",
  glassHighlight: "rgba(255, 255, 255, 0.65)",
  glassEdge: "rgba(255, 255, 255, 0.70)",
};

/** Dark palette aligned with splash `dark.backgroundColor` (#2A1A0F). */
export const PaletteDark: ColorPalette = {
  brand: "#2ECC71",
  brandDark: "#7DDFA8",
  brandSoft: "#1E3D2A",
  accent: "#F25C6A",
  accentSoft: "#3D2428",
  ochre: "#E0A04A",
  ochreSoft: "#3D3020",
  navy: "#9BB8D9",
  navySoft: "#243548",
  background: "#1A1208",
  surface: "#2A2218",
  surfaceMuted: "#352C22",
  textStrong: "#F5EDE0",
  text: "#D4C8B8",
  textMuted: "#A89884",
  textInverse: "#FFFFFF",
  textOnDark: "rgba(255, 255, 255, 0.85)",
  textOnDarkMuted: "rgba(255, 255, 255, 0.55)",
  success: "#2ECC71",
  warning: "#E0A04A",
  warningSoft: "#3D3020",
  danger: "#F07080",
  border: "rgba(245, 237, 224, 0.10)",
  borderStrong: "rgba(245, 237, 224, 0.18)",
  overlayLight: "rgba(255, 255, 255, 0.13)",
  overlayLighter: "rgba(255, 255, 255, 0.07)",
  tabIconActive: "#2ECC71",
  tabIconInactive: "#8A7A68",
  glassBar: "rgba(26, 18, 8, 0.45)",
  glassHighlight: "rgba(255, 255, 255, 0.10)",
  glassEdge: "rgba(255, 255, 255, 0.14)",
};

/** @deprecated Use `useTheme().palette` or `PaletteLight` / `PaletteDark`. */
export const Palette = PaletteLight;

export function getPalette(scheme: ResolvedColorScheme): ColorPalette {
  return scheme === "dark" ? PaletteDark : PaletteLight;
}

export type ThemeShadows = {
  tabBar: ViewStyle;
  card: ViewStyle;
  pop: ViewStyle;
  brand: ViewStyle;
};

const shadowLight: ThemeShadows = {
  tabBar: {
    shadowColor: "#2A1A0F",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  card: {
    shadowColor: "#2A1A0F",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pop: {
    shadowColor: "#2A1A0F",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  brand: {
    shadowColor: "#00692E",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

const shadowDark: ThemeShadows = {
  tabBar: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pop: {
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  brand: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export function getShadows(scheme: ResolvedColorScheme): ThemeShadows {
  return scheme === "dark" ? shadowDark : shadowLight;
}

/** @deprecated Use `useTheme().shadows` or `getShadows(scheme)`. */
export const Shadow = shadowLight;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 9999,
};

export const FontFamily = Platform.select({
  ios: {
    regular: "Nunito_400Regular",
    medium: "Nunito_600SemiBold",
    bold: "Nunito_700Bold",
    extraBold: "Nunito_800ExtraBold",
  },
  android: {
    regular: "Nunito_400Regular",
    medium: "Nunito_600SemiBold",
    bold: "Nunito_700Bold",
    extraBold: "Nunito_800ExtraBold",
  },
  default: {
    regular: "Nunito_400Regular",
    medium: "Nunito_600SemiBold",
    bold: "Nunito_700Bold",
    extraBold: "Nunito_800ExtraBold",
  },
})!;

export const Typography = {
  display: { fontFamily: FontFamily.extraBold, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: FontFamily.extraBold, fontSize: 26, lineHeight: 32 },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: FontFamily.bold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: FontFamily.bold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 14 },
} as const;

export const TabBarMetrics = {
  barHeight: 72,
  barPaddingH: 12,
  barPaddingV: 6,
  iconSize: 26,
  labelSize: 11,
  itemGap: 4,
  iconPillHeight: 36,
  iconPillMinWidth: 56,
  iconPillPaddingH: 14,
} as const;

export const SearchFieldMetrics = {
  minHeight: 44,
  iconSize: 20,
  fontSize: 15,
  lineHeight: 20,
  paddingH: 14,
  gap: 8,
} as const;
