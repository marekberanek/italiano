import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ContentBundleId } from "@/lib/content/bundle-ids";

const PREFIX = "italiano.content.";

export const MANIFEST_VERSION_KEY = `${PREFIX}manifestVersion`;
export const LAST_SYNC_AT_KEY = `${PREFIX}lastSyncAt`;

export function bundleCacheKey(bundle: ContentBundleId): string {
  return `${PREFIX}bundle.${bundle}`;
}

export async function readCachedBundle(bundle: ContentBundleId): Promise<string | null> {
  return AsyncStorage.getItem(bundleCacheKey(bundle));
}

export async function writeCachedBundle(bundle: ContentBundleId, json: string): Promise<void> {
  await AsyncStorage.setItem(bundleCacheKey(bundle), json);
}

export async function readManifestVersion(): Promise<string | null> {
  return AsyncStorage.getItem(MANIFEST_VERSION_KEY);
}

export async function writeManifestVersion(version: string): Promise<void> {
  await AsyncStorage.setItem(MANIFEST_VERSION_KEY, version);
}

export async function writeLastSyncAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_AT_KEY, iso);
}

export async function readLastSyncAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_AT_KEY);
}
