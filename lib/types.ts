/** Row shapes of the DLD snapshot (dataset/dld_jvc_*.json) and shared constants. */

export interface SaleRow {
  id: string;
  date: string; // YYYY-MM-DD
  procedure: string;
  off_plan: boolean;
  project: string | null;
  sub_type: string | null;
  rooms: number | null; // 0 = studio
  size_sqm: number;
  value_aed: number;
  /** W7: units in a same-day bulk deal (same date, project, price, size) collapsed into this row. */
  bulkCount?: number;
}

export interface RentRow {
  registered: string; // YYYY-MM-DD
  start: string;
  end: string;
  version: "New" | "Renewed" | string;
  project: string | null;
  sub_type: string | null;
  size_sqm: number;
  annual_aed: number;
}

/** Last full month in the snapshot (data ends 20 Nov 2026). */
export const DIGEST_MONTH = "2026-10";
/** Fixed "today" of the prototype, so countdowns and tests are deterministic. */
export const AS_OF = "2026-11-21";
export const HERO_BUILDING = "Luma Park Views";
export const FALLBACK_BUILDING = "Binghatti Apex";
/** Buildings open in the pilot. Others are listed as "coming soon". */
export const ACTIVE_BUILDINGS: readonly string[] = [HERO_BUILDING];
/** Size band for comparable units: +-15%. */
export const SIZE_BAND = 0.15;
/** Buildings with fewer resales are not offered in search. */
export const MIN_BUILDING_RESALES = 10;
export const SQFT_PER_SQM = 10.7639;
export const DLD_FEE = 0.04;

export const SOURCES = {
  dld: "DLD registered resales, 2026",
  ejari: "Ejari contracts, 2026",
  estimate: "PropWorth estimate",
  illustrative: "Illustrative: based on PF searches in production",
  owner: "Owner's value",
  rera: "RERA index proxy (Ejari, all contracts)",
  example: "Example rate",
} as const;
