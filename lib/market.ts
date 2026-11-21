/** Resale market: filters, building search, comparables, estimate, outlook. Pure functions. */
import { ACTIVE_BUILDINGS, DIGEST_MONTH, MIN_BUILDING_RESALES, SIZE_BAND, type SaleRow } from "./types";
import { addMonths, median, quantile } from "./stats";

const RESIDENTIAL_SALE = new Set(["Flat", "Villa"]);

/** Owner-to-owner resales only: ready units, procedure "Sale". Excludes Delayed Sell and lease-to-own. */
export function isResale(row: SaleRow): boolean {
  return row.off_plan === false && row.procedure === "Sale";
}

export function residentialResales(rows: SaleRow[]): SaleRow[] {
  return collapseBulkDeals(rows.filter((r) => isResale(r) && RESIDENTIAL_SALE.has(r.sub_type ?? "") && r.size_sqm > 0));
}

/**
 * W7: resales on the same day, in the same project, at the same price and size are one bulk deal
 * (e.g. three identical units at AED 1,319,425 on 29 Oct). They count as one comp; bulkCount keeps N.
 */
export function collapseBulkDeals(rows: SaleRow[]): SaleRow[] {
  const seen = new Map<string, SaleRow>();
  const out: SaleRow[] = [];
  for (const r of rows) {
    const key = `${r.date}|${r.project ?? ""}|${r.value_aed}|${r.size_sqm}`;
    const first = seen.get(key);
    if (first) {
      first.bulkCount = (first.bulkCount ?? 1) + 1;
      continue;
    }
    const copy = { ...r };
    seen.set(key, copy);
    out.push(copy);
  }
  return out;
}

export const pricePerSqm = (r: SaleRow) => r.value_aed / r.size_sqm;
export const monthOf = (isoDate: string) => isoDate.slice(0, 7);

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface Building {
  name: string;
  slug: string;
  resales: number;
  active: boolean; // open in the pilot; others are "coming soon"
}

/** Buildings with at least MIN_BUILDING_RESALES resales: active (pilot) first, then most traded. */
export function listBuildings(resales: SaleRow[], active: readonly string[] = ACTIVE_BUILDINGS): Building[] {
  const counts = new Map<string, number>();
  for (const r of resales) if (r.project) counts.set(r.project, (counts.get(r.project) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, n]) => n >= MIN_BUILDING_RESALES)
    .map(([name, n]) => ({ name, slug: slugify(name), resales: n, active: active.includes(name) }))
    .sort((a, b) => Number(b.active) - Number(a.active) || b.resales - a.resales || a.name.localeCompare(b.name));
}

/** Partial, case-insensitive match on any word order; names starting with the query rank first. */
export function searchBuildings(buildings: Building[], query: string, limit = 8): Building[] {
  const q = query.trim().toLowerCase();
  if (!q) return buildings.slice(0, limit);
  const terms = q.split(/\s+/);
  const hits = buildings.filter((b) => terms.every((t) => b.name.toLowerCase().includes(t)));
  const starts = (b: Building) => (b.name.toLowerCase().startsWith(q) ? 0 : 1);
  return hits.sort((a, b) => Number(b.active) - Number(a.active) || starts(a) - starts(b)).slice(0, limit);
}

export function findBuilding(buildings: Building[], slug: string): Building | undefined {
  return buildings.find((b) => b.slug === slug);
}

/** The building for /rent and /buy: the requested one if active, else the first active one. */
export function activeOrDefault(buildings: Building[], slug: string | null): Building {
  const b = slug ? findBuilding(buildings, slug) : undefined;
  return b?.active ? b : buildings.find((x) => x.active)!;
}

export interface Unit {
  building: string;
  rooms: number; // 0 = studio
  sizeSqm: number;
}

export type CompLevel = "building_rooms" | "building_any" | "jvc_rooms";
export type Confidence = "high" | "medium" | "low";

export interface Comps {
  level: CompLevel;
  rows: SaleRow[];
  window: [string, string]; // months, inclusive
}

/** Minimum comps to stay at a level of the fallback chain. */
export const MIN_COMPS = 5;

/** Months [M-2, M]: the rolling 3-month window ending at M. */
export function window3(month: string): [string, string] {
  return [addMonths(month, -2), month];
}

const inWindow = (r: SaleRow, [from, to]: [string, string]) => {
  const m = monthOf(r.date);
  return m >= from && m <= to;
};

const inSizeBand = (size: number, target: number) =>
  size >= target * (1 - SIZE_BAND) && size <= target * (1 + SIZE_BAND);

/**
 * Comparable resales in the rolling 3 months ending at `month`.
 * Chain: same building + rooms + size +-15% -> same building any rooms (AED/sqm) -> JVC same rooms + size.
 */
