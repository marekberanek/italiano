import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/lib/auth/use-auth";
import { getAccountDeleteUrl, getAccountExportUrl } from "@/lib/api/vercel-origin";
import { getAccessToken, getSupabase } from "@/lib/auth/supabase";
import { fullVocabSync } from "@/lib/sync/vocab-sync";

export default function ProfileScreen() {
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();
  const [busy, setBusy] = useState<null | "sync" | "export" | "delete">(null);

  const onSync = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy("sync");
    try {
      await fullVocabSync(supabase);
      Alert.alert("Hotovo", "Slovíčka jsou synchronizovaná se serverem.");
    } finally {
      setBusy(null);
    }
  }, []);

  const onExport = useCallback(async () => {
    const url = getAccountExportUrl();
    if (!url) {
      Alert.alert("Export", "Není nastavený EXPO_PUBLIC_TRANSLATE_ENDPOINT (stejný backend jako účet).");
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      Alert.alert("Export", "Nejsi přihlášený.");
      return;
    }
    setBusy("export");
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      if (!res.ok) {
        Alert.alert("Export", text || `Chyba ${res.status}`);
        return;
      }
      await Share.share({ message: text, title: "Italiano export" });
    } finally {
      setBusy(null);
    }
  }, []);

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
        <ScreenHeader title="Profil" subtitle="Účet a synchronizace" />
        <View style={styles.center}>
          <ActivityIndicator color={Palette.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Profil" subtitle="Účet a synchronizace slovíček" />

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

      <View style={styles.card}>
        <Text style={styles.label}>Stav</Text>
        <Text style={styles.value}>
          {user?.email ?? user?.id ?? "Nepřihlášený"}
        </Text>
      </View>

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
            onPress={() => void onSync()}
            disabled={busy !== null}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, busy && styles.disabled]}
          >
            {busy === "sync" ? (
              <ActivityIndicator color={Palette.textInverse} />
            ) : (
              <MaterialIcons name="cloud-sync" size={20} color={Palette.textInverse} />
            )}
            <Text style={styles.primaryLabel}>Synchronizovat slovíčka</Text>
          </Pressable>

          <Pressable
            onPress={() => void onExport()}
            disabled={busy !== null}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed, busy && styles.disabled]}
          >
            <MaterialIcons name="file-download" size={20} color={Palette.textStrong} />
            <Text style={styles.secondaryLabel}>Export dat (JSON)</Text>
          </Pressable>

          <Pressable
            onPress={() => void signOut()}
            disabled={busy !== null}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed, busy && styles.disabled]}
          >
            <MaterialIcons name="logout" size={20} color={Palette.textStrong} />
            <Text style={styles.secondaryLabel}>Odhlásit</Text>
          </Pressable>

          <Pressable
            onPress={onDeleteAccount}
            disabled={busy !== null}
            style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed, busy && styles.disabled]}
          >
            {busy === "delete" ? (
              <ActivityIndicator color={Palette.textInverse} />
            ) : (
              <MaterialIcons name="delete-forever" size={20} color={Palette.textInverse} />
            )}
            <Text style={styles.primaryLabel}>Smazat účet</Text>
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
  label: { ...Typography.caption, color: Palette.textMuted, textTransform: "uppercase" },
  value: { ...Typography.body, color: Palette.textStrong },
  actions: { gap: Spacing.md, marginTop: Spacing.sm },
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
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Palette.danger,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  primaryLabel: { fontFamily: "Nunito_700Bold", fontSize: 16, color: Palette.textInverse },
  secondaryLabel: { fontFamily: "Nunito_700Bold", fontSize: 16, color: Palette.textStrong },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
});
