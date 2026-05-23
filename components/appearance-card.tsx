import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { CategoryChip } from "@/components/category-chip";
import {
  AUTO_LIGHT_END_HOUR,
  AUTO_LIGHT_START_HOUR,
  type AppearanceMode,
} from "@/lib/theme/appearance-settings";
import { useTheme } from "@/lib/theme/theme-context";
import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

const MODES: { mode: AppearanceMode; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  {
    mode: "auto",
    label: "Podle denní doby",
    icon: "wb-twilight",
  },
  {
    mode: "system",
    label: "Podle systému",
    icon: "brightness-auto",
  },
  { mode: "light", label: "Světlý", icon: "light-mode" },
  { mode: "dark", label: "Tmavý", icon: "dark-mode" },
];

function modeHint(mode: AppearanceMode): string {
  switch (mode) {
    case "auto":
      return `Světlý ${AUTO_LIGHT_START_HOUR}:00–${AUTO_LIGHT_END_HOUR}:00, jinak tmavý.`;
    case "system":
      return "Stejně jako nastavení telefonu (včetně automatiky při soumraku).";
    case "light":
      return "Vždy světlé pozadí a karty.";
    case "dark":
      return "Vždy tmavé pozadí — šetří oči večer.";
  }
}

export function AppearanceCard() {
  const { appearanceMode, setAppearanceMode, colorScheme, palette } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialIcons
          name={colorScheme === "dark" ? "dark-mode" : "light-mode"}
          size={22}
          color={palette.brand}
        />
        <Text style={styles.title}>Vzhled</Text>
      </View>
      <Text style={styles.hint}>{modeHint(appearanceMode)}</Text>
      <View style={styles.chips}>
        {MODES.map(({ mode, label, icon }) => (
          <CategoryChip
            key={mode}
            label={label}
            icon={icon}
            active={appearanceMode === mode}
            onPress={() => void setAppearanceMode(mode)}
          />
        ))}
      </View>
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
      marginBottom: Spacing.md,
      gap: Spacing.sm,
      ...s.card,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    title: { ...Typography.sectionTitle, color: p.textStrong },
    hint: { ...Typography.small, color: p.textMuted },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
  });
}
