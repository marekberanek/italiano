/**
 * Minimal Anthropic Messages API client for the translate-meanings endpoint.
 * Uses `fetch` directly to avoid pulling the official SDK (extra weight, extra
 * cold-start time on Vercel Edge). Keep the surface tiny — we only need
 * single-shot non-streaming requests with a JSON-shaped reply.
 */

const API_URL = "https://api.anthropic.com/v1/messages";

/**
 * `claude-haiku-4-5` is the cheapest, fastest current Anthropic model with
 * solid Czech / Italian handling — adequate for short dictionary-style
 * disambiguation. Override via env when a new generation ships.
 */
const DEFAULT_MODEL = "claude-haiku-4-5";

const API_VERSION = "2023-06-01";

export class AnthropicError extends Error {
  public readonly status: number | undefined;
  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AnthropicError";
    this.status = options?.status;
  }
}

export type AnthropicCallOptions = {
  /** System prompt — sets persona / output contract. */
  system?: string;
  /** Hard cap on output tokens. Keep small to bound cost. */
  maxTokens?: number;
  /** 0 = deterministic; for dictionary lookups we want low (≈0.2). */
  temperature?: number;
};

type AnthropicResponse = {
  content: { type: string; text?: string }[];
};

/**
 * Calls Anthropic Messages API and returns the text body of the first content
 * block. Throws `AnthropicError` for missing key, network failure, or non-2xx
 * responses — callers wrap that in their own typed error for the HTTP layer.
 */
export async function callClaude(userPrompt: string, options: AnthropicCallOptions = {}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnthropicError("ANTHROPIC_API_KEY is not configured.");
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  // Hard timeout so a slow upstream never leaves the mobile UI spinning.
  // Claude Haiku for a 200-token reply usually returns under 2 s.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 600,
        temperature: options.temperature ?? 0.2,
        ...(options.system ? { system: options.system } : {}),
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = (err as { name?: string } | null)?.name === "AbortError";
    throw new AnthropicError(
      aborted ? "Anthropic request timed out." : "Network error reaching Anthropic.",
      { cause: err },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const t = await res.text();
      if (t && t.length < 300) detail = ` (${t})`;
    } catch {
      /* ignore */
    }
    throw new AnthropicError(`Anthropic ${res.status}${detail}`, { status: res.status });
  }

  let data: AnthropicResponse;
  try {
    data = (await res.json()) as AnthropicResponse;
  } catch (err) {
    throw new AnthropicError("Anthropic returned non-JSON body.", { cause: err });
  }

  const text = data.content.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new AnthropicError("Anthropic response has no text content.");
  return text;
}
