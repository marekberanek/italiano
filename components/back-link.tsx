import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { Palette, Spacing, Typography } from "@/constants/theme";

type Props = {
  label?: string;
};

export function BackLink({ label = "Lekce" }: Props) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <MaterialIcons name="arrow-back" size={18} color={Palette.text} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  label: { ...Typography.smallStrong, color: Palette.text, fontSize: 14 },
  pressed: { opacity: 0.5 },
});
