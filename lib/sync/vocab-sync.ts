import type { SupabaseClient } from "@supabase/supabase-js";

import type { VocabState, VocabWord } from "@/assets/data/types";
import { readDeletionQueue, removeFromDeletionQueue } from "@/lib/storage/vocab-deletions";
import { emitVocabExternalChange } from "@/lib/storage/vocab-events";
import { loadVocabState, saveVocabState } from "@/lib/storage/vocab-store";

export type RemoteVocabRow = {
  client_uuid: string;
  it: string;
  cz: string;
  p: string;
  learned: boolean;
  streak: number;
  updated_at: string;
  deleted_at: string | null;
};

function isoNow(): string {
  return new Date().toISOString();
}

/** Merge remote `vocab_items` rows into local state (offline-first rules). */
export function mergeRemoteRowsIntoState(local: VocabState, remote: RemoteVocabRow[]): VocabState {
  const byUuid = new Map(local.vocab.map((w) => [w.clientUuid, { ...w }]));
  let maxId = local.vocab.reduce((m, w) => Math.max(m, w.id), 0);
  maxId = Math.max(maxId, local.nextId - 1);

  for (const row of remote) {
    if (row.deleted_at) {
      byUuid.delete(row.client_uuid);
      continue;
    }
    const existing = byUuid.get(row.client_uuid);
    if (!existing) {
      maxId += 1;
      byUuid.set(row.client_uuid, {
        id: maxId,
        clientUuid: row.client_uuid,
        it: row.it,
        cz: row.cz,
        p: row.p ?? "",
        learned: row.learned,
        streak: row.streak,
        updatedAt: row.updated_at,
      });
      continue;
    }
    const localT = existing.updatedAt ?? "";
    const remoteT = row.updated_at;
    const streak = Math.max(existing.streak, row.streak);
    const learned = existing.learned || row.learned;
    const textFromRemote = remoteT > localT;
    byUuid.set(row.client_uuid, {
      ...existing,
      streak,
      learned,
      it: textFromRemote ? row.it : existing.it,
      cz: textFromRemote ? row.cz : existing.cz,
      p: textFromRemote ? (row.p ?? "") : existing.p,
      updatedAt: (remoteT > localT ? remoteT : existing.updatedAt) ?? remoteT,
    });
  }

  const vocab = [...byUuid.values()].sort((a, b) => b.id - a.id);
  const nextId = Math.max(local.nextId, maxId + 1);
  return { vocab, nextId };
}

export async function pullVocabRows(supabase: SupabaseClient): Promise<RemoteVocabRow[] | null> {
  const { data, error } = await supabase
    .from("vocab_items")
    .select("client_uuid,it,cz,p,learned,streak,updated_at,deleted_at")
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("pullVocabRows", error.message);
    return null;
  }
  return (data ?? []) as RemoteVocabRow[];
}

export async function pushVocabToRemote(supabase: SupabaseClient, state: VocabState): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return;

  const delQueue = await readDeletionQueue();
  for (const clientUuid of delQueue) {
    const { error } = await supabase
      .from("vocab_items")
      .delete()
      .eq("user_id", userId)
      .eq("client_uuid", clientUuid);
    if (!error) await removeFromDeletionQueue(clientUuid);
  }

  const now = isoNow();
  const rows = state.vocab.map((w) => ({
    user_id: userId,
    client_uuid: w.clientUuid,
    it: w.it,
    cz: w.cz,
    p: w.p ?? "",
    learned: w.learned,
    streak: w.streak,
    updated_at: w.updatedAt ?? now,
    deleted_at: null as string | null,
  }));

  const chunk = 40;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supabase.from("vocab_items").upsert(slice, {
      onConflict: "user_id,client_uuid",
    });
    if (error) console.warn("pushVocabToRemote", error.message);
  }
}

export async function fullVocabSync(supabase: SupabaseClient): Promise<void> {
  const rows = await pullVocabRows(supabase);
  if (rows === null) return;
  const local = await loadVocabState();
  const merged = mergeRemoteRowsIntoState(local, rows);
  await saveVocabState(merged);
  emitVocabExternalChange();
  await pushVocabToRemote(supabase, merged);
}

export function bumpWordUpdatedAt(word: VocabWord): VocabWord {
  return { ...word, updatedAt: isoNow() };
}
