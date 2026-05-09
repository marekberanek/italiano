/** Resolve Vercel API origin from translate endpoint (same deployment as account/delete). */
export function getVercelApiOriginFromTranslate(): string | null {
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
