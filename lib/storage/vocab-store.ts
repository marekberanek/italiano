import AsyncStorage from "@react-native-async-storage/async-storage";

import type { VocabState, VocabWord } from "@/assets/data/types";
import { randomUuid } from "@/lib/uuid";

const STORAGE_KEY = "italiano.vocab.v1";
/** Marker for the one-shot seed-streak reset migration; stored in AsyncStorage. */
const SEED_RESET_FLAG_KEY = "italiano.vocab.seedResetV1";
/** Stable prefix of all seed `clientUuid`s — see SEED below. */
const SEED_UUID_PREFIX = "a1000000-0000-4000-8000-";

function isoNow(): string {
  return new Date().toISOString();
}

const SEED: VocabWord[] = [
  {
    id: 1,
    clientUuid: "a1000000-0000-4000-8000-000000000001",
    it: "buongiorno",
    cz: "dobrý den",
    p: "[buondžorno]",
    learned: false,
    streak: 0,
    updatedAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    clientUuid: "a1000000-0000-4000-8000-000000000002",
    it: "grazie",
    cz: "děkuji",
    p: "[gracje]",
    learned: false,
    streak: 0,
    updatedAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: 3,
    clientUuid: "a1000000-0000-4000-8000-000000000003",
    it: "arrivederci",
    cz: "na shledanou",
    p: "[arrivedérči]",
    learned: false,
    streak: 0,
    updatedAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: 4,
    clientUuid: "a1000000-0000-4000-8000-000000000004",
    it: "prego",
    cz: "prosím / není zač",
    p: "[prego]",
    learned: false,
    streak: 0,
    updatedAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: 5,
    clientUuid: "a1000000-0000-4000-8000-000000000005",
    it: "ciao",
    cz: "ahoj",
    p: "[čao]",
    learned: false,
    streak: 0,
    updatedAt: "2020-01-01T00:00:00.000Z",
  },
];

const seedState = (): VocabState => ({
  vocab: [...SEED],
  nextId: SEED.length + 1,
});

function normalizeLoaded(parsed: VocabState): { state: VocabState; mutated: boolean } {
  if (!Array.isArray(parsed?.vocab) || typeof parsed?.nextId !== "number") {
    return { state: seedState(), mutated: false };
  }
  const t = isoNow();
  let mutated = false;
  const vocab = parsed.vocab.map((w) => {
    const hadUuid = typeof w.clientUuid === "string" && w.clientUuid.length > 0;
    const hadUpdated = typeof w.updatedAt === "string" && w.updatedAt.length > 0;
    if (!hadUuid || !hadUpdated) mutated = true;
    const clientUuid = hadUuid ? w.clientUuid! : randomUuid();
    const updatedAt = hadUpdated ? w.updatedAt! : t;
    const rawExIt = (w as { exIt?: unknown; ex_it?: unknown }).exIt ?? (w as { ex_it?: unknown }).ex_it;
    const rawExCz = (w as { exCz?: unknown; ex_cz?: unknown }).exCz ?? (w as { ex_cz?: unknown }).ex_cz;
    const exIt = typeof rawExIt === "string" ? rawExIt.trim() : "";
    const exCz = typeof rawExCz === "string" ? rawExCz.trim() : "";
    return {
      id: w.id,
      clientUuid,
      it: w.it,
      cz: w.cz,
      p: typeof w.p === "string" ? w.p : "",
      ...(exIt ? { exIt } : {}),
      ...(exCz ? { exCz } : {}),
      learned: !!w.learned,
      streak: typeof w.streak === "number" ? w.streak : 0,
      updatedAt,
    } satisfies VocabWord;
  });
  const maxId = vocab.reduce((m, w) => Math.max(m, w.id), 0);
  const nextId = Math.max(parsed.nextId, maxId + 1);
  return { state: { vocab, nextId }, mutated };
}

/**
 * One-shot migration: existing installs may have seed words (`ciao`, `grazie`)
 * marked as already learned from the original SEED. We now want every seed word
 * to start at `0/3` so the user actually trains them. Runs once per device.
 */
async function maybeResetSeedStreaks(state: VocabState): Promise<VocabState> {
  try {
    const done = await AsyncStorage.getItem(SEED_RESET_FLAG_KEY);
    if (done === "1") return state;
    let touched = false;
    const vocab = state.vocab.map((w) => {
      if (!w.clientUuid?.startsWith(SEED_UUID_PREFIX)) return w;
      if (w.streak === 0 && !w.learned) return w;
      touched = true;
      return { ...w, streak: 0, learned: false };
    });
    const next = touched ? { ...state, vocab } : state;
    if (touched) await saveVocabState(next);
    await AsyncStorage.setItem(SEED_RESET_FLAG_KEY, "1");
    return next;
  } catch {
    return state;
  }
}

export async function loadVocabState(): Promise<VocabState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Fresh install: seed already has streak 0 / learned false; mark migration
      // as done so we don't run it later on top of real user progress.
      await AsyncStorage.setItem(SEED_RESET_FLAG_KEY, "1");
      return seedState();
    }
    const parsed = JSON.parse(raw) as VocabState;
    const { state, mutated } = normalizeLoaded(parsed);
    if (mutated) await saveVocabState(state);
    return await maybeResetSeedStreaks(state);
  } catch {
    return seedState();
  }
}

export async function saveVocabState(state: VocabState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore storage failures; the next save will retry.
  }
}
