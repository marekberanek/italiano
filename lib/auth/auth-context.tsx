import type { Session, User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Platform } from "react-native";

import { isSupabaseConfigured } from "@/lib/auth/config";
import { getSupabase } from "@/lib/auth/supabase";
import { loadVocabState } from "@/lib/storage/vocab-store";
import { fullVocabSync } from "@/lib/sync/vocab-sync";

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MERGE_FLAG_KEY = "italiano.auth.mergeNoticeShown.v1";

async function shouldShowMergeNotice(): Promise<boolean> {
  try {
    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    const v = await AsyncStorage.getItem(MERGE_FLAG_KEY);
    return v !== "1";
  } catch {
    return false;
  }
}

async function setMergeNoticeShown(): Promise<void> {
  try {
    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem(MERGE_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const refreshSession = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setSession(null);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session ?? null);
      if (!cancelled) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const runPostSignInSync = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const hadLocal = (await loadVocabState()).vocab.length > 0;
    await fullVocabSync(supabase);
    if (hadLocal && (await shouldShowMergeNotice())) {
      await setMergeNoticeShown();
      Alert.alert(
        "Slovíčka",
        "Lokální slovíčka na tomto zařízení byla sloučena s tvým účtem a zálohována na server.",
      );
    }
  }, []);

  useEffect(() => {
    if (!session?.user || !configured) return;
    void runPostSignInSync();
  }, [session?.user?.id, configured, runPostSignInSync]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      Alert.alert("Chybí konfigurace", "Nastav EXPO_PUBLIC_SUPABASE_URL a EXPO_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const redirectTo = makeRedirectUri({ scheme: "italiano" });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      Alert.alert("Přihlášení", error.message);
      return;
    }
    const url = data.url;
    if (!url) {
      Alert.alert("Přihlášení", "Nepodařilo se získat OAuth URL.");
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
    if (result.type !== "success" || !("url" in result) || !result.url) {
      return;
    }
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(result.url);
    if (exErr) Alert.alert("Přihlášení", exErr.message);
  }, []);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Apple", "Přihlášení přes Apple je dostupné jen na iOS.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      Alert.alert("Chybí konfigurace", "Nastav EXPO_PUBLIC_SUPABASE_URL a EXPO_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      Alert.alert("Apple", "Sign in with Apple na tomto zařízení není k dispozici.");
      return;
    }
    let cred: AppleAuthentication.AppleAuthenticationCredential;
    try {
      cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
      if (code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Apple", e instanceof Error ? e.message : "Nepodařilo se přihlásit.");
      return;
    }
    if (!cred.identityToken) {
      Alert.alert("Apple", "Chybí identity token.");
      return;
    }
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: cred.identityToken,
    });
    if (error) Alert.alert("Přihlášení", error.message);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshSession,
    }),
    [
      session,
      loading,
      configured,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