export function findComps(resales: SaleRow[], unit: Unit, month = DIGEST_MONTH): Comps {
  const win = window3(month);
  const recent = resales.filter((r) => inWindow(r, win));
  const sameBuilding = recent.filter((r) => r.project === unit.building);
  const levels: [CompLevel, SaleRow[]][] = [
    ["building_rooms", sameBuilding.filter((r) => r.rooms === unit.rooms && inSizeBand(r.size_sqm, unit.sizeSqm))],
    ["building_any", sameBuilding],
    ["jvc_rooms", recent.filter((r) => r.rooms === unit.rooms && inSizeBand(r.size_sqm, unit.sizeSqm))],
  ];
  for (const [level, rows] of levels) if (rows.length >= MIN_COMPS) return { level, rows, window: win };
  const [level, rows] = levels[2];
  return { level, rows, window: win };
}

export function confidenceOf(comps: Comps): Confidence {
  if (comps.level !== "building_rooms" || comps.rows.length < MIN_COMPS) return "low";
  return comps.rows.length >= 10 ? "high" : "medium";
}

export interface Estimate {
  low: number; // min(P25, mid -4%)
  mid: number; // median
  high: number; // max(P75, mid +4%)
  perSqm: number;
  comps: Comps;
  confidence: Confidence;
}

/**
 * Minimum half-width of the range around the estimate. With skewed comps the median can sit on P75
 * (e.g. 1.29M in 1.21M-1.295M), which reads as an error and puts ordinary deals "above the range".
 */
export const MIN_RANGE = 0.04;

/** Median AED/sqm of comps x unit size; range P25-P75, widened to at least +-4% around the estimate. Null when there are no comps at all. */
export function estimateValue(resales: SaleRow[], unit: Unit, month = DIGEST_MONTH): Estimate | null {
  const comps = findComps(resales, unit, month);
  if (comps.rows.length === 0) return null;
  const psm = comps.rows.map(pricePerSqm);
  const mid = median(psm) * unit.sizeSqm;
  return {
    low: Math.min(quantile(psm, 0.25) * unit.sizeSqm, mid * (1 - MIN_RANGE)),
    mid,
    high: Math.max(quantile(psm, 0.75) * unit.sizeSqm, mid * (1 + MIN_RANGE)),
    perSqm: median(psm),
    comps,
    confidence: confidenceOf(comps),
  };
}

/** Median AED/sqm of all JVC flat resales in the 3 months ending at `month`. */
export function jvcMedianPerSqm(resales: SaleRow[], month: string): number {
  const win = window3(month);
  return median(resales.filter((r) => r.sub_type === "Flat" && inWindow(r, win)).map(pricePerSqm));
}

export interface Outlook {
  trend: number; // annualised, e.g. 0.08
  low: number;
  high: number;
  from: [string, string];
  to: [string, string];
}

export const OUTLOOK_FLOOR = -0.2;
export const OUTLOOK_CAP = 0.15;
export const clampOutlook = (x: number) => Math.min(OUTLOOK_CAP, Math.max(OUTLOOK_FLOOR, x));

/** Annualise a change between two windows whose centres are `months` apart. */
export function annualise(ratio: number, months: number): number {
  return Math.pow(ratio, 12 / months) - 1;
}

/**
 * 12-month outlook from the JVC trend: Jan-Mar vs the last 3 full months, annualised.
 * Range = trend +-5 pp, lower bound a further -5 pp for 2026-27 supply risk, clamped to [-20%, +15%].
 */
/**
 * W5: same windows as the momentum reading: previous 3 months vs last 3 months (May-Jul vs Aug-Oct),
 * annualised. A Jan-Mar base sat on a high January and pinned the range to the lower clamp.
 */
export function outlook(resales: SaleRow[], month = DIGEST_MONTH): Outlook {
  const last = window3(month);
  const first = window3(addMonths(month, -3));
  const startPsm = jvcMedianPerSqm(resales, first[1]);
  const endPsm = jvcMedianPerSqm(resales, last[1]);
  const centreGap = monthsBetween(first[0], last[0]);
  const trend = annualise(endPsm / startPsm, centreGap);
  return outlookRange(trend, first, last);
}

export function outlookRange(trend: number, from: [string, string], to: [string, string]): Outlook {
  return {
    trend: clampOutlook(trend),
    low: clampOutlook(trend - 0.05 - 0.05),
    high: clampOutlook(trend + 0.05),
    from,
    to,
  };
}

function monthsBetween(a: string, b: string): number {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

/** Resales in one building during one month, newest first. */
export function buildingDealsInMonth(resales: SaleRow[], building: string, month: string): SaleRow[] {
  return resales
    .filter((r) => r.project === building && monthOf(r.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Room types present in a building's resales (for the unit picker). */
export function roomTypes(resales: SaleRow[], building: string): { rooms: number; count: number; medianSize: number }[] {
  const by = new Map<number, number[]>();
  for (const r of resales) {
    if (r.project !== building || r.rooms == null) continue;
    by.set(r.rooms, [...(by.get(r.rooms) ?? []), r.size_sqm]);
  }
  return [...by.entries()]
    .map(([rooms, sizes]) => ({ rooms, count: sizes.length, medianSize: median(sizes) }))
    .sort((a, b) => a.rooms - b.rooms);
}
