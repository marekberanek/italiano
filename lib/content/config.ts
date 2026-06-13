import Constants from "expo-constants";

import { getWebApiOrigin } from "@/lib/api/vercel-origin";

type Extra = {
  contentBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** Base URL of Vercel dev / deploy (no trailing slash), e.g. http://192.168.1.5:3000 */
export function getContentBaseUrl(): string {
  const webOrigin = getWebApiOrigin();
  if (webOrigin) return webOrigin;
  const fromEnv = process.env.EXPO_PUBLIC_CONTENT_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromExtra = extra.contentBaseUrl?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, "");
  return "";
}

export function getContentManifestUrl(): string {
  const base = getContentBaseUrl();
  if (!base) return "";
  return `${base}/api/content-manifest`;
}

export function getContentBundleUrl(bundle: string): string {
  const base = getContentBaseUrl();
  if (!base) return "";
  return `${base}/api/content-bundle?bundle=${encodeURIComponent(bundle)}`;
}
