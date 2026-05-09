import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Palette, Radius, Spacing, Typography } from "@/constants/theme";

type Tone = "brand" | "accent" | "ochre" | "navy";

const toneColor: Record<Tone, string> = {
  brand: Palette.brand,
  accent: Palette.accent,
  ochre: Palette.ochre,
  navy: Palette.navy,
};

type Props = {
  title: string;
  subtitle?: string;
  tone?: Tone;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function SectionCard({ title, subtitle, tone = "brand", trailing, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} />
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {trailing}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg + 4,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  titleBlock: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 16,
    color: Palette.textStrong,
  },
  subtitle: {
    ...Typography.small,
    color: Palette.textMuted,
    fontSize: 13,
    paddingLeft: Spacing.md + 10,
  },
});
