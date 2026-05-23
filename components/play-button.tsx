import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/lib/theme/theme-context";

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
  const { palette } = useTheme();
  const styles = createStyles();
  const dim = sizes[size];
  const colors =
    tone === "soft"
      ? { bg: palette.brandSoft, fg: palette.brandDark }
      : { bg: "rgba(255,255,255,0.18)", fg: palette.textInverse };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim.box,
          height: dim.box,
          backgroundColor: colors.bg,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <MaterialIcons name="volume-up" size={dim.icon} color={colors.fg} />
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    base: {
      borderRadius: Radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.4 },
  });
}
