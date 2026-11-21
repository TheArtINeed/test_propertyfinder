/** Client-side event tracking: localStorage log + POST /api/events. Never throws. */
import type { EventName } from "./events";

const KEY = "pf.events";

export function track(name: EventName, props: Record<string, string | number | boolean | null> = {}): void {
  if (typeof window === "undefined") return;
  const event = { name, at: new Date().toISOString(), props };
  try {
    const log = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    log.push(event);
    localStorage.setItem(KEY, JSON.stringify(log.slice(-500)));
  } catch {
    /* storage blocked: keep going */
  }
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* offline */
  }
}
