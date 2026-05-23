import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import type { ColorPalette } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type Tone = "brand" | "accent" | "ochre" | "navy";

type Props = {
  title: string;
  subtitle?: string;
  tone?: Tone;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function SectionCard({ title, subtitle, tone = "brand", trailing, children, style }: Props) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const toneColor: Record<Tone, string> = {
    brand: palette.brand,
    accent: palette.accent,
    ochre: palette.ochre,
    navy: palette.navy,
  };

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

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
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
      color: p.textStrong,
    },
    subtitle: {
      ...Typography.small,
      color: p.textMuted,
      fontSize: 13,
      paddingLeft: Spacing.md + 10,
    },
  });
}
