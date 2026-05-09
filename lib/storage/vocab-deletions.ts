import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "italiano.vocab.deletedClientUuids.v1";

export async function readDeletionQueue(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]).filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function enqueueDeletion(clientUuid: string): Promise<void> {
  const cur = await readDeletionQueue();
  if (cur.includes(clientUuid)) return;
  cur.push(clientUuid);
  await AsyncStorage.setItem(KEY, JSON.stringify(cur));
}

export async function removeFromDeletionQueue(clientUuid: string): Promise<void> {
  const cur = await readDeletionQueue();
  const next = cur.filter((u) => u !== clientUuid);
  if (next.length === 0) await AsyncStorage.removeItem(KEY);
  else await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
