import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";

import { Palette, Radius } from "@/constants/theme";

type Props = {
  onPress: () => void;
  size?: "sm" | "md" | "lg";
  tone?: "soft" | "onDark";
  disabled?: boolean;
  style?: ViewStyle;
};

const sizes = {
  sm: { box: 36, icon: 18 },
  md: { box: 44, icon: 22 },
  lg: { box: 48, icon: 24 },
};

export function PlayButton({ onPress, size = "md", tone = "soft", disabled, style }: Props) {
  const dim = sizes[size];
  const palette =
    tone === "soft"
      ? { bg: Palette.brandSoft, fg: Palette.brandDark }
      : { bg: "rgba(255,255,255,0.18)", fg: Palette.textInverse };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim.box,
          height: dim.box,
          backgroundColor: palette.bg,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <MaterialIcons name="volume-up" size={dim.icon} color={palette.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
