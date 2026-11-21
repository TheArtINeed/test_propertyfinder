/** Owner-side state: saved homes, status history, intent, leads. Works on any Storage (localStorage in the app). */
import type { OwnerDetails } from "./digest";
import { checkPrice, checkRent, checkStartDate, inRange, LIMITS } from "./sanity";
import { AS_OF } from "./types";

export type Status = "let" | "live" | "for_sale" | "not_available";
export const STATUS_LABEL: Record<Status, string> = {
  let: "I let it",
  live: "I live in it",
  for_sale: "For sale",
  not_available: "Not available",
};

export type IntentKind = "not_now" | "rent_out" | "open_to_offers";
export interface Intent {
  kind: IntentKind;
  date?: string | null; // rent out from
  price?: number | null; // rent (rent_out) or price (open_to_offers)
  setAt: string;
}

export interface Home extends OwnerDetails {
  id: string; // building slug + unit number
  building: string;
  slug: string;
  unitNumber: string;
  rooms: number;
  sizeSqm: number;
  claimedAt: string;
  titleDeed?: string | null;
  verification: "none" | "pending";
  status?: Status;
  statusHistory: { status: Status; at: string }[];
  intent?: Intent;
  subscription?: Subscription;
}

/** V11: how the monthly update reaches the owner (mocked delivery). */
export type Channel = "whatsapp" | "email" | "in_app";
export type Frequency = "monthly" | "big_changes";
export interface Subscription {
  /** V11 amended: any combination, at least one. */
  channels: Channel[];
  /** Older saves had a single channel; read through `channelsOf`. */
  channel?: Channel;
  frequency: Frequency;
  since: string;
}
export const CHANNEL_LABEL: Record<Channel, string> = { whatsapp: "WhatsApp", email: "Email", in_app: "In-app" };
const CHANNEL_ORDER = Object.keys(CHANNEL_LABEL) as Channel[];

/** Channels of a subscription, including older single-channel saves. */
export function channelsOf(sub: Pick<Subscription, "channels" | "channel"> | undefined | null): Channel[] {
  if (!sub) return [];
  if (sub.channels?.length) return sub.channels;
  return sub.channel ? [sub.channel] : [];
}

/** Adds or removes one channel; the last one cannot be removed. Keeps a fixed order. */
/** Multi-select chips: add or remove one option, keep the fixed order; the last one can't be removed. */
export function toggleIn<T>(list: readonly T[], c: T, order: readonly T[]): T[] {
  if (list.includes(c)) return list.length > 1 ? list.filter((x) => x !== c) : [...list];
  return order.filter((x) => x === c || list.includes(x));
}

export function toggleChannel(list: Channel[], c: Channel): Channel[] {
  return toggleIn(list, c, CHANNEL_ORDER);
}

export const channelsLabel = (list: Channel[]) => list.map((c) => CHANNEL_LABEL[c]).join(" + ");
/** A3: events first; the monthly update is the fallback. */
export const FREQUENCY_LABEL: Record<Frequency, string> = { monthly: "Monthly update + important events", big_changes: "Only important events" };

