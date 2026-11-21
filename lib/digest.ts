/** Monthly "My Home" digest for month M. Pure function over the snapshot rows. */
import { AS_OF, DIGEST_MONTH, type RentRow, type SaleRow } from "./types";
import { addMonths, daysBetween } from "./stats";
import { buildingDealsInMonth, estimateValue, jvcMedianPerSqm, type Estimate, type Unit } from "./market";
import { filterRents, grossYield, inBand, rentStats, type RentStats } from "./rent";
import { capital, mockDemand, type Capital, type Demand } from "./finance";
import { median } from "./stats";

export type Occupancy = "let" | "live";

export interface OwnerDetails {
  occupancy?: Occupancy;
  annualRent?: number | null;
  leaseEnd?: string | null;
  pricePaid?: number | null;
  loan?: number | null;
}

export type NextStepKind = "relet" | "renewal_risk" | "open_to_offers" | "keep";

export interface NextStep {
  kind: NextStepKind;
  title: string;
  illustrative: boolean;
}

export interface Digest {
  month: string;
  rent: {
    stats: RentStats;
    ownerRent: number | null;
    ownerGap: number | null;
    daysToLeaseEnd: number | null;
  };
  deals: { all: SaleRow[]; likeYours: SaleRow[]; rollingPerSqm: number | null };
  demand: Demand;
  capital: Capital & { low: number; high: number; changeVs3m: number | null };
  /** unit: on the owner's rent if let, else on market rent; market: on the median new-lease rent in the building. */
  yield: { unit: number | null; market: number | null; jvcMedian: number };
  nextStep: NextStep;
  order: ("rent" | "deals" | "demand" | "capital")[];
}

/** Thresholds of the next-step rules. */
export const RELET_DAYS = 90;
export const RENEWAL_RISK_GAP = 0.1;

export function nextStep(input: {
  daysToLeaseEnd: number | null;
  ownerGap: number | null;
  demandHigh: boolean;
  unitYield: number | null;
  jvcYield: number;
}): NextStep {
  // F1: an ended lease beats everything: the unit may be empty.
  if (input.daysToLeaseEnd != null && input.daysToLeaseEnd < 0)
    return { kind: "relet", title: "Your lease has ended: re-let now", illustrative: false };
  if (input.daysToLeaseEnd != null && input.daysToLeaseEnd <= RELET_DAYS)
    return input.ownerGap != null && input.ownerGap > RENEWAL_RISK_GAP
      ? { kind: "relet", title: "Lease ends soon and your rent is above new leases: plan the re-let at market rent", illustrative: false }
      : { kind: "relet", title: "Lease ends soon: set your re-let plan", illustrative: false };
  if (input.ownerGap != null && input.ownerGap > RENEWAL_RISK_GAP)
    return { kind: "renewal_risk", title: "Your rent is above new leases: consider a discount at renewal", illustrative: false };
  if (input.demandHigh && input.unitYield != null && input.unitYield < input.jvcYield)
    return { kind: "open_to_offers", title: "Demand is high and your yield is below JVC: open to offers?", illustrative: true };
  return { kind: "keep", title: "Nothing urgent this month. Tell us your plans when they change", illustrative: false };
}

/**
 * Warning for an owner whose rent is more than RENEWAL_RISK_GAP above new leases: the tenant can move
 * for less, so the rent is at risk at renewal. Null when the rent is close to the market.
 */
export function renewalRiskNote(ownerRent: number | null, marketMedian: number, leaseCount: number): string | null {
  if (ownerRent == null || leaseCount === 0 || marketMedian <= 0) return null;
  const gap = (ownerRent - marketMedian) / marketMedian; // same formula as the digest ownerGap
  if (gap <= RENEWAL_RISK_GAP) return null;
  const diff = Math.round((ownerRent - marketMedian) / 1000);
  return `New tenants pay about AED ${diff}K a year less for units like yours. At renewal your tenant may ask for a lower rent or move out: plan for a re-let near AED ${Math.round(marketMedian / 1000)}K.`;
}

