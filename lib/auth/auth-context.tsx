import type { Session, User } from "@supabase/supabase-js";
import Constants, { ExecutionEnvironment } from "expo-constants";
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
import { Alert, AppState, Platform } from "react-native";

import { isSupabaseConfigured } from "@/lib/auth/config";
import { getSupabase } from "@/lib/auth/supabase";
import { loadVocabState } from "@/lib/storage/vocab-store";
import { fullVocabSync } from "@/lib/sync/vocab-sync";

WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth redirect that ASWebAuthenticationSession / Chrome tabs can return to.
 *
 * In **Expo Go** (`ExecutionEnvironment.StoreClient`) the running host is the
 * Expo client — `expo-linking` therefore resolves deep links to `exp://…`
 * (see `resolveScheme` in `expo-linking`). Passing `scheme: "italiano"` is
 * ignored there, yet Supabase + Google still need the *actual* `redirectTo`
 * we send in `signInWithOAuth` to appear on the Supabase allow-list. If the
 * list only contains `italiano://`, the browser never hands control back to
 * the app and `openAuthSessionAsync` spins forever.
 *
 * In **standalone / dev builds** we keep `makeRedirectUri({ scheme: "italiano" })`
 * (no path) so Supabase allow-lists that already list `italiano://` keep working.
 */
function oauthRedirectUri(): string {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return makeRedirectUri({ path: "auth/callback" });
  }
  return makeRedirectUri({ scheme: "italiano" });
}

/**
 * `exchangeCodeForSession` must receive the **auth code string only** (GoTrue
 * `grant_type=pkce` body field `auth_code`). Passing the full deep link
 * (`exp://…?code=…`) makes the server respond with *no valid flow state*.
 */
function extractPkceAuthCode(callbackUrl: string): string | null {
  try {
    const u = new URL(callbackUrl);
    const err =
      u.searchParams.get("error_description")?.trim() ||
      u.searchParams.get("error")?.trim();
    if (err) return null;
    const code = u.searchParams.get("code")?.trim();
    if (code) return code;
  } catch {
    // non-standard URL — try hash fragment (some providers use #query)
  }
  const hash = callbackUrl.includes("#") ? callbackUrl.split("#")[1] : "";
  if (!hash) return null;
  try {
    const qs = new URLSearchParams(hash.startsWith("?") ? hash.slice(1) : hash);
    return qs.get("code")?.trim() ?? null;
  } catch {
    return null;
  }
}

function isInvalidRefreshTokenError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : (err as { message?: unknown }).message;
  return typeof msg === "string" && /refresh\s*token/i.test(msg);
}

function extractOAuthRedirectError(callbackUrl: string): string | null {
  try {
    const u = new URL(callbackUrl);
    return (
      u.searchParams.get("error_description")?.trim() ||
      u.searchParams.get("error")?.trim() ||
      null
    );
  } catch {
    return null;
  }
}

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
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error && isInvalidRefreshTokenError(error)) {
          // Stale session left over from a previous Supabase project (or
          // expired beyond the refresh window). Wipe it so the UI shows
          // the sign-in button instead of looping with the same warning.
          await supabase.auth.signOut().catch(() => undefined);
          setSession(null);
        } else {
          setSession(data.session ?? null);
        }
      } catch (e) {
        if (cancelled) return;
        if (isInvalidRefreshTokenError(e)) {
          await supabase.auth.signOut().catch(() => undefined);
        }
        setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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
    const sync = await fullVocabSync(supabase);
    if (hadLocal && sync.push.ok && (await shouldShowMergeNotice())) {
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

  // Auto-pull when the app returns to the foreground so changes made on
  // another device land here without the user having to do anything. The
  // local push that follows in `fullVocabSync` is debounced & idempotent so
  // it's a no-op when there's nothing to send.
  useEffect(() => {
    if (!session?.user || !configured) return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      const supabase = getSupabase();
      if (!supabase) return;
      void fullVocabSync(supabase).catch(() => undefined);
    });
    return () => sub.remove();
  }, [session?.user?.id, configured]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      Alert.alert("Chybí konfigurace", "Nastav EXPO_PUBLIC_SUPABASE_URL a EXPO_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const redirectTo = oauthRedirectUri();
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
    const callbackUrl = result.url;
    const oauthErr = extractOAuthRedirectError(callbackUrl);
    if (oauthErr) {
      Alert.alert("Přihlášení", oauthErr);
      return;
    }
    const authCode = extractPkceAuthCode(callbackUrl);
    if (!authCode) {
      Alert.alert(
        "Přihlášení",
        "V návratové URL chybí parametr code. Zkus znovu nebo zkontroluj Redirect URLs v Supabase.",
      );
      return;
    }
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(authCode);
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
