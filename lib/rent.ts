/** Rents (Ejari): size-band stats, Rent watch, RERA allowed increase, yield. Pure functions. */
import { SIZE_BAND, type RentRow } from "./types";
import { mean, median, percentileOf, quantile } from "./stats";
import { monthOf, window3 } from "./market";

const RESIDENTIAL_RENT = new Set(["Flat", "Studio", "Villa"]);

export function residentialRents(rows: RentRow[]): RentRow[] {
  return rows.filter((r) => RESIDENTIAL_RENT.has(r.sub_type ?? "") && r.size_sqm > 0 && r.annual_aed > 0);
}

export const inBand = (r: RentRow, sizeSqm: number) =>
  r.size_sqm >= sizeSqm * (1 - SIZE_BAND) && r.size_sqm <= sizeSqm * (1 + SIZE_BAND);

export interface RentStats {
  count: number;
  median: number;
  low: number; // P25
  high: number; // P75
  mean: number;
}

export function rentStats(rows: RentRow[]): RentStats {
  const v = rows.map((r) => r.annual_aed);
  return { count: v.length, median: median(v), low: quantile(v, 0.25), high: quantile(v, 0.75), mean: mean(v) };
}

export interface RentFilter {
  building?: string | null;
  sizeSqm: number;
  from?: string; // month, inclusive
  to?: string;
  version?: "New" | "Renewed";
}

export function filterRents(rows: RentRow[], f: RentFilter): RentRow[] {
  return rows.filter((r) => {
    if (f.building && r.project !== f.building) return false;
    if (!inBand(r, f.sizeSqm)) return false;
    const m = monthOf(r.registered);
    if (f.from && m < f.from) return false;
    if (f.to && m > f.to) return false;
    if (f.version && r.version !== f.version) return false;
    return true;
  });
}

/** Fewer contracts than this in the building -> compare with JVC by size. */
export const MIN_BUILDING_CONTRACTS = 10;

export type Verdict = "below" | "around" | "above";
/** Within +-5% of the median counts as "around market". */
export const AROUND_MARKET = 0.05;

export function verdictOf(gap: number): Verdict {
  if (gap < -AROUND_MARKET) return "below";
  if (gap > AROUND_MARKET) return "above";
  return "around";
}

export interface RentWatch {
  level: "building" | "jvc";
  stats: RentStats;
  gap: number; // (my rent - median) / median
  percentile: number;
  verdict: Verdict;
  window: [string, string];
}

/** My rent vs new leases for my size band in the last 3 months (building, else JVC). */
export function rentWatch(
  rows: RentRow[],
  input: { building?: string | null; sizeSqm: number; annualRent: number },
  month: string,
): RentWatch | null {
  const win = window3(month);
  const base = { sizeSqm: input.sizeSqm, from: win[0], to: win[1], version: "New" as const };
  let level: RentWatch["level"] = "jvc";
  let picked = filterRents(rows, base);
  if (input.building) {
    const inBuilding = filterRents(rows, { ...base, building: input.building });
    if (inBuilding.length >= MIN_BUILDING_CONTRACTS) {
      level = "building";
      picked = inBuilding;
    }
  }
  if (picked.length === 0) return null;
  const stats = rentStats(picked);
  const gap = (input.annualRent - stats.median) / stats.median;
  return {
    level,
    stats,
    gap,
    percentile: percentileOf(picked.map((r) => r.annual_aed), input.annualRent),
    verdict: verdictOf(gap),
    window: win,
  };
}

/**
 * RERA index proxy: typical rent of ALL JVC contracts (new + renewed) for the size band.
 * The official index reflects the whole market, not only new leases.
 * Uses the median, not the mean: Ejari has outliers (AED 50 to AED 9M a year for ~80 sqm)
 * that move the mean from ~70K to ~158K.
 */
export function reraIndexProxy(rows: RentRow[], sizeSqm: number): RentStats & { index: number } {
  const stats = rentStats(filterRents(rows, { sizeSqm }));
  return { ...stats, index: stats.median };
}

/**
 * Max allowed increase (Decree 43 of 2013) by how far the current rent is below the index.
 * <=10%: 0; 11-20%: 5%; 21-30%: 10%; 31-40%: 15%; >40%: 20%.
 */
export function reraMaxIncrease(currentRent: number, indexRent: number): number {
  const below = ((indexRent - currentRent) / indexRent) * 100;
  if (below <= 10) return 0;
  if (below <= 20) return 0.05;
  if (below <= 30) return 0.1;
  if (below <= 40) return 0.15;
  return 0.2;
}

export interface RenewalCheck {
  indexRent: number;
  belowIndex: number; // share, e.g. 0.18
  maxIncrease: number;
  askedIncrease: number | null;
  allowed: boolean | null;
  maxNewRent: number;
  noticeDeadline: string | null; // 90 days before lease end
  daysToNotice: number | null;
}

export const NOTICE_DAYS = 90;

export function renewalCheck(
  currentRent: number,
  indexRent: number,
  opts: { askedIncrease?: number | null; leaseEnd?: string | null; today: string },
): RenewalCheck {
  const maxIncrease = reraMaxIncrease(currentRent, indexRent);
  const asked = opts.askedIncrease ?? null;
  let noticeDeadline: string | null = null;
  let daysToNotice: number | null = null;
  if (opts.leaseEnd) {
    const d = new Date(opts.leaseEnd + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - NOTICE_DAYS);
    noticeDeadline = d.toISOString().slice(0, 10);
    daysToNotice = Math.round((d.getTime() - Date.parse(opts.today + "T00:00:00Z")) / 86_400_000);
  }
  return {
    indexRent,
    belowIndex: (indexRent - currentRent) / indexRent,
    maxIncrease,
    askedIncrease: asked,
    allowed: asked == null ? null : asked <= maxIncrease + 1e-9,
    maxNewRent: currentRent * (1 + maxIncrease),
    noticeDeadline,
    daysToNotice,
  };
}

export const grossYield = (annualRent: number, value: number) => annualRent / value;
