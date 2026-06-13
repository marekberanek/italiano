import { StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@/components/app-logo";
import { BackLink } from "@/components/back-link";
import { UserAvatar } from "@/components/user-avatar";
import type { ColorPalette } from "@/constants/theme";
import { Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useAuth } from "@/lib/auth/use-auth";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
};

export function ScreenHeader({ title, subtitle, showBack = false, backLabel }: Props) {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const trailing = user ? <UserAvatar size={44} /> : <AppLogo variant="badge" size={44} />;

  if (showBack) {
    return (
      <View style={styles.stack}>
        <View style={styles.toolbar}>
          <BackLink label={backLabel} />
          {trailing}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
    },
    stack: {
      gap: Spacing.sm,
    },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
    },
    textWrap: { flex: 1, gap: 2 },
    title: { ...Typography.title, color: p.textStrong },
    subtitle: { ...Typography.small, color: p.textMuted },
  });
}
