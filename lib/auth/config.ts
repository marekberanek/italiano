import Constants from "expo-constants";

function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const v = extra?.[key];
  return typeof v === "string" ? v.trim() || undefined : undefined;
}

export function getSupabaseUrl(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  return readExtra("supabaseUrl") ?? null;
}

export function getSupabaseAnonKey(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (fromEnv) return fromEnv;
  return readExtra("supabaseAnonKey") ?? null;
}

export function isSupabaseConfigured(): boolean {
  return !!(getSupabaseUrl() && getSupabaseAnonKey());
}
