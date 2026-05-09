import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Palette, Radius, Spacing, Typography } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={variantStyles[variant].text.color} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, variantStyles[variant].text]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  label: { ...Typography.bodyStrong, fontSize: 15 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});

const variantStyles: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: Palette.brand },
    text: { color: Palette.textInverse },
  },
  secondary: {
    container: {
      backgroundColor: Palette.surface,
      borderWidth: 1,
      borderColor: Palette.border,
    },
    text: { color: Palette.textStrong },
  },
  ghost: {
    container: {
      backgroundColor: Palette.brandSoft,
      borderWidth: 1.5,
      borderColor: Palette.brand,
    },
    text: { color: Palette.brandDark },
  },
  success: {
    container: { backgroundColor: Palette.brand },
    text: { color: Palette.textInverse },
  },
  danger: {
    container: {
      backgroundColor: Palette.surface,
      borderWidth: 2,
      borderColor: Palette.danger,
    },
    text: { color: Palette.danger },
  },
};
