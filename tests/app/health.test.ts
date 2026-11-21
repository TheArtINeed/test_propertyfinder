import { describe, expect, it, vi } from "vitest";
import { OPENAI_MODELS_URL, checkOpenAI, configStatus } from "@/lib/health";

describe("configStatus", () => {
  it("reports the configured key without exposing its value", () => {
    const status = configStatus({ OPENAI_API_KEY: "sk-secret" });
    expect(status).toEqual({ openai: true });
    expect(JSON.stringify(status)).not.toContain("secret");
  });

  it("treats missing or whitespace-only keys as not configured", () => {
    expect(configStatus({})).toEqual({ openai: false });
    expect(configStatus({ OPENAI_API_KEY: "  " })).toEqual({ openai: false });
  });
});

describe("checkOpenAI", () => {
  it("sends the key as a bearer token and returns ok on 200", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await checkOpenAI("sk-test", fetchFn)).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledWith(OPENAI_MODELS_URL, {
      headers: { Authorization: "Bearer sk-test" },
    });
  });

  it("maps 401 to invalid_api_key and other statuses to http_<code>", async () => {
    const unauthorized = vi.fn().mockResolvedValue(new Response("", { status: 401 }));
    expect(await checkOpenAI("k", unauthorized)).toEqual({ ok: false, error: "invalid_api_key" });
    const quota = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    expect(await checkOpenAI("k", quota)).toEqual({ ok: false, error: "http_429" });
  });

  it("maps a thrown fetch to network_error", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("offline"));
    expect(await checkOpenAI("k", fetchFn)).toEqual({ ok: false, error: "network_error" });
  });
});
