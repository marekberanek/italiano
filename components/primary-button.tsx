import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import type { ColorPalette } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/lib/theme/theme-context";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger";
type Size = "md" | "lg";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

const sizeStyles: Record<Size, ViewStyle> = {
  md: { minHeight: 52, paddingHorizontal: Spacing.xl },
  lg: { minHeight: 64, paddingHorizontal: Spacing.xl + 4 },
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  style,
}: Props) {
  const { palette } = useTheme();
  const styles = createStyles(palette);
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles(palette)[variant];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyle.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={variantStyle.text.color} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, variantStyle.text]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function variantStyles(p: ColorPalette): Record<
  Variant,
  { container: ViewStyle; text: { color: string } }
> {
  return {
    primary: {
      container: { backgroundColor: p.brand },
      text: { color: p.textInverse },
    },
    secondary: {
      container: {
        backgroundColor: p.surface,
        borderWidth: 1,
        borderColor: p.border,
      },
      text: { color: p.textStrong },
    },
    ghost: {
      container: {
        backgroundColor: p.brandSoft,
        borderWidth: 1.5,
        borderColor: p.brand,
      },
      text: { color: p.brandDark },
    },
    success: {
      container: { backgroundColor: p.brand },
      text: { color: p.textInverse },
    },
    danger: {
      container: {
        backgroundColor: p.surface,
        borderWidth: 2,
        borderColor: p.danger,
      },
      text: { color: p.danger },
    },
  };
}

function createStyles(_p: ColorPalette) {
  return StyleSheet.create({
    base: {
      borderRadius: Radius.pill,
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    label: { ...Typography.bodyStrong, fontSize: 15 },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
  });
}
