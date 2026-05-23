import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type Props = {
  /** Heading shown at the top of the card. */
  title?: string;
  /** Sub-text explaining why sign-in is required for the current action. */
  description?: string;
  /** Label for the CTA. Defaults to "Přejít na profil". */
  ctaLabel?: string;
  /**
   * Optional hook fired *before* navigating. Use it from inside a Modal so the
   * modal can close itself first; we then push to /(tabs)/profile.
   */
  onBeforeNavigate?: () => void;
};

/**
 * Drop-in placeholder card used wherever a feature requires the user to be
 * signed in (vocab translation, Add-word search, reminder settings).
 *
 * Keeps the visual language consistent across the three call sites and
 * centralises the navigation target — so when we ever move the auth flow,
 * we update one place.
 */
export function SignInRequiredCard({
  title = "Přihlaš se, prosím",
  description = "Tato funkce je dostupná po přihlášení v záložce Profil.",
  ctaLabel = "Přejít na profil",
  onBeforeNavigate,
}: Props) {
  const router = useRouter();
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const handlePress = () => {
    onBeforeNavigate?.();
    router.push("/(tabs)/profile");
  };
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="lock-outline" size={28} color={palette.brandDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{description}</Text>
      <PrimaryButton
        label={ctaLabel}
        variant="primary"
        onPress={handlePress}
        icon={<MaterialIcons name="login" size={18} color={palette.textInverse} />}
      />
    </View>
  );
}

function createStyles(p: ColorPalette, s: ThemeShadows) {
  return StyleSheet.create({
    card: {
      backgroundColor: p.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: p.border,
      padding: Spacing.lg,
      gap: Spacing.md,
      alignItems: "stretch",
      ...s.card,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: p.brandSoft,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-start",
    },
    title: {
      ...Typography.sectionTitle,
      color: p.textStrong,
    },
    body: {
      ...Typography.body,
      color: p.textMuted,
    },
  });
}
