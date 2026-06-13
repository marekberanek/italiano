import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/auth/config";

// Note on storage choice: Supabase session blobs are typically 3–5 KB
// (access + refresh JWTs + user metadata). iOS Keychain values via
// `expo-secure-store` are capped at ~2 KB per entry, which causes
// "No suitable key or wrong key type" errors when the session straddles
// that limit. AsyncStorage is the standard Supabase recommendation for
// React Native — the JWT itself is the secret and is also protected by
// RLS on the server side, so plain-storage is acceptable for this app.
const AUTH_STORAGE_KEY = "italiano.supabase.auth";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!url || !anon) return null;
  client = createClient(url, anon, {
    auth: {
      storage: AsyncStorage,
      storageKey: AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
      flowType: "pkce",
    },
  });
  return client;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
