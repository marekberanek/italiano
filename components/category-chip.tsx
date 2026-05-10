import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Palette, Radius, Spacing, Typography } from "@/constants/theme";

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
  /** Reports the chip's x-position so the parent can `scrollTo` it. */
  onLayoutX?: (x: number) => void;
};

/**
 * Shared "filter / category" pill used across the app: lessons grammar verbs,
 * situations categories, curated-vocab tags, quiz mode/source selectors, etc.
 *
 * Visual contract:
 *   - inactive  → neutral surface, muted border, muted label
 *   - active    → brand fill, white label, brandDark border, NO drop shadow
 *   - pressed   → 0.85 opacity (only when not already active)
 */
export function CategoryChip({
  label,
  onPress,
  active = false,
  icon,
  count,
  uppercase = false,
  onLayoutX,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayoutX ? (e) => onLayoutX(e.nativeEvent.layout.x) : undefined}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && !active && styles.chipPressed,
      ]}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={16}
          color={active ? Palette.textInverse : Palette.brandDark}
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
        <View style={[styles.badge, active && styles.badgeActive]}>
          <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

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
  chipActive: {
    backgroundColor: Palette.brand,
    borderColor: Palette.brandDark,
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
  badgeActive: { backgroundColor: Palette.brandDark },
  badgeText: { ...Typography.smallStrong, color: Palette.textMuted, fontSize: 11 },
  badgeTextActive: { color: Palette.textInverse },
});
