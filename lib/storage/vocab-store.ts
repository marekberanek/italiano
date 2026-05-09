import AsyncStorage from "@react-native-async-storage/async-storage";

import type { VocabState, VocabWord } from "@/assets/data/types";
import { randomUuid } from "@/lib/uuid";

const STORAGE_KEY = "italiano.vocab.v1";

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
    learned: true,
    streak: 3,
    updatedAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: 3,
    clientUuid: "a1000000-0000-4000-8000-000000000003",
    it: "arrivederci",
    cz: "na shledanou",
    p: "[arrivedérči]",
    learned: false,
    streak: 1,
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
    learned: true,
    streak: 3,
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
    return {
      id: w.id,
      clientUuid,
      it: w.it,
      cz: w.cz,
      p: typeof w.p === "string" ? w.p : "",
      learned: !!w.learned,
      streak: typeof w.streak === "number" ? w.streak : 0,
      updatedAt,
    } satisfies VocabWord;
  });
  const maxId = vocab.reduce((m, w) => Math.max(m, w.id), 0);
  const nextId = Math.max(parsed.nextId, maxId + 1);
  return { state: { vocab, nextId }, mutated };
}

export async function loadVocabState(): Promise<VocabState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as VocabState;
    const { state, mutated } = normalizeLoaded(parsed);
    if (mutated) await saveVocabState(state);
    return state;
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
