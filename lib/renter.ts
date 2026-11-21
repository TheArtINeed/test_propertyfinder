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
