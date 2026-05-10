import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Palette, Radius, Spacing, Typography } from "@/constants/theme";

type ChipTone = "brand" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  active?: boolean;
  /** Optional left icon (MaterialIcons name). */
  icon?: keyof typeof MaterialIcons.glyphMap;
  /** Optional right count badge (e.g. number of items in the category). */
  count?: number;
  /** Render label uppercase + slightly tracked. Useful for short labels (verbs). */
  uppercase?: boolean;
  /**
   * Color used for the active fill / icon / inactive icon hint.
   * - `brand` (default) – green (italské zaměření, OK akce, neutrální filtr)
   * - `danger` – red (chybné odpovědi, „Špatně" filtr, varování)
   */
  tone?: ChipTone;
  /** Reports the chip's x-position so the parent can `scrollTo` it. */
  onLayoutX?: (x: number) => void;
};

/**
 * Shared "filter / category" pill used across the app: lessons grammar verbs,
 * situations categories, curated-vocab tags, quiz mode/source selectors, etc.
 *
 * Visual contract:
 *   - inactive  → neutral surface, muted border, muted label
 *   - active    → tone fill, white label, tone-dark border, NO drop shadow
 *   - pressed   → 0.85 opacity (only when not already active)
 */
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
  const palette = tone === "danger" ? DANGER_PALETTE : BRAND_PALETTE;
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayoutX ? (e) => onLayoutX(e.nativeEvent.layout.x) : undefined}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: palette.fill, borderColor: palette.border },
        pressed && !active && styles.chipPressed,
      ]}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={16}
          color={active ? Palette.textInverse : palette.iconIdle}
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
            active && { backgroundColor: palette.badgeActive },
          ]}
        >
          <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const BRAND_PALETTE = {
  fill: Palette.brand,
  border: Palette.brandDark,
  iconIdle: Palette.brandDark,
  badgeActive: Palette.brandDark,
};

const DANGER_PALETTE = {
  fill: Palette.danger,
  border: Palette.danger,
  iconIdle: Palette.danger,
  badgeActive: "rgba(0,0,0,0.18)",
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipPressed: { opacity: 0.85 },
  label: {
    ...Typography.smallStrong,
    color: Palette.textStrong,
    fontSize: 13,
  },
  labelUpper: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelActive: { color: Palette.textInverse },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...Typography.smallStrong, color: Palette.textMuted, fontSize: 11 },
  badgeTextActive: { color: Palette.textInverse },
});
