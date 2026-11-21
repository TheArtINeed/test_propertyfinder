/**
 * Sanity checks (spec section 13): plausible values for a JVC home.
 * Each check returns an error message, or undefined when the value is fine.
 */
import { AS_OF } from "./types";

export const LIMITS = {
  rent: [10_000, 2_000_000],
  price: [100_000, 50_000_000],
  loan: [0, 50_000_000],
  leaseEndYears: 5,
  startYears: 2,
  ask: [0, 100],
  rate: [0, 20],
} as const;

const fmt = (n: number) => n.toLocaleString("en-US");
/** Accepts "85,000" and "85 000". NaN for anything else. */
export const toNumber = (s: string | number) => (typeof s === "number" ? s : s.trim() === "" ? NaN : Number(s.replace(/[, ]/g, "")));
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function addYears(iso: string, years: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function checkRent(v: string | number): string | undefined {
  const n = toNumber(v);
  const [lo, hi] = LIMITS.rent;
  if (!(n >= lo && n <= hi)) return `Enter a yearly rent between AED ${fmt(lo)} and ${fmt(hi)}`;
}

export function checkPrice(v: string | number): string | undefined {
  const n = toNumber(v);
  const [lo, hi] = LIMITS.price;
  if (!(n >= lo && n <= hi)) return `Enter a price between AED ${fmt(lo)} and ${fmt(hi)}`;
}

/** Optional loan: empty is fine. */
export function checkLoan(v: string | number, pricePaid?: string | number | null): string | undefined {
  if (typeof v === "string" && v.trim() === "") return;
  const n = toNumber(v);
  const [lo, hi] = LIMITS.loan;
  if (!(n >= lo && n <= hi)) return `Enter a loan between AED 0 and ${fmt(hi)}`;
  const paid = pricePaid == null ? NaN : toNumber(pricePaid);
  if (Number.isFinite(paid) && n > paid) return "The loan can't be more than the price paid";
}

export function checkLeaseEnd(v: string, today = AS_OF): string | undefined {
  if (!isoDate.test(v)) return "Pick the lease end date";
  if (v < today) return "The lease end is in the past: enter the current lease";
  if (v > addYears(today, LIMITS.leaseEndYears)) return `Pick a date within ${LIMITS.leaseEndYears} years`;
}

/** Rent out from / available from. */
export function checkStartDate(v: string, today = AS_OF): string | undefined {
  if (!isoDate.test(v)) return "Pick a date";
  if (v < today || v > addYears(today, LIMITS.startYears)) return `Pick a date from today to ${LIMITS.startYears} years ahead`;
}

export function checkPercent(v: string | number, [lo, hi]: readonly [number, number], label: string): string | undefined {
  if (typeof v === "string" && v.trim() === "") return;
  const n = toNumber(v);
  if (!(n >= lo && n <= hi)) return `Enter ${label} from ${lo} to ${hi}%`;
}

const CODE = /^[A-Za-z0-9-]+$/;
export function checkUnitNumber(v: string): string | undefined {
  const s = v.trim();
  if (!s) return "Enter your unit number";
  if (s.length > 12 || !CODE.test(s)) return "Use up to 12 letters, digits and dashes";
}

/** Optional title deed. */
export function checkTitleDeed(v: string): string | undefined {
  const s = v.trim();
  if (!s) return;
  if (s.length < 3 || s.length > 30 || !CODE.test(s)) return "Use 3 to 30 letters, digits and dashes";
}

/** For deep links: keep a URL number only if it is in range, else treat it as missing. */
export function inRange(n: number | null, [lo, hi]: readonly [number, number]): number | null {
  return n != null && n >= lo && n <= hi ? n : null;
}

/** H1: end of the fixed-rate period: optional; from today to 10 years ahead. */
export function checkFixedRateEnd(v: string, today = AS_OF): string | undefined {
  if (v === "") return;
  if (!isoDate.test(v)) return "Pick a date";
  if (v < today || v > addYears(today, 10)) return "Pick a date from today to 10 years ahead";
}
