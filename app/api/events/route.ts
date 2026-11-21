import { parseEvent, record, recentEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const event = parseEvent(body);
  if (typeof event === "string") return Response.json({ ok: false, error: event }, { status: 400 });
  record(event);
  console.log("[event]", JSON.stringify(event));
  return Response.json({ ok: true });
}

/** Last events of this server instance (in-memory, resets on redeploy). */
export async function GET() {
  return Response.json({ events: recentEvents().slice(-100) });
}
