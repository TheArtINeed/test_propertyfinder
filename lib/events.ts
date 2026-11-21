/** Product events (spec section 6). Validated on the server; also kept in localStorage on the client. */

export const EVENT_NAMES = [
  "unit_claimed",
  "valuation_viewed",
  "get_monthly_clicked",
  "digest_opened",
  "session_started",
  "deal_list_opened",
  "owner_estimate_entered",
  "intent_set",
  "lead_submitted",
  "rent_checked",
  "break_calc_viewed",
  "owner_confirmed_viewed",
  "rent_vs_buy_viewed",
  "bought_this",
  "waitlist_joined",
  "entry_point_clicked",
  "feed_opened",
  "post_reacted",
  "insight_opened",
  "digest_subscribed",
  "renter_reminder_set",
  "renter_lead_submitted",
  "lead_status_viewed",
  "mortgage_lead_submitted",
  "buyer_lead_submitted",
  "news_opened",
  "portfolio_viewed",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface AppEvent {
  name: EventName;
  at: string;
  props?: Record<string, string | number | boolean | null>;
}

export function isEventName(x: unknown): x is EventName {
  return typeof x === "string" && (EVENT_NAMES as readonly string[]).includes(x);
}

/** Returns the clean event or an error string. Props must be flat primitives. */
export function parseEvent(body: unknown): AppEvent | string {
  if (!body || typeof body !== "object") return "body must be an object";
  const b = body as Record<string, unknown>;
  if (!isEventName(b.name)) return "unknown event";
  const props: AppEvent["props"] = {};
  if (b.props != null) {
    if (typeof b.props !== "object" || Array.isArray(b.props)) return "props must be an object";
    for (const [k, v] of Object.entries(b.props as Record<string, unknown>)) {
      if (v === null || ["string", "number", "boolean"].includes(typeof v)) props[k] = v as never;
      else return `prop ${k} must be a primitive`;
    }
  }
  return { name: b.name, at: typeof b.at === "string" ? b.at : new Date().toISOString(), props };
}

/** In-memory log for the prototype (resets on redeploy). */
const LOG: AppEvent[] = [];
export const MAX_LOG = 1000;

export function record(e: AppEvent): void {
  LOG.push(e);
  if (LOG.length > MAX_LOG) LOG.shift();
}
export const recentEvents = () => [...LOG];
