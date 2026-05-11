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
  kind?: string;
  ex_it?: string;
  ex_cz?: string;
  learned: boolean;
  streak: number;
  updated_at: string;
  deleted_at: string | null;
};

function isoNow(): string {
  return new Date().toISOString();
}

function normalizeKind(raw: string | undefined): "word" | "phrase" {
  return raw === "phrase" ? "phrase" : "word";
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
      const exItNew = (row.ex_it ?? "").trim();
      const exCzNew = (row.ex_cz ?? "").trim();
      byUuid.set(row.client_uuid, {
        id: maxId,
        clientUuid: row.client_uuid,
        kind: normalizeKind(row.kind),
        it: row.it,
        cz: row.cz,
        p: row.p ?? "",
        ...(exItNew ? { exIt: exItNew } : {}),
        ...(exCzNew ? { exCz: exCzNew } : {}),
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
    const exItRemote = (row.ex_it ?? "").trim();
    const exCzRemote = (row.ex_cz ?? "").trim();
    const exItLocal = existing.exIt?.trim() ?? "";
    const exCzLocal = existing.exCz?.trim() ?? "";

    const examplePatch: Partial<Pick<VocabWord, "exIt" | "exCz">> = {};
    if (textFromRemote) {
      if (exItRemote) examplePatch.exIt = exItRemote;
      if (exCzRemote) examplePatch.exCz = exCzRemote;
    } else {
      if (exItLocal) examplePatch.exIt = exItLocal;
      if (exCzLocal) examplePatch.exCz = exCzLocal;
    }

    const merged: VocabWord = {
      ...existing,
      streak,
      learned,
      kind: textFromRemote ? normalizeKind(row.kind) : (existing.kind ?? "word"),
      it: textFromRemote ? row.it : existing.it,
      cz: textFromRemote ? row.cz : existing.cz,
      p: textFromRemote ? (row.p ?? "") : existing.p,
      ...examplePatch,
      updatedAt: (remoteT > localT ? remoteT : existing.updatedAt) ?? remoteT,
    };
    if (textFromRemote && !exItRemote) delete merged.exIt;
    if (textFromRemote && !exCzRemote) delete merged.exCz;

    byUuid.set(row.client_uuid, merged);
  }

  const vocab = [...byUuid.values()].sort((a, b) => b.id - a.id);
  const nextId = Math.max(local.nextId, maxId + 1);
  return { vocab, nextId };
}

export async function pullVocabRows(supabase: SupabaseClient): Promise<RemoteVocabRow[]> {
  const withExamples = await supabase
    .from("vocab_items")
    .select("client_uuid,it,cz,p,kind,ex_it,ex_cz,learned,streak,updated_at,deleted_at")
    .order("updated_at", { ascending: false });

  if (!withExamples.error) {
    return (withExamples.data ?? []) as RemoteVocabRow[];
  }

  const msg = withExamples.error.message.toLowerCase();
  const missingExampleCols =
    msg.includes("ex_it") ||
    msg.includes("ex_cz") ||
    msg.includes("kind") ||
    msg.includes("column") ||
    msg.includes("schema cache");

  if (!missingExampleCols) {
    console.warn("pullVocabRows", withExamples.error.message);
    return [];
  }

  const withExamplesNoKind = await supabase
    .from("vocab_items")
    .select("client_uuid,it,cz,p,ex_it,ex_cz,learned,streak,updated_at,deleted_at")
    .order("updated_at", { ascending: false });

  if (!withExamplesNoKind.error) {
    return (withExamplesNoKind.data ?? []) as RemoteVocabRow[];
  }

  const baseOnly = await supabase
    .from("vocab_items")
    .select("client_uuid,it,cz,p,learned,streak,updated_at,deleted_at")
    .order("updated_at", { ascending: false });

  if (baseOnly.error) {
    console.warn("pullVocabRows (without examples)", baseOnly.error.message);
    return [];
  }

  return (baseOnly.data ?? []) as RemoteVocabRow[];
}

export type VocabPushResult = {
  ok: boolean;
  /** True when `getSession()` returned no user — nothing was sent. */
  skippedNoSession: boolean;
  /** Words in the state we tried to push (after merge). */
  rowCount: number;
  /** Set when at least one chunk failed after any retry. */
  error?: string;
};

export async function pushVocabToRemote(
  supabase: SupabaseClient,
  state: VocabState,
): Promise<VocabPushResult> {
  const rowCount = state.vocab.length;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    return {
      ok: false,
      skippedNoSession: true,
      rowCount,
      error: "Nejsi přihlášený — push na server se přeskočil.",
    };
  }

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
    kind: w.kind ?? "word",
    ex_it: w.exIt?.trim() ?? "",
    ex_cz: w.exCz?.trim() ?? "",
    learned: w.learned,
    streak: w.streak,
    updated_at: w.updatedAt ?? now,
    deleted_at: null as string | null,
  }));

  if (rows.length === 0) {
    return { ok: true, skippedNoSession: false, rowCount: 0 };
  }

  const chunk = 40;
  let lastError: string | undefined;
  let hadError = false;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    let { error } = await supabase.from("vocab_items").upsert(slice, {
      onConflict: "user_id,client_uuid",
    });
    if (error && /ex_it|ex_cz|kind|schema cache|column/i.test(error.message)) {
      const slim = slice.map((r) => ({
        user_id: r.user_id,
        client_uuid: r.client_uuid,
        it: r.it,
        cz: r.cz,
        p: r.p,
        learned: r.learned,
        streak: r.streak,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
      }));
      ({ error } = await supabase.from("vocab_items").upsert(slim, {
        onConflict: "user_id,client_uuid",
      }));
    }
    if (error) {
      hadError = true;
      lastError = error.message;
      console.warn("pushVocabToRemote", error.message);
    }
  }

  if (hadError) {
    return { ok: false, skippedNoSession: false, rowCount, error: lastError };
  }
  return { ok: true, skippedNoSession: false, rowCount };
}

export type FullVocabSyncResult = {
  localCount: number;
  remoteCount: number;
  mergedCount: number;
  push: VocabPushResult;
};

export async function fullVocabSync(supabase: SupabaseClient): Promise<FullVocabSyncResult> {
  const remote = await pullVocabRows(supabase);
  const local = await loadVocabState();
  const merged = mergeRemoteRowsIntoState(local, remote);
  await saveVocabState(merged);
  emitVocabExternalChange();
  const push = await pushVocabToRemote(supabase, merged);
  return {
    localCount: local.vocab.length,
    remoteCount: remote.length,
    mergedCount: merged.vocab.length,
    push,
  };
}

export function bumpWordUpdatedAt(word: VocabWord): VocabWord {
  return { ...word, updatedAt: isoNow() };
}
