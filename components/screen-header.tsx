import { StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@/components/app-logo";
import { UserAvatar } from "@/components/user-avatar";
import { Palette, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/lib/auth/use-auth";

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {user ? <UserAvatar size={44} /> : <AppLogo variant="badge" size={44} />}
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
