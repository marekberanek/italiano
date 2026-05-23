import Constants from "expo-constants";

import type { WordMeaning } from "@/assets/data/types";
import { getAccessToken } from "@/lib/auth/supabase";

/**
 * Calls `POST /api/translate-meanings` to fetch a list of disambiguated senses
 * for an ambiguous word (e.g. `sušička`). Reuses the same endpoint-resolution
 * + auth pattern as `lookupWord` so a single Supabase JWT covers both calls.
 */

type Extra = {
  translateEndpoint?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const rawEndpoint = process.env.EXPO_PUBLIC_TRANSLATE_ENDPOINT ?? extra.translateEndpoint ?? "";
const TRANSLATE_ENDPOINT = typeof rawEndpoint === "string" ? rawEndpoint.trim() : "";

/**
 * Derives the meanings endpoint from `EXPO_PUBLIC_TRANSLATE_ENDPOINT` so the
 * mobile app only needs to configure one URL. Swaps the trailing path segment
 * `translate` → `translate-meanings` and keeps everything else intact.
 */
function resolveMeaningsEndpoint(): string {
  if (!TRANSLATE_ENDPOINT) return "";
  return TRANSLATE_ENDPOINT.replace(/\/translate(?:\/?$)/, "/translate-meanings");
}

const MEANINGS_ENDPOINT = resolveMeaningsEndpoint();

export class MeaningsError extends Error {
  /** `true` when the backend has no `ANTHROPIC_API_KEY` (503). UI hides the trigger. */
  public readonly disabled: boolean;
  /** `true` when the session has expired between getAccessToken and the request. */
  public readonly requiresAuth: boolean;
  constructor(
    message: string,
    options?: { cause?: unknown; disabled?: boolean; requiresAuth?: boolean },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "MeaningsError";
    this.disabled = options?.disabled ?? false;
    this.requiresAuth = options?.requiresAuth ?? false;
  }
}

export async function fetchMeanings(query: string): Promise<WordMeaning[]> {
  const trimmed = query.trim();
  if (!trimmed) throw new MeaningsError("Zadej prosím slovo.");

  if (!MEANINGS_ENDPOINT) {
    // No translate endpoint configured at all → the user is on the local
    // fallback path; meanings feature can't work without a backend.
    throw new MeaningsError("Backend není nastaven (EXPO_PUBLIC_TRANSLATE_ENDPOINT).", {
      disabled: true,
    });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new MeaningsError("Vyhledávání významů vyžaduje přihlášení.", { requiresAuth: true });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  let response: Response;
  try {
    response = await fetch(MEANINGS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: trimmed }),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = (err as { name?: string } | null)?.name === "AbortError";
    throw new MeaningsError(
      aborted ? "Vypršel čas požadavku (20 s)." : "Síťová chyba při dotazu na další významy.",
      { cause: err },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    throw new MeaningsError("Přihlášení vypršelo. Přihlas se znovu v záložce Profil.", {
      requiresAuth: true,
    });
  }
  // 503 = feature intentionally disabled (no ANTHROPIC_API_KEY on server).
  // Mark `disabled` so UI can stop showing the button after first try.
  if (response.status === 503) {
    throw new MeaningsError("Další významy nejsou dostupné — funkce není na serveru zapnutá.", {
      disabled: true,
    });
  }
  if (!response.ok) {
    let detail = "";
    try {
      const t = await response.text();
      if (t && t.length < 200) detail = ` (${t})`;
    } catch {
      /* ignore */
    }
    throw new MeaningsError(`Server vrátil ${response.status}.${detail}`);
  }

  let data: { meanings?: WordMeaning[] };
  try {
    data = (await response.json()) as typeof data;
  } catch (err) {
    throw new MeaningsError("Neplatná odpověď serveru (není JSON).", { cause: err });
  }

  if (!data?.meanings || !Array.isArray(data.meanings) || data.meanings.length === 0) {
    throw new MeaningsError("Server nevrátil žádné významy.");
  }
  return data.meanings;
}
