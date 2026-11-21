import { describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import {
  ANTHROPIC_MODEL,
  OPENAI_MODELS_URL,
  checkAnthropic,
  checkOpenAI,
  configStatus,
  pickProvider,
} from "@/lib/health";

describe("configStatus", () => {
  it("reports configured keys without exposing values", () => {
    const status = configStatus({ ANTHROPIC_API_KEY: "sk-ant-secret", OPENAI_API_KEY: "" });
    expect(status).toEqual({ anthropic: true, openai: false });
    expect(JSON.stringify(status)).not.toContain("secret");
  });

  it("treats whitespace-only keys as missing", () => {
    expect(configStatus({ ANTHROPIC_API_KEY: "  " })).toEqual({ anthropic: false, openai: false });
  });
});

describe("pickProvider", () => {
  it("prefers Anthropic, falls back to OpenAI, else null", () => {
    expect(pickProvider({ anthropic: true, openai: true })).toBe("anthropic");
    expect(pickProvider({ anthropic: false, openai: true })).toBe("openai");
    expect(pickProvider({ anthropic: false, openai: false })).toBeNull();
  });
});

function fakeAnthropic(retrieve: (...args: unknown[]) => Promise<unknown>) {
  return { models: { retrieve } } as unknown as Pick<Anthropic, "models">;
}

describe("checkAnthropic", () => {
  it("returns ok when the model is retrievable", async () => {
    const retrieve = vi.fn().mockResolvedValue({ id: ANTHROPIC_MODEL });
    expect(await checkAnthropic(fakeAnthropic(retrieve))).toEqual({ provider: "anthropic", ok: true });
    expect(retrieve).toHaveBeenCalledWith(ANTHROPIC_MODEL);
  });

  it("maps an invalid key to invalid_api_key", async () => {
    const err = new Anthropic.AuthenticationError(401, undefined, "bad key", new Headers());
    const result = await checkAnthropic(fakeAnthropic(vi.fn().mockRejectedValue(err)));
    expect(result).toEqual({ provider: "anthropic", ok: false, error: "invalid_api_key" });
  });

  it("maps unknown failures to network_error", async () => {
    const result = await checkAnthropic(fakeAnthropic(vi.fn().mockRejectedValue(new Error("boom"))));
    expect(result.error).toBe("network_error");
  });
});

describe("checkOpenAI", () => {
  it("sends the key as a bearer token and returns ok on 200", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await checkOpenAI("sk-test", fetchFn)).toEqual({ provider: "openai", ok: true });
    expect(fetchFn).toHaveBeenCalledWith(OPENAI_MODELS_URL, {
      headers: { Authorization: "Bearer sk-test" },
    });
  });

  it("maps 401 to invalid_api_key and other statuses to http_<code>", async () => {
    const unauthorized = vi.fn().mockResolvedValue(new Response("", { status: 401 }));
    expect((await checkOpenAI("k", unauthorized)).error).toBe("invalid_api_key");
    const quota = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    expect((await checkOpenAI("k", quota)).error).toBe("http_429");
  });

  it("maps a thrown fetch to network_error", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("offline"));
    expect((await checkOpenAI("k", fetchFn)).error).toBe("network_error");
  });
});
