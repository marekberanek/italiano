import { StyleSheet, Text, View } from "react-native";

import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type Tone = "brand" | "accent" | "neutral";

type Props = {
  value: string | number;
  label: string;
  tone?: Tone;
};

export function StatTile({ value, label, tone = "neutral" }: Props) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const toneColors: Record<Tone, string> = {
    brand: palette.brand,
    accent: palette.accent,
    neutral: palette.brandDark,
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color: toneColors[tone] }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(p: ColorPalette, s: ThemeShadows) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.surface,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: p.border,
      minHeight: 88,
      justifyContent: "center",
      ...s.card,
    },
    value: {
      fontFamily: Typography.display.fontFamily,
      fontSize: 32,
      lineHeight: 36,
    },
    label: {
      ...Typography.caption,
      color: p.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
  });
}
