import { Platform } from "react-native";

/** Same-origin API base on web (Vercel rewrite proxies /api/* to backend). */
export function getWebApiOrigin(): string | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined" || !window.location?.origin) return null;
  return window.location.origin;
}

/** Resolve Vercel API origin from translate endpoint (same deployment as account/delete). */
export function getVercelApiOriginFromTranslate(): string | null {
  const webOrigin = getWebApiOrigin();
  if (webOrigin) return webOrigin;
  const raw = process.env.EXPO_PUBLIC_TRANSLATE_ENDPOINT?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function getAccountDeleteUrl(): string | null {
  const o = getVercelApiOriginFromTranslate();
  return o ? `${o}/api/account/delete` : null;
}

export function getAccountExportUrl(): string | null {
  const o = getVercelApiOriginFromTranslate();
  return o ? `${o}/api/account/export` : null;
}