/** JVC median gross yield for flats: median new-lease rent per sqm / median resale price per sqm. */
export function jvcYield(resales: SaleRow[], rents: RentRow[], month: string): number {
  const from = addMonths(month, -2);
  const rentPsm = median(
    rents
      .filter((r) => r.sub_type === "Flat" && r.version === "New" && r.registered.slice(0, 7) >= from && r.registered.slice(0, 7) <= month)
      .map((r) => r.annual_aed / r.size_sqm),
  );
  return rentPsm / jvcMedianPerSqm(resales, month);
}

export function buildDigest(
  resales: SaleRow[],
  rents: RentRow[],
  unit: Unit,
  details: OwnerDetails = {},
  month = DIGEST_MONTH,
  today = AS_OF,
): Digest | null {
  const est: Estimate | null = estimateValue(resales, unit, month);
  if (!est) return null;
  // W6: no month-on-month change (monthly noise); compare with the estimate 3 months earlier.
  const prev = estimateValue(resales, unit, addMonths(month, -3));

  // 1. Rent: new leases in the building for the size band in M.
  const monthRents = filterRents(rents, { building: unit.building, sizeSqm: unit.sizeSqm, from: month, to: month, version: "New" });
  const stats = rentStats(monthRents);
  const ownerRent = details.occupancy === "let" && details.annualRent ? details.annualRent : null;
  const ownerGap = ownerRent != null && stats.count > 0 ? (ownerRent - stats.median) / stats.median : null;
  const daysToLeaseEnd = details.occupancy === "let" && details.leaseEnd ? daysBetween(today, details.leaseEnd) : null;

  // 2. Deals in the building in M.
  const all = buildingDealsInMonth(resales, unit.building, month);
  const likeYours = all.filter((r) => r.rooms === unit.rooms);

  // 3. Demand (mocked).
  const demand = mockDemand(unit.rooms, est.mid, month);

  // 4. Capital.
  const cap = capital(est.mid, { pricePaid: details.pricePaid, loan: details.loan });

  // Yield on the building's rent level for the size band (all of 2026, new leases).
  const buildingNew = rents.filter((r) => r.project === unit.building && r.version === "New" && inBand(r, unit.sizeSqm));
  const marketYield = buildingNew.length ? grossYield(rentStats(buildingNew).median, est.mid) : null;
  const unitYield = ownerRent != null ? grossYield(ownerRent, est.mid) : marketYield;
  const jvc = jvcYield(resales, rents, month);

  const order: Digest["order"] =
    details.occupancy === "live" ? ["capital", "rent", "deals", "demand"] : ["rent", "deals", "demand", "capital"];

  return {
    month,
    rent: { stats, ownerRent, ownerGap, daysToLeaseEnd },
    deals: { all, likeYours, rollingPerSqm: est.perSqm },
    demand,
    capital: { ...cap, low: est.low, high: est.high, changeVs3m: prev ? est.mid / prev.mid - 1 : null },
    yield: { unit: unitYield, market: marketYield, jvcMedian: jvc },
    nextStep: nextStep({ daysToLeaseEnd, ownerGap, demandHigh: demand.level === "high", unitYield, jvcYield: jvc }),
    order,
  };
}

/**
 * V12: the digest as a 3-line WhatsApp message, built from the same numbers as the screen.
 * Plain text, no numbers of its own.
 */
export function digestMessage(d: Digest, building: string, unitNumber: string, url: string): string[] {
  const k = (n: number) => (n >= 1_000_000 ? `AED ${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M` : `AED ${Math.round(n / 1000)}K`);
  const month = new Date(d.month + "-01T00:00:00Z").toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const rent = d.rent.stats.count
    ? `${d.rent.stats.count} new leases like yours, median ${k(d.rent.stats.median)}`
    : "no new leases like yours this month";
  return [
    `${building} ${unitNumber}, ${month}: worth ${k(Math.round(d.capital.low / 5000) * 5000)}–${k(Math.round(d.capital.high / 5000) * 5000)}.`,
    `${d.deals.all.length} resales in the building; ${rent}.`,
    `Next step: ${d.nextStep.title}. ${url}`,
  ];
}
