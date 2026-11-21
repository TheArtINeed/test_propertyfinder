/** Renter side (spec section 14): match owner-confirmed units to the lease end, reminders, viewing request. */
import type { OwnerConfirmed } from "./data";
import { checkStartDate } from "./sanity";
import { daysBetween } from "./stats";

/** V14: a unit is a match when it frees up within +-30 days of the renter's lease end. */
export const MATCH_WINDOW_DAYS = 30;

export interface Matched extends OwnerConfirmed {
  matched: boolean;
  daysFromLeaseEnd: number | null;
}

/** Matches first (closest date first), then the rest by availability date. */
export function matchOwnerConfirmed(units: OwnerConfirmed[], leaseEnd: string | null, window = MATCH_WINDOW_DAYS): Matched[] {
  return units
    .map((u) => {
      const diff = leaseEnd ? daysBetween(leaseEnd, u.availableFrom) : null;
      return { ...u, daysFromLeaseEnd: diff, matched: diff != null && Math.abs(diff) <= window };
    })
    .sort((a, b) =>
      a.matched !== b.matched
        ? Number(b.matched) - Number(a.matched)
        : a.matched
          ? Math.abs(a.daysFromLeaseEnd!) - Math.abs(b.daysFromLeaseEnd!)
          : a.availableFrom.localeCompare(b.availableFrom),
    );
}

/** V13: reminder dates before renewal (90 = notice deadline, 30 = last call). */
export const REMINDER_DAYS = [90, 30] as const;
export function reminderDates(leaseEnd: string, today: string): { daysBefore: number; date: string; past: boolean }[] {
  return REMINDER_DAYS.map((n) => {
    const d = new Date(leaseEnd + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - n);
    const date = d.toISOString().slice(0, 10);
    return { daysBefore: n, date, past: date < today };
  });
}

export type ContactChannel = "whatsapp" | "call" | "email";

/** V15 / V17 contact sheets: channel, optional date, consent. */
export function validateContact(input: { channel: ContactChannel | null; date?: string | null; needsDate?: boolean; consent: boolean }) {
  const e: Partial<Record<"channel" | "date" | "consent", string>> = {};
  if (!input.channel) e.channel = "Choose how to be contacted";
  if (input.needsDate) {
    const m = input.date ? checkStartDate(input.date) : "Pick a date";
    if (m) e.date = m;
  }
  if (!input.consent) e.consent = "Agree to be contacted via PF";
  return e;
}

/** Days left before the 90-day notice deadline that count as urgent on the renter screen. */
export const NOTICE_URGENT_DAYS = 30;

/**
 * Urgency of the 90-day notice deadline: "urgent" when 0-30 days are left, "passed" when it is gone,
 * null when there is time or no lease end.
 */
export function noticeUrgency(daysToNotice: number | null): "urgent" | "passed" | null {
  if (daysToNotice == null) return null;
  if (daysToNotice < 0) return "passed";
  return daysToNotice <= NOTICE_URGENT_DAYS ? "urgent" : null;
}

/**
 * H2 (spec v15): taken units. When the owner of an owner-confirmed unit changes plans, the renter's card follows:
 * let -> "Let agreed · date"; not now / for sale -> "No longer for rent". No viewing request on a taken unit.
 */
export type OwnerListingStatus = "rent_out" | "let" | "not_now" | "for_sale";
export type ListingState = { kind: "available" } | { kind: "let_agreed"; date: string } | { kind: "withdrawn" };

export function listingState(owner: { status: OwnerListingStatus; at?: string } | undefined): ListingState {
  if (!owner || owner.status === "rent_out") return { kind: "available" };
  if (owner.status === "let") return { kind: "let_agreed", date: owner.at ?? "" };
  return { kind: "withdrawn" };
}

/** Demo data: owners who changed plans after confirming (synthetic listings). */
export const DEMO_OWNER_STATUS: Record<string, { status: OwnerListingStatus; at: string }> = {
  "SYN-0020": { status: "let", at: "2026-11-18" },
  "SYN-0080": { status: "not_now", at: "2026-11-19" },
};

/** Viewing requests the renter sent, kept on the device. */
export const VIEWINGS_KEY = "pf.viewings";

/** Requested units that are no longer available. */
export function takenRequests(requested: string[], states: Record<string, ListingState>): string[] {
  return requested.filter((id) => states[id] && states[id].kind !== "available");
}

/** Available units first (matches to the lease end first), taken ones last. */
export function withStates<T extends { id: string; matched?: boolean }>(units: T[], owners: Record<string, { status: OwnerListingStatus; at?: string }>) {
  const out = units.map((u) => ({ ...u, state: listingState(owners[u.id]) }));
  return [...out.filter((u) => u.state.kind === "available"), ...out.filter((u) => u.state.kind !== "available")];
}
