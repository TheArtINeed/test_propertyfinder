import Anthropic from "@anthropic-ai/sdk";

export const ANTHROPIC_MODEL = "claude-opus-5-5";
export const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";

export type Env = Record<string, string | undefined>;
export type Provider = "anthropic" | "openai";

export interface ConfigStatus {
  anthropic: boolean;
  openai: boolean;
}

export interface LiveStatus {
  provider: Provider;
  ok: boolean;
  error?: string;
}

/** Reports which provider keys are configured. Never returns key values. */
export function configStatus(env: Env): ConfigStatus {
  return {
    anthropic: Boolean(env.ANTHROPIC_API_KEY?.trim()),
    openai: Boolean(env.OPENAI_API_KEY?.trim()),
  };
}

/** Picks the provider to check: Anthropic if its key is set, else OpenAI, else none. */
export function pickProvider(status: ConfigStatus): Provider | null {
  if (status.anthropic) return "anthropic";
  if (status.openai) return "openai";
  return null;
}

/**
 * Proves the Anthropic key works by retrieving model metadata.
 * Uses no tokens, so the public endpoint costs nothing if it is hit repeatedly.
 */
export async function checkAnthropic(client: Pick<Anthropic, "models">): Promise<LiveStatus> {
  try {
    await client.models.retrieve(ANTHROPIC_MODEL);
    return { provider: "anthropic", ok: true };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { provider: "anthropic", ok: false, error: "invalid_api_key" };
    }
    if (err instanceof Anthropic.APIError) {
      return { provider: "anthropic", ok: false, error: `http_${err.status ?? "unknown"}` };
    }
    return { provider: "anthropic", ok: false, error: "network_error" };
  }
}

/** Proves the OpenAI key works by listing models. Uses no tokens. */
export async function checkOpenAI(apiKey: string, fetchFn: typeof fetch = fetch): Promise<LiveStatus> {
  try {
    const res = await fetchFn(OPENAI_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return { provider: "openai", ok: true };
    if (res.status === 401) return { provider: "openai", ok: false, error: "invalid_api_key" };
    return { provider: "openai", ok: false, error: `http_${res.status}` };
  } catch {
    return { provider: "openai", ok: false, error: "network_error" };
  }
}
