import Constants from "expo-constants";
import { Platform } from "react-native";

import type { LookupResult } from "@/assets/data/types";
import { getAccessToken } from "@/lib/auth/supabase";
import { italianToCzechPron } from "@/lib/pronunciation/italian-pron";

type Extra = {
  translateEndpoint?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const rawEndpoint = process.env.EXPO_PUBLIC_TRANSLATE_ENDPOINT ?? extra.translateEndpoint ?? "";
const ENDPOINT = typeof rawEndpoint === "string" ? rawEndpoint.trim() : "";

const isLikelyCzech = (text: string) =>
  /[áčďéěíňóřšťúůýž]/i.test(text) || /[a-z]+(at|ovat|out|et|it|nout)$/i.test(text);

const fallback = async (query: string): Promise<LookupResult> => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const isCz = isLikelyCzech(query);
  return isCz
    ? { it: `${query} (italsky)`, cz: query, p: "" }
    : { it: query, cz: `${query} (česky)`, p: "" };
};

export class TranslateError extends Error {
  /**
   * `true` when the failure is due to missing/expired authentication. UI uses
   * this to render a "sign in to use search" prompt instead of a generic error.
   */
  public readonly requiresAuth: boolean;
  /**
   * `true` when DeepL produced a translation but its back-translation diverged
   * from the user's input — almost always a diacritic-less Czech query that
   * matches multiple lemmas (`pracka` → `pračka` vs `prácka`). UI uses this to
   * render a "DeepL si není jistý — zkus diakritiku" hint instead of the
   * generic red error box.
   */
  public readonly ambiguous: boolean;
  /**
   * Optional human-readable hint surfacing DeepL's best guess so the user can
   * confirm or reject it. Provided only with `ambiguous: true`.
   */
  public readonly hint: string | undefined;
  constructor(
    message: string,
    options?: { cause?: unknown; requiresAuth?: boolean; ambiguous?: boolean; hint?: string },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "TranslateError";
    this.requiresAuth = options?.requiresAuth ?? false;
    this.ambiguous = options?.ambiguous ?? false;
    this.hint = options?.hint;
  }
}

export async function lookupWord(query: string): Promise<LookupResult> {
  const trimmed = query.trim();
  if (!trimmed) throw new TranslateError("Zadej prosím slovo.");

  if (!ENDPOINT) {
    return fallback(trimmed);
  }

  // Real device cannot reach a dev server bound to the machine loopback.
  const loopback = /127\.0\.0\.1|localhost/i.test(ENDPOINT);
  if (loopback && Constants.isDevice) {
    throw new TranslateError(
      "Překlad ukazuje na počítač (127.0.0.1) — z telefonu se tam nedostaneš. V .env nastav HTTPS z Vercelu nebo IP Macu v Wi‑Fi (viz README), pak `npx expo start -c`.",
    );
  }
  // Android emulator: host loopback is 10.0.2.2, not 127.0.0.1.
  if (Platform.OS === "android" && /127\.0\.0\.1/.test(ENDPOINT)) {
    throw new TranslateError(
      "Na Androidu emulátor nevidí 127.0.0.1 na tvém počítači. V .env použij http://10.0.2.2:3000/api/translate a znovu spusť Metro.",
    );
  }

  // Backend requires a Supabase Bearer token — DeepL costs money per call so
  // anonymous traffic would blow our quota. Bail out early with a friendly,
  // typed error so the UI can show a "sign in to use search" prompt instead
  // of waiting on a 401.
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new TranslateError(
      "Vyhledávání slovíček vyžaduje přihlášení. Přihlas se v záložce Profil.",
      { requiresAuth: true },
    );
  }

  // Hard timeout so a wrong endpoint (e.g. stale LAN IP) cannot leave the UI
  // spinning forever; user gets a real error instead.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
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
    throw new TranslateError(
      aborted
        ? "Vypršel čas (10 s). Zkontroluj, že backend běží a že EXPO_PUBLIC_TRANSLATE_ENDPOINT sedí (LAN IP / Vercel)."
        : "Síťová chyba — backend nejspíš neběží nebo je špatná adresa v .env.",
      { cause: err },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // 401 means the token expired between our `getAccessToken()` call and the
    // server's verification (rare but possible) — surface it as an auth error
    // so the UI can prompt for re-login instead of showing a generic 4xx.
    if (response.status === 401) {
      throw new TranslateError(
        "Přihlášení vypršelo. Přihlas se znovu v záložce Profil.",
        { requiresAuth: true },
      );
    }
    // 422 = backend detected an ambiguous diacritic-less query (e.g. `pracka`
    // could be `pračka` or `prácka`). Body has `ambiguous: true` and a `hint`
    // mentioning DeepL's best guess so the user can decide whether to retry
    // with diacritics.
    if (response.status === 422) {
      let body: { error?: string; ambiguous?: boolean; hint?: string } = {};
      try {
        body = (await response.json()) as typeof body;
      } catch {
        /* ignore parse errors */
      }
      if (body.ambiguous) {
        throw new TranslateError(
          body.error ?? "DeepL si nebyl jistý — zkus zadat slovo s českou diakritikou.",
          { ambiguous: true, hint: body.hint },
        );
      }
    }
    let detail = "";
    try {
      const t = await response.text();
      if (t && t.length < 200) detail = ` (${t})`;
    } catch {
      /* ignore */
    }
    throw new TranslateError(
      response.status === 503 || response.status === 500
        ? `Server vrátil ${response.status}. Na Vercelu zkontroluj DEEPL_API_KEY a deploy backendu.${detail}`
        : `Server vrátil ${response.status}.${detail}`,
    );
  }

  let data: LookupResult;
  try {
    data = (await response.json()) as LookupResult;
  } catch (err) {
    throw new TranslateError("Neplatná odpověď serveru (není JSON).", { cause: err });
  }

  if (!data?.it || !data?.cz) {
    throw new TranslateError("Odpověď serveru neobsahuje překlad.");
  }

  // DeepL doesn't provide phonetic transcription. Fall back to a rule-based
  // Italian → Czech pronunciation generator so the user always sees one.
  const p = data.p?.trim() ? data.p : italianToCzechPron(data.it);
  return { ...data, p };
}