/** Next digest: the 1st of the month after today. */
export function nextUpdateDate(today = AS_OF): string {
  const [y, m] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

/** V16: request status after sending (mocked agent): Sent, then Accepted 2 hours later; Viewing is the next step. */
export type LeadStatus = "sent" | "accepted";
export const ACCEPT_AFTER_MS = 2 * 60 * 60 * 1000;
export function leadStatus(createdAt: string, now: string): LeadStatus {
  return Date.parse(now) - Date.parse(createdAt) >= ACCEPT_AFTER_MS ? "accepted" : "sent";
}

export type ContactMethod = "call" | "whatsapp" | "email";
export const CONTACT_LABEL: Record<ContactMethod, string> = { whatsapp: "WhatsApp", call: "Call", email: "Email" };
export const CONTACT_ORDER = Object.keys(CONTACT_LABEL) as ContactMethod[];
/** "WhatsApp, call or email". */
export function contactsLabel(list: readonly ContactMethod[]): string {
  const w = list.map((c, i) => (i === 0 ? CONTACT_LABEL[c] : c === "whatsapp" ? "WhatsApp" : c));
  return w.length < 2 ? (w[0] ?? "") : `${w.slice(0, -1).join(", ")} or ${w[w.length - 1]}`;
}

export interface Lead {
  id: string;
  homeId: string;
  building: string;
  unitNumber: string;
  rooms: number;
  sizeSqm: number;
  intent: "rent_out" | "sell";
  askingPrice: number;
  estimate: { low: number; mid: number; high: number };
  availableFrom: string;
  contact: ContactMethod;
  contacts: ContactMethod[];
  verification: Home["verification"];
  consent: true;
  createdAt: string;
}

export const LEAD_FIELDS = [
  "id", "homeId", "building", "unitNumber", "rooms", "sizeSqm", "intent", "askingPrice",
  "estimate", "availableFrom", "contact", "contacts", "verification", "consent", "createdAt",
] as const;

export interface LeadDraft {
  intent?: Lead["intent"] | null;
  askingPrice?: number | null;
  availableFrom?: string | null;
  contact?: ContactMethod | null;
  contacts?: ContactMethod[];
  consent?: boolean;
}

/** Returns a list of problems; empty means the lead can be sent. */
export function validateLead(d: LeadDraft): string[] {
  return Object.values(leadFieldErrors(d)) as string[];
}

/** Lead errors by field (shown under each field). Sanity ranges from spec section 13. */
export function leadFieldErrors(d: LeadDraft): Partial<Record<"intent" | "price" | "date" | "contact" | "consent", string>> {
  const e: Partial<Record<"intent" | "price" | "date" | "contact" | "consent", string>> = {};
  if (!d.intent) e.intent = "Choose rent out or sell";
  if (!d.askingPrice || d.askingPrice <= 0) e.price = "Enter a price";
  else if (d.intent) {
    const m = d.intent === "sell" ? checkPrice(d.askingPrice) : checkRent(d.askingPrice);
    if (m) e.price = m;
  }
  if (!d.availableFrom) e.date = "Pick a date";
  else {
    const m = checkStartDate(d.availableFrom);
    if (m) e.date = m;
  }
  if (!d.contact) e.contact = "Choose how the agent contacts you";
  if (!d.consent) e.consent = "Agree to be contacted via PF";
  return e;
}

/** Plans card (O6): rent out needs a date and a rent; offers need a price. */
export function validateIntent(i: { kind: IntentKind; date: string; price: string }): Partial<Record<"date" | "price", string>> {
  const e: Partial<Record<"date" | "price", string>> = {};
  if (i.kind === "rent_out") {
    const d = i.date ? checkStartDate(i.date) : "Pick a date";
    if (d) e.date = d;
    const p = i.price.trim() === "" ? "Enter the rent" : checkRent(i.price);
    if (p) e.price = p;
  }
  if (i.kind === "open_to_offers") {
    const p = i.price.trim() === "" ? "Enter a price" : checkPrice(i.price);
    if (p) e.price = p;
  }
  return e;
}

export function buildLead(home: Home, d: Required<Omit<LeadDraft, "contacts">> & Pick<LeadDraft, "contacts">, estimate: Lead["estimate"], now: string): Lead {
  if (validateLead(d).length) throw new Error("invalid lead");
  return {
    id: `lead-${home.id}-${now}`,
    homeId: home.id,
    building: home.building,
    unitNumber: home.unitNumber,
    rooms: home.rooms,
    sizeSqm: home.sizeSqm,
    intent: d.intent!,
    askingPrice: d.askingPrice!,
    estimate,
    availableFrom: d.availableFrom!,
    contact: d.contact!,
    contacts: d.contacts?.length ? d.contacts : [d.contact!],
    verification: home.verification,
    consent: true,
    createdAt: now,
  };
}

export const homeId = (slug: string, unitNumber: string) => `${slug}#${unitNumber.trim().toUpperCase()}`;

/** Storage keys: everything the owner leaves lives under this prefix (O9 delete). */
export const PREFIX = "pf.";
const HOMES = PREFIX + "homes";
/** localStorage key of the saved homes list. */
export const HOMES_KEY = HOMES;
const LEADS = PREFIX + "leads";

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

function read<T>(s: KV, key: string, fallback: T): T {
  try {
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getHomes(s: KV): Home[] {
  return read<Home[]>(s, HOMES, []);
}
export function getHome(s: KV, id: string): Home | undefined {
  return getHomes(s).find((h) => h.id === id);
}

export function saveHome(s: KV, home: Home): void {
  const homes = getHomes(s).filter((h) => h.id !== home.id);
  s.setItem(HOMES, JSON.stringify([...homes, home]));
}

export function updateHome(s: KV, id: string, patch: Partial<Home>): Home | undefined {
  const home = getHome(s, id);
  if (!home) return undefined;
  const next = { ...home, ...patch };
  saveHome(s, next);
  return next;
}

/** Changes status and appends to the history; "let" requires rent and lease end. */
export function setStatus(
  s: KV,
  id: string,
  status: Status,
  at: string,
  extra: { annualRent?: number | null; leaseEnd?: string | null } = {},
): Home {
  const home = getHome(s, id);
  if (!home) throw new Error("unknown home");
  if (status === "let" && (!extra.annualRent || !extra.leaseEnd)) throw new Error("rent and lease end required");
  const patch: Partial<Home> = {
    status,
    occupancy: status === "let" ? "let" : status === "live" ? "live" : home.occupancy,
    statusHistory: [...home.statusHistory, { status, at }],
  };
  if (status === "let") Object.assign(patch, { annualRent: extra.annualRent, leaseEnd: extra.leaseEnd });
  return updateHome(s, id, patch)!;
}

export function setIntent(s: KV, id: string, intent: Intent): Home | undefined {
  return updateHome(s, id, { intent });
}

export function getLeads(s: KV): Lead[] {
  return read<Lead[]>(s, LEADS, []);
}
export function addLead(s: KV, lead: Lead): void {
  s.setItem(LEADS, JSON.stringify([...getLeads(s), lead]));
}

export function removeHome(s: KV, id: string): void {
  s.setItem(HOMES, JSON.stringify(getHomes(s).filter((h) => h.id !== id)));
  s.setItem(LEADS, JSON.stringify(getLeads(s).filter((l) => l.homeId !== id)));
}

/** Deletes every key the prototype wrote. */
export function deleteAllData(s: KV): void {
  const keys: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => s.removeItem(k));
}

/** "I bought this" (B2): query string for the valuation step, prefilled from the buyer check. */
export function boughtThisQuery(p: { unit?: string; rooms: number; sizeSqm: number; pricePaid: number }): string {
  const q = new URLSearchParams({
    rooms: String(p.rooms),
    size: String(p.sizeSqm),
    paid: String(Math.round(p.pricePaid)),
    from: "buy",
  });
  if (p.unit) q.set("unit", p.unit);
  return q.toString();
}

/** Parses unit params from a URL query (deep links). Null when required fields are missing. */
export function parseUnitQuery(q: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (Array.isArray(q[k]) ? q[k]![0] : (q[k] as string | undefined));
  const rooms = Number(one("rooms"));
  const size = Number(one("size"));
  if (!Number.isInteger(rooms) || rooms < 0 || rooms > 7 || !(size > 10 && size < 2000)) return null;
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  return {
    unit: (one("unit") ?? "").slice(0, 12),
    rooms,
    sizeSqm: size,
    // Out-of-range deep-link values are ignored, as if not given (spec section 13).
    pricePaid: inRange(num("paid"), LIMITS.price),
    loan: inRange(num("loan"), [LIMITS.loan[0], Math.min(LIMITS.loan[1], inRange(num("paid"), LIMITS.price) ?? LIMITS.loan[1])]),
    annualRent: inRange(num("rent"), LIMITS.rent),
    leaseEnd: /^\d{4}-\d{2}-\d{2}$/.test(one("leaseEnd") ?? "") && one("leaseEnd")! >= AS_OF ? one("leaseEnd")! : null,
    // H1: mortgage rate in % (0-20) and the end of the fixed-rate period (not in the past)
    mortgageRate: (() => {
      const r = Number(one("rate"));
      return Number.isFinite(r) && r > 0 && r <= LIMITS.rate[1] ? r / 100 : null;
    })(),
    fixedRateEnd: /^\d{4}-\d{2}-\d{2}$/.test(one("fixedEnd") ?? "") && one("fixedEnd")! >= AS_OF ? one("fixedEnd")! : null,
    occupancy: one("occ") === "let" ? ("let" as const) : one("occ") === "live" ? ("live" as const) : undefined,
    from: one("from") ?? null,
  };
}

/** P10: sessionStorage key set right after saving a home, read once by My Home's banner. */
export const JUST_SAVED_KEY = "pf.justSaved";

/** P4: the demo unit number, or the next free one, so adding a home never overwrites a saved one. */
export function nextFreeUnit(homes: Pick<Home, "id">[], slug: string, start: string): string {
  const taken = new Set(homes.map((h) => h.id));
  let n = Number(start);
  if (!Number.isFinite(n)) return start;
  while (taken.has(homeId(slug, String(n)))) n++;
  return String(n);
}

/** P3: where "Add a home" leads. Only pilot apartments get a PropWorth estimate today. */
export type AddType = "apartment" | "villa" | "office";
export function addHomePath(type: AddType, where: "pilot" | "other"): { kind: "valuation"; href: string } | { kind: "coming_soon" } {
  return type === "apartment" && where === "pilot" ? { kind: "valuation", href: "/own/luma-park-views?from=propworth" } : { kind: "coming_soon" };
}

/** P10: after saving, go back to the portfolio when the user came from it, else to the new home. */
export function afterSavePath(from: string | null | undefined, id: string, homeHref: string): string {
  return from === "propworth" ? `/propworth?added=${encodeURIComponent(id)}` : homeHref;
}
