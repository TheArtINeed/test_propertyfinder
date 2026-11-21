/** Owner-side state: saved homes, status history, intent, leads. Works on any Storage (localStorage in the app). */
import type { OwnerDetails } from "./digest";

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
}

export type ContactMethod = "call" | "whatsapp" | "email";

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
  verification: Home["verification"];
  consent: true;
  createdAt: string;
}

export const LEAD_FIELDS = [
  "id", "homeId", "building", "unitNumber", "rooms", "sizeSqm", "intent", "askingPrice",
  "estimate", "availableFrom", "contact", "verification", "consent", "createdAt",
] as const;

export interface LeadDraft {
  intent?: Lead["intent"] | null;
  askingPrice?: number | null;
  availableFrom?: string | null;
  contact?: ContactMethod | null;
  consent?: boolean;
}

/** Returns a list of problems; empty means the lead can be sent. */
export function validateLead(d: LeadDraft): string[] {
  const errors: string[] = [];
  if (!d.intent) errors.push("Choose rent out or sell");
  if (!d.contact) errors.push("Choose how the agent contacts you");
  if (!d.askingPrice || d.askingPrice <= 0) errors.push("Enter a price");
  if (!d.availableFrom) errors.push("Pick a date");
  if (!d.consent) errors.push("Agree to be contacted via PF");
  return errors;
}

export function buildLead(home: Home, d: Required<LeadDraft>, estimate: Lead["estimate"], now: string): Lead {
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
    verification: home.verification,
    consent: true,
    createdAt: now,
  };
}

export const homeId = (slug: string, unitNumber: string) => `${slug}#${unitNumber.trim().toUpperCase()}`;

/** Storage keys: everything the owner leaves lives under this prefix (O9 delete). */
export const PREFIX = "pf.";
const HOMES = PREFIX + "homes";
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
    pricePaid: num("paid"),
    loan: num("loan"),
    annualRent: num("rent"),
    leaseEnd: /^\d{4}-\d{2}-\d{2}$/.test(one("leaseEnd") ?? "") ? one("leaseEnd")! : null,
    occupancy: one("occ") === "let" ? ("let" as const) : one("occ") === "live" ? ("live" as const) : undefined,
    from: one("from") ?? null,
  };
}
