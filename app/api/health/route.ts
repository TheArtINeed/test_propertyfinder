import Anthropic from "@anthropic-ai/sdk";
import { checkAnthropic, checkOpenAI, configStatus, pickProvider } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configured = configStatus(process.env);
  const wantsLive = new URL(request.url).searchParams.get("live") === "1";
  if (!wantsLive) {
    return Response.json({ ok: true, configured });
  }

  const provider = pickProvider(configured);
  if (!provider) {
    return Response.json({ ok: false, configured, live: { ok: false, error: "missing_key" } }, { status: 503 });
  }
  const live =
    provider === "anthropic"
      ? await checkAnthropic(new Anthropic())
      : await checkOpenAI(process.env.OPENAI_API_KEY!.trim());
  return Response.json({ ok: live.ok, configured, live }, { status: live.ok ? 200 : 502 });
}
