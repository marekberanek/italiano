import NetInfo from "@react-native-community/netinfo";

import { isContentBundleId, type ContentBundleId } from "@/lib/content/bundle-ids";
import {
  readManifestVersion,
  writeCachedBundle,
  writeLastSyncAt,
  writeManifestVersion,
} from "@/lib/content/cache";
import { getContentBaseUrl, getContentBundleUrl, getContentManifestUrl } from "@/lib/content/config";
import { emitContentUpdated } from "@/lib/content/content-events";

export type ContentManifest = {
  version: string;
  bundles: string[];
};

export type SyncResult = {
  ok: boolean;
  updated: boolean;
  message?: string;
};

/**
 * Downloads manifest + all bundles when online and base URL is set.
 * When offline or on error, leaves existing AsyncStorage cache untouched.
 * User vocabulary (separate keys) is never modified here.
 */
export async function syncRemoteContent(options?: { force?: boolean }): Promise<SyncResult> {
  const base = getContentBaseUrl();
  if (!base) {
    return { ok: true, updated: false, message: "no_content_base" };
  }

  const net = await NetInfo.fetch();
  const online =
    net.isConnected === true &&
    (net.isInternetReachable === true || net.isInternetReachable === null);

  if (!online) {
    return { ok: true, updated: false, message: "offline" };
  }

  let manifest: ContentManifest;
  try {
    const res = await fetch(getContentManifestUrl());
    if (!res.ok) {
      return { ok: false, updated: false, message: `manifest_http_${res.status}` };
    }
    manifest = (await res.json()) as ContentManifest;
    if (!manifest?.version || !Array.isArray(manifest.bundles)) {
      return { ok: false, updated: false, message: "manifest_invalid" };
    }
  } catch {
    return { ok: false, updated: false, message: "manifest_network" };
  }

  const localVersion = await readManifestVersion();
  if (!options?.force && localVersion === manifest.version) {
    return { ok: true, updated: false, message: "up_to_date" };
  }

  let anyWritten = false;
  for (const id of manifest.bundles) {
    if (!isContentBundleId(id)) continue;
    try {
      const res = await fetch(getContentBundleUrl(id));
      if (!res.ok) continue;
      const text = await res.text();
      JSON.parse(text);
      await writeCachedBundle(id as ContentBundleId, text);
      anyWritten = true;
    } catch {
      // Keep previous cache for this bundle.
    }
  }

  if (anyWritten) {
    await writeManifestVersion(manifest.version);
    await writeLastSyncAt(new Date().toISOString());
    emitContentUpdated();
  }

  return {
    ok: true,
    updated: anyWritten,
    message: anyWritten ? "synced" : "no_bundles_written",
  };
}
