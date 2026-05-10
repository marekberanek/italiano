import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { UserAvatar } from "@/components/user-avatar";
import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { getAccountDeleteUrl } from "@/lib/api/vercel-origin";
import { getAccessToken } from "@/lib/auth/supabase";
import { useAuth } from "@/lib/auth/use-auth";

export default function ProfileScreen() {
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();
  const [busy, setBusy] = useState<null | "delete">(null);

  const displayName = useMemo<string | null>(() => {
    if (!user) return null;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [meta.full_name, meta.name, meta.user_name];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
    return null;
  }, [user]);

  const onDeleteAccount = useCallback(() => {
    const url = getAccountDeleteUrl();
    if (!url) {
      Alert.alert("Smazat účet", "Není nastavený EXPO_PUBLIC_TRANSLATE_ENDPOINT.");
      return;
    }
    Alert.alert(
      "Smazat účet",
      "Trvale smažeš účet a data na serveru. Lokální slovíčka v telefonu zůstanou.",
      [
        { text: "Zrušit", style: "cancel" },
        {
          text: "Smazat",
          style: "destructive",
          onPress: async () => {
            const token = await getAccessToken();
            if (!token) {
              Alert.alert("Chyba", "Nejsi přihlášený.");
              return;
            }
            setBusy("delete");
            try {
              const res = await fetch(url, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const body = await res.text();
                Alert.alert("Smazání", body || `Chyba ${res.status}`);
                return;
              }
              await signOut();
              Alert.alert("Účet smazán", "Byl jsi odhlášen.");
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }, [signOut]);

  if (loading) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Profil" subtitle="Účet" />
        <View style={styles.center}>
          <ActivityIndicator color={Palette.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Profil"
        subtitle={user ? "Slovíčka se synchronizují automaticky" : "Účet"}
      />

      {!configured ? (
        <View style={styles.card}>
          <MaterialIcons name="settings" size={22} color={Palette.textMuted} />
          <Text style={styles.cardTitle}>Supabase není nastavené</Text>
          <Text style={styles.cardBody}>
            Přidej do `.env` hodnoty `EXPO_PUBLIC_SUPABASE_URL` a `EXPO_PUBLIC_SUPABASE_ANON_KEY`, případně
            `expo.extra` v `app.json`, a restartuj Expo.
          </Text>
        </View>
      ) : null}

      {user ? (
        <View style={styles.identityCard}>
          <UserAvatar size={64} navigateTo={null} />
          <View style={styles.identityText}>
            {displayName ? <Text style={styles.identityName}>{displayName}</Text> : null}
            {user.email ? <Text style={styles.identityEmail}>{user.email}</Text> : null}
            {!displayName && !user.email ? (
              <Text style={styles.identityName}>Přihlášený uživatel</Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nejsi přihlášený</Text>
          <Text style={styles.cardBody}>
            Přihlas se a slovíčka se ti automaticky synchronizují mezi zařízeními.
          </Text>
        </View>
      )}

      {!user ? (
        <View style={styles.actions}>
          <Pressable
            onPress={() => void signInWithGoogle()}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="login" size={20} color={Palette.textInverse} />
            <Text style={styles.primaryLabel}>Přihlásit Googlem</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={() => void signOut()}
            disabled={busy !== null}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, busy && styles.disabled]}
          >
            <MaterialIcons name="logout" size={20} color={Palette.textInverse} />
            <Text style={styles.primaryLabel}>Odhlásit</Text>
          </Pressable>

          <Pressable
            onPress={onDeleteAccount}
            disabled={busy !== null}
            style={({ pressed }) => [styles.dangerLink, pressed && styles.pressed, busy && styles.disabled]}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            {busy === "delete" ? (
              <ActivityIndicator color={Palette.danger} />
            ) : (
              <Text style={styles.dangerLinkLabel}>Smazat účet trvale…</Text>
            )}
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
    gap: Spacing.sm,
  },
  cardTitle: { ...Typography.sectionTitle, color: Palette.textStrong },
  cardBody: { ...Typography.body, color: Palette.textMuted },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  identityText: { flex: 1, gap: 2 },
  identityName: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 18,
    color: Palette.textStrong,
    lineHeight: 22,
  },
  identityEmail: {
    ...Typography.small,
    color: Palette.textMuted,
  },
  actions: { gap: Spacing.lg, marginTop: Spacing.sm },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Palette.brand,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  dangerLink: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dangerLinkLabel: {
    ...Typography.smallStrong,
    color: Palette.danger,
    textDecorationLine: "underline",
  },
  primaryLabel: { fontFamily: "Nunito_700Bold", fontSize: 16, color: Palette.textInverse },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
});
