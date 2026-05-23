import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import type { ColorPalette } from "@/constants/theme";
import { Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type Props = {
  label?: string;
};

export function BackLink({ label = "Lekce" }: Props) {
  const router = useRouter();
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <MaterialIcons name="arrow-back" size={18} color={palette.text} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      alignSelf: "flex-start",
      paddingVertical: 4,
    },
    label: { ...Typography.smallStrong, color: p.text, fontSize: 14 },
    pressed: { opacity: 0.5 },
  });
}
