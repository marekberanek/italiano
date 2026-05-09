import { StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@/components/app-logo";
import { Palette, Spacing, Typography } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <AppLogo variant="badge" size={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { ...Typography.title, color: Palette.textStrong },
  subtitle: { ...Typography.small, color: Palette.textMuted },
});
