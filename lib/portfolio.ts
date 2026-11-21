/** W14: PropWorth summary across all saved homes. Pure function over the snapshot rows. */
import { buildDigest, type NextStep, type OwnerDetails } from "./digest";
import { findBuilding, listBuildings } from "./market";
import type { RentRow, SaleRow } from "./types";

export interface PortfolioHome extends OwnerDetails {
  id: string;
  slug: string;
  unitNumber: string;
  rooms: number;
  sizeSqm: number;
}

export interface PortfolioLine {
  id: string;
  building: string;
  unitNumber: string;
  low: number;
  mid: number;
  high: number;
  nextStep: NextStep;
  daysToLeaseEnd: number | null;
}

export interface Portfolio {
  count: number;
  low: number;
  mid: number;
  high: number;
  /** Sum of yearly rents of let homes; null when no home is let with a rent. */
  rentIn: number | null;
  /** Rent in / value of the let homes (weighted gross yield); null when no home is let. */
  yield: number | null;
  /** Most urgent next step across homes; null when nothing is urgent. */
  attention: PortfolioLine | null;
  lines: PortfolioLine[];
  /** Homes that could not be valued (unknown building, no comps). */
  skipped: string[];
}

/** Lower = more urgent. "keep" is never urgent. */
export function urgency(line: Pick<PortfolioLine, "nextStep" | "daysToLeaseEnd">): number | null {
  switch (line.nextStep.kind) {
    case "relet":
      return line.daysToLeaseEnd != null && line.daysToLeaseEnd < 0 ? 0 : 1;
    case "renewal_risk":
      return 2;
    case "open_to_offers":
      return 3;
    default:
      return null;
  }
}

export function portfolioSummary(resales: SaleRow[], rents: RentRow[], homes: PortfolioHome[]): Portfolio {
  const buildings = listBuildings(resales);
  const lines: PortfolioLine[] = [];
  const skipped: string[] = [];
  let rentIn = 0;
  let letValue = 0;
  let letCount = 0;
  for (const h of homes) {
    const b = findBuilding(buildings, h.slug);
    const d = b ? buildDigest(resales, rents, { building: b.name, rooms: h.rooms, sizeSqm: h.sizeSqm }, h) : null;
    if (!b || !d) {
      skipped.push(h.id);
      continue;
    }
    lines.push({
      id: h.id,
      building: b.name,
      unitNumber: h.unitNumber,
      low: d.capital.low,
      mid: d.capital.value,
      high: d.capital.high,
      nextStep: d.nextStep,
      daysToLeaseEnd: d.rent.daysToLeaseEnd,
    });
    if (h.occupancy === "let" && h.annualRent) {
      rentIn += h.annualRent;
      letValue += d.capital.value;
      letCount++;
    }
  }
  const sum = (k: "low" | "mid" | "high") => lines.reduce((s, l) => s + l[k], 0);
  const ranked = lines
    .map((l) => ({ l, u: urgency(l) }))
    .filter((x): x is { l: PortfolioLine; u: number } => x.u != null)
    .sort((a, b) => a.u - b.u || (a.l.daysToLeaseEnd ?? Infinity) - (b.l.daysToLeaseEnd ?? Infinity));
  return {
    count: lines.length,
    low: sum("low"),
    mid: sum("mid"),
    high: sum("high"),
    rentIn: letCount ? rentIn : null,
    yield: letCount ? rentIn / letValue : null,
    attention: ranked[0]?.l ?? null,
    lines,
    skipped,
  };
}

/** Validates the API body: up to 20 homes with a slug, rooms 0-3 and a plausible size. */
export function parsePortfolioHomes(body: unknown): PortfolioHome[] | string {
  const list = (body as { homes?: unknown })?.homes;
  if (!Array.isArray(list)) return "homes must be an array";
  if (list.length > 20) return "too many homes";
  const out: PortfolioHome[] = [];
  for (const x of list) {
    const h = x as Record<string, unknown>;
    if (typeof h?.id !== "string" || typeof h.slug !== "string") return "each home needs id and slug";
    const rooms = Number(h.rooms);
    const sizeSqm = Number(h.sizeSqm);
    if (!Number.isInteger(rooms) || rooms < 0 || rooms > 3) return "rooms must be 0-3";
    if (!(sizeSqm > 15 && sizeSqm < 1500)) return "size must be 15-1,500 m²";
    const num = (v: unknown) => (typeof v === "number" && v > 0 ? v : null);
    out.push({
      id: h.id,
      slug: h.slug,
      unitNumber: typeof h.unitNumber === "string" ? h.unitNumber : "",
      rooms,
      sizeSqm,
      occupancy: h.occupancy === "let" || h.occupancy === "live" ? h.occupancy : undefined,
      annualRent: num(h.annualRent),
      leaseEnd: typeof h.leaseEnd === "string" ? h.leaseEnd : null,
      pricePaid: num(h.pricePaid),
      loan: num(h.loan),
    });
  }
  return out;
}
