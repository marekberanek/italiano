import { StyleSheet, Text, View } from "react-native";

import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";

type Tone = "brand" | "accent" | "neutral";

type Props = {
  value: string | number;
  label: string;
  tone?: Tone;
};

const toneColors: Record<Tone, string> = {
  brand: Palette.brand,
  accent: Palette.accent,
  neutral: Palette.brandDark,
};

export function StatTile({ value, label, tone = "neutral" }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color: toneColors[tone] }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 88,
    justifyContent: "center",
    ...Shadow.card,
  },
  value: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 32,
    lineHeight: 36,
  },
  label: {
    ...Typography.caption,
    color: Palette.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
