import { Image, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from "react-native";

import type { ColorPalette } from "@/constants/theme";
import { Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

const ICON_MARK = require("@/assets/images/android-icon-foreground.png");
const ICON_FULL = require("@/assets/images/icon.png");

type Variant = "mark" | "badge" | "lockup";

type Props = {
  variant?: Variant;
  size?: number;
  style?: ViewStyle | ImageStyle;
};

export function AppLogo({ variant = "badge", size = 44, style }: Props) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (variant === "mark") {
    return (
      <Image
        source={ICON_MARK}
        style={[{ width: size, height: size }, style as ImageStyle]}
        resizeMode="contain"
        accessibilityLabel="Italiano"
      />
    );
  }

  if (variant === "lockup") {
    return (
      <View style={[styles.lockup, style as ViewStyle]}>
        <Image
          source={ICON_FULL}
          style={[styles.lockupIcon, { width: size, height: size, borderRadius: size * 0.22 }]}
          accessibilityLabel="Italiano"
        />
        <View>
          <Text style={styles.lockupTitle}>Italiano</Text>
          <Text style={styles.lockupTagline}>Učím se italsky</Text>
        </View>
      </View>
    );
  }

  return (
    <Image
      source={ICON_FULL}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: palette.surface,
        },
        style as ImageStyle,
      ]}
      accessibilityLabel="Italiano"
    />
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    lockup: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    lockupIcon: {
      backgroundColor: p.surface,
    },
    lockupTitle: {
      fontFamily: Typography.display.fontFamily,
      fontSize: 22,
      color: p.textStrong,
      lineHeight: 26,
    },
    lockupTagline: {
      ...Typography.small,
      color: p.textMuted,
    },
  });
}
