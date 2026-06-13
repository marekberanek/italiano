import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getSupabase } from "@/lib/auth/supabase";

/**
 * OAuth return target for web / iOS PWA. Supabase PKCE (`detectSessionInUrl`)
 * exchanges `?code=` on load; we then send the user to Profile.
 */
export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      router.replace("/(tabs)/profile");
      return;
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oauthErr =
        params.get("error_description")?.trim() || params.get("error")?.trim() || null;
      if (oauthErr) {
        setError(oauthErr);
        return;
      }
    }

    let settled = false;
    const goProfile = () => {
      if (settled) return;
      settled = true;
      router.replace("/(tabs)/profile");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) goProfile();
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goProfile();
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        setError("Přihlášení se nezdařilo. Zkus to znovu z Profilu.");
      }
    }, 20_000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View style={styles.wrap}>
      {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  error: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
  },
});
