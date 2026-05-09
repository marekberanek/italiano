import Constants from "expo-constants";

import type { LookupResult } from "@/assets/data/types";

type Extra = {
  translateEndpoint?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const ENDPOINT = process.env.EXPO_PUBLIC_TRANSLATE_ENDPOINT ?? extra.translateEndpoint ?? "";

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
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "TranslateError";
  }
}

export async function lookupWord(query: string): Promise<LookupResult> {
  const trimmed = query.trim();
  if (!trimmed) throw new TranslateError("Empty query.");

  if (!ENDPOINT) {
    return fallback(trimmed);
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: trimmed }),
    });
  } catch (err) {
    throw new TranslateError("Network error.", err);
  }

  if (!response.ok) {
    throw new TranslateError(`Server returned ${response.status}.`);
  }

  let data: LookupResult;
  try {
    data = (await response.json()) as LookupResult;
  } catch (err) {
    throw new TranslateError("Invalid response.", err);
  }

  if (!data?.it || !data?.cz) {
    throw new TranslateError("Missing translation fields.");
  }

  return data;
}
