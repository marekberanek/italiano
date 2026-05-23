import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ColorPalette } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type ChipTone = "brand" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  count?: number;
  uppercase?: boolean;
  tone?: ChipTone;
  onLayoutX?: (x: number) => void;
};

export function CategoryChip({
  label,
  onPress,
  active = false,
  icon,
  count,
  uppercase = false,
  tone = "brand",
  onLayoutX,
}: Props) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const chipPalette = tone === "danger" ? dangerPalette(palette) : brandPalette(palette);

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayoutX ? (e) => onLayoutX(e.nativeEvent.layout.x) : undefined}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: chipPalette.fill, borderColor: chipPalette.border },
        pressed && !active && styles.chipPressed,
      ]}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={16}
          color={active ? palette.textInverse : chipPalette.iconIdle}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          uppercase && styles.labelUpper,
          active && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <View
          style={[
            styles.badge,
            active && { backgroundColor: chipPalette.badgeActive },
          ]}
        >
          <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function brandPalette(p: ColorPalette) {
  return {
    fill: p.brand,
    border: p.brandDark,
    iconIdle: p.brandDark,
    badgeActive: p.brandDark,
  };
}

function dangerPalette(p: ColorPalette) {
  return {
    fill: p.danger,
    border: p.danger,
    iconIdle: p.danger,
    badgeActive: "rgba(0,0,0,0.18)",
  };
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: Radius.pill,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
    },
    chipPressed: { opacity: 0.85 },
    label: {
      ...Typography.smallStrong,
      color: p.textStrong,
      fontSize: 13,
    },
    labelUpper: {
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    labelActive: { color: p.textInverse },
    badge: {
      minWidth: 22,
      paddingHorizontal: 6,
      height: 18,
      borderRadius: 9,
      backgroundColor: p.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { ...Typography.smallStrong, color: p.textMuted, fontSize: 11 },
    badgeTextActive: { color: p.textInverse },
  });
}
