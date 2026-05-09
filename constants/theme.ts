import { Platform } from "react-native";

export const Palette = {
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
  danger: "#B91C2D",

  border: "rgba(42, 26, 15, 0.10)",
  borderStrong: "rgba(42, 26, 15, 0.18)",
  overlayLight: "rgba(255, 255, 255, 0.13)",
  overlayLighter: "rgba(255, 255, 255, 0.07)",

  tabIconActive: "#009246",
  tabIconInactive: "#A89884",
};

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

export const Shadow = {
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
} as const;
