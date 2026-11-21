/** Spec section 24 (v17): what the first screen shows a first-time user. Numbers come from the same functions as the valuation and digest. */
import { buildDigest } from "./digest";
import { DEMO } from "./demo";
import { DIGEST_MONTH, HERO_BUILDING, type RentRow, type SaleRow } from "./types";

export interface Proof {
  building: string;
  month: string;
  rooms: number;
  low: number;
  high: number;
  /** Median of new leases for the size band in the building in the month; null when there were none. */
  rentMedian: number | null;
  /** All resales in the building in the month. */
  resales: number;
}

/** F10b: live proof card for the demo 1BR in the pilot building, digest month. */
export function firstScreenProof(resales: SaleRow[], rents: RentRow[]): Proof | null {
  const unit = { building: HERO_BUILDING, rooms: DEMO.rooms, sizeSqm: DEMO.sizeSqm };
  const d = buildDigest(resales, rents, unit, {}, DIGEST_MONTH);
  if (!d) return null;
  return {
    building: HERO_BUILDING,
    month: DIGEST_MONTH,
    rooms: DEMO.rooms,
    low: d.capital.low,
    high: d.capital.high,
    rentMedian: d.rent.stats.count ? d.rent.stats.median : null,
    resales: d.deals.all.length,
  };
}

export type BenefitIcon = "chart" | "key" | "phone" | "passport";

/** F10c: what you get after the first estimate. One line each; the last one is the Golden Visa threshold (G1 is built). */
export const BENEFITS: { icon: BenefitIcon; text: string }[] = [
  { icon: "chart", text: "Your value every month, from registered deals" },
  { icon: "key", text: "Rent it right: what new tenants pay, and a reminder 90 days before the lease ends" },
  { icon: "phone", text: "Agents only when you ask: no cold calls" },
  { icon: "passport", text: "How far you are from the AED 2M Golden Visa threshold" },
];

/** F10d */
export const TRUST_LINE = "Free · no sign-up to see the value · Dubai Land Department deals";
