import { useCallback, useEffect, useState } from "react";

import type { ContentBundleId } from "@/lib/content/bundle-ids";
import { readCachedBundle } from "@/lib/content/cache";
import { subscribeContentUpdated } from "@/lib/content/content-events";

export type ContentDataSource = "bundled" | "cache";

/**
 * Shows bundled JSON immediately, then overlays data from AsyncStorage when a remote sync
 * has stored a newer copy. Subscribes to post-sync updates.
 */
export function useSyncedJson<T>(bundleId: ContentBundleId, fallbackData: T) {
  const [data, setData] = useState<T>(fallbackData);
  const [source, setSource] = useState<ContentDataSource>("bundled");

  const load = useCallback(async () => {
    const raw = await readCachedBundle(bundleId);
    if (!raw) {
      setData(fallbackData);
      setSource("bundled");
      return;
    }
    try {
      setData(JSON.parse(raw) as T);
      setSource("cache");
    } catch {
      setData(fallbackData);
      setSource("bundled");
    }
  }, [bundleId, fallbackData]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeContentUpdated(() => {
      void load();
    });
  }, [load]);

  return { data, source, refresh: load };
}
