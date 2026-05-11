import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@/components/app-logo";
import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";

type Extra = {
  displayName?: string;
  tagline?: string;
  author?: string;
  repositoryUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const APP_NAME = extra.displayName?.trim() || Constants.expoConfig?.name || "Italiano";
const TAGLINE = extra.tagline?.trim() || "";
const AUTHOR = extra.author?.trim() || "";
const REPO_URL = extra.repositoryUrl?.trim() || "";

/**
 * Build label is a best-effort runtime version. `Constants.expoConfig.version`
 * comes from `package.json` via `app.config.ts`; for OTA / native builds Expo
 * additionally exposes `nativeAppVersion` and `nativeBuildVersion`. We surface
 * the marketing version (always available) and append the build number only when
 * the runtime provides one (EAS builds, not Expo Go).
 */
function buildVersionLabel(): string {
  const marketing = Constants.expoConfig?.version ?? "—";
  const native = Constants.nativeBuildVersion;
  return native ? `${marketing} (${native})` : marketing;
}

/**
 * About / metadata card. Shows app name, tagline, runtime version and the
 * author. Tapping the row opens the project repository (if configured).
 *
 * Designed to live on the Profile screen but is self-contained — drop it
 * anywhere a `ScrollView`-friendly card fits.
 */
export function AboutCard() {
  const version = buildVersionLabel();

  const openRepo = async () => {
    if (!REPO_URL) return;
    try {
      const can = await Linking.canOpenURL(REPO_URL);
      if (!can) throw new Error("cannot open url");
      await Linking.openURL(REPO_URL);
    } catch {
      Alert.alert("Odkaz", `Nepodařilo se otevřít: ${REPO_URL}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppLogo variant="badge" size={56} />
        <View style={styles.headerText}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          {TAGLINE ? <Text style={styles.tagline}>{TAGLINE}</Text> : null}
        </View>
      </View>

      <View style={styles.divider} />

      <Row icon="tag" label="Verze" value={version} />
      {AUTHOR ? <Row icon="person-outline" label="Autor" value={AUTHOR} /> : null}

      {REPO_URL ? (
        <Pressable
          onPress={() => void openRepo()}
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          accessibilityRole="link"
          accessibilityLabel={`Otevřít repozitář ${REPO_URL}`}
        >
          <MaterialIcons name="open-in-new" size={18} color={Palette.brandDark} />
          <Text style={styles.linkLabel}>Otevřít repozitář</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={18} color={Palette.textMuted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  appName: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 22,
    color: Palette.textStrong,
    lineHeight: 26,
  },
  tagline: { ...Typography.small, color: Palette.textMuted },
  divider: {
    height: 1,
    backgroundColor: Palette.border,
    marginVertical: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  rowLabel: { ...Typography.smallStrong, color: Palette.textMuted },
  rowValue: { ...Typography.bodyStrong, color: Palette.textStrong, flexShrink: 1 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandSoft,
    borderWidth: 1,
    borderColor: Palette.brand,
  },
  linkPressed: { opacity: 0.75 },
  linkLabel: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 14,
    color: Palette.brandDark,
  },
});
