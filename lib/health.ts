export const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";

export type Env = Record<string, string | undefined>;

export interface ConfigStatus {
  openai: boolean;
}

export interface LiveStatus {
  ok: boolean;
  error?: string;
}

/** Reports whether the OpenAI key is configured. Never returns the key value. */
export function configStatus(env: Env): ConfigStatus {
  return { openai: Boolean(env.OPENAI_API_KEY?.trim()) };
}

/** Proves the OpenAI key works by listing models. Uses no tokens. */
export async function checkOpenAI(apiKey: string, fetchFn: typeof fetch = fetch): Promise<LiveStatus> {
  try {
    const res = await fetchFn(OPENAI_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: "invalid_api_key" };
    return { ok: false, error: `http_${res.status}` };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
