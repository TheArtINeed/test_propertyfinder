/**
 * "What do these numbers mean?" Plain-language reading of the estimate, rents and market,
 * each with a tone (good / watch / neutral) and one action. Pure functions, real DLD data.
 */
import { DIGEST_MONTH, type RentRow, type SaleRow } from "./types";
import { addMonths, median, monthRange } from "./stats";
import { jvcMedianPerSqm, monthOf, pricePerSqm, window3, type Estimate, type Unit } from "./market";
import { inBand, rentStats } from "./rent";
import { aed, roundEstimate } from "./format";
import { jvcYield } from "./digest";

export type Tone = "good" | "watch" | "neutral";

export interface Insight {
  id: "price_level" | "momentum" | "liquidity" | "yield" | "supply" | "market";
  tone: Tone;
  title: string;
  detail: string;
  action: string;
  source: "dld" | "ejari" | "estimate";
}

const inWin = (iso: string, [from, to]: [string, string]) => {
  const m = monthOf(iso);
  return m >= from && m <= to;
};

const short = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleString("en-US", { month: "short", timeZone: "UTC" });
/** ["2026-08","2026-10"] -> "Aug–Oct" */
export const windowLabel = ([a, b]: [string, string]) => `${short(a)}–${short(b)}`;

const pp = (x: number) => `${x > 0 ? "+" : ""}${(x * 100).toFixed(0)}%`;

/** Median AED/m² per month; null when fewer than `min` deals that month. */
export function monthlyPerSqm(
  resales: SaleRow[],
  keep: (r: SaleRow) => boolean,
  from = "2026-01",
  to = DIGEST_MONTH,
  min = 3,
): { month: string; value: number | null; count: number }[] {
  return monthRange(from, to).map((month) => {
    const rows = resales.filter((r) => keep(r) && monthOf(r.date) === month);
    return { month, value: rows.length >= min ? median(rows.map(pricePerSqm)) : null, count: rows.length };
  });
}

/** Median AED/m² in a 3-month window for rows passing `keep`; null if fewer than 5 deals. */
function windowPerSqm(resales: SaleRow[], keep: (r: SaleRow) => boolean, month: string): number | null {
  const rows = resales.filter((r) => keep(r) && inWin(r.date, window3(month)));
  return rows.length >= 5 ? median(rows.map(pricePerSqm)) : null;
}

/** Position of the building among JVC buildings by resales in the last 3 months (1 = most traded). */
export function liquidityRank(resales: SaleRow[], building: string, month = DIGEST_MONTH) {
  const counts = new Map<string, number>();
  for (const r of resales) if (r.project && inWin(r.date, window3(month))) counts.set(r.project, (counts.get(r.project) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const idx = ranked.findIndex(([n]) => n === building);
  return { rank: idx + 1, of: ranked.length, deals: idx >= 0 ? ranked[idx][1] : 0 };
}

export interface Reading {
  headline: string;
  tone: Tone;
  insights: Insight[];
}

/** Owner / buyer reading of one unit's value. */
export function valuationInsights(resales: SaleRow[], rents: RentRow[], unit: Unit, est: Estimate, month = DIGEST_MONTH): Reading {
  const insights: Insight[] = [];
  const sameRoomsJvc = (r: SaleRow) => r.sub_type === "Flat" && r.rooms === unit.rooms;
  const inBuilding = (r: SaleRow) => r.project === unit.building;

  // 1. Price level vs JVC for the same bedrooms.
  const jvcRooms = windowPerSqm(resales, sameRoomsJvc, month);
  if (jvcRooms) {
    const premium = est.perSqm / jvcRooms - 1;
    const tone: Tone = premium > 0.05 ? "good" : premium < -0.05 ? "watch" : "neutral";
    insights.push({
      id: "price_level",
      tone,
      title:
        tone === "good"
          ? `Your building sells ${pp(premium)} above JVC`
          : tone === "watch"
            ? `Your building sells ${pp(premium)} below JVC`
            : "Priced in line with JVC",
      detail: `AED ${Math.round(est.perSqm).toLocaleString("en-US")} per m² here vs AED ${Math.round(jvcRooms).toLocaleString("en-US")} for similar units across JVC (last 3 months).`,
      action:
        tone === "good"
          ? "When you price, use deals in your building, not JVC averages: they undersell your unit."
          : tone === "watch"
            ? "Buyers see a discount building. Condition and view decide whether you sell at the top of the range."
            : "JVC averages are a fair guide for your unit.",
      source: "dld",
    });
  }

  // 2. Momentum: building vs JVC, previous 3 months vs last 3 months.
  const prev = addMonths(month, -3);
  const bNow = windowPerSqm(resales, inBuilding, month);
  const bPrev = windowPerSqm(resales, inBuilding, prev);
  const jNow = jvcMedianPerSqm(resales, month);
  const jPrev = jvcMedianPerSqm(resales, prev);
  if (bNow && bPrev && jNow && jPrev) {
    const b = bNow / bPrev - 1;
    const j = jNow / jPrev - 1;
    const rel = b - j;
    const tone: Tone = rel > 0.02 ? "good" : rel < -0.02 ? "watch" : "neutral";
    insights.push({
      id: "momentum",
      tone,
      title: tone === "good" ? "Holding up better than JVC" : tone === "watch" ? "Weaker than JVC lately" : "Moving with JVC",
      detail: `Price per m² in your building ${pp(b)} vs ${pp(j)} for JVC flats (${windowLabel(window3(prev))} vs ${windowLabel(window3(month))}).`,
      action:
        tone === "watch"
          ? "Watch next month's deals before you set an asking price."
          : "No change needed. We will tell you if this turns.",
      source: "dld",
    });
  }

  // 3. Liquidity.
  const liq = liquidityRank(resales, unit.building, month);
  if (liq.rank > 0) {
    const top = liq.rank / liq.of;
    const tone: Tone = top <= 0.1 ? "good" : top > 0.5 ? "watch" : "neutral";
    insights.push({
      id: "liquidity",
      tone,
      title: tone === "good" ? "Easy to sell" : tone === "watch" ? "Slow to sell" : "Average to sell",
      detail: `${liq.deals} resales in the last 3 months: #${liq.rank} of ${liq.of} JVC buildings by deals.`,
      action: tone === "good" ? "Buyers are active here: a well-priced unit should not sit for long." : "Allow more time if you plan to sell.",
      source: "dld",
    });
  }

  // 4. Rental yield vs JVC.
  const newLeases = rents.filter((r) => r.project === unit.building && r.version === "New" && inBand(r, unit.sizeSqm));
  if (newLeases.length >= 5) {
    const y = rentStats(newLeases).median / est.mid;
    const jy = jvcYield(resales, rents, month);
    const tone: Tone = y > jy + 0.003 ? "good" : y < jy - 0.003 ? "watch" : "neutral";
    insights.push({
      id: "yield",
      tone,
      title: tone === "good" ? "Rents high for the price" : tone === "watch" ? "Rents low for the price" : "Typical rental yield",
      detail: `Gross yield ${(y * 100).toFixed(1)}% vs ${(jy * 100).toFixed(1)}% for JVC flats.`,
      action:
        tone === "watch"
          ? "You pay for the building's premium in yield: it suits capital growth or living in, less pure income."
          : "Letting works here: rent covers more of the price than in most of JVC.",
      source: "ejari",
    });
  }

  // 5. New-building supply wave.
  const buildingRents = rents.filter((r) => r.project === unit.building);
  const firstLets = buildingRents.filter((r) => r.version === "New").length;
  if (buildingRents.length >= 50 && firstLets / buildingRents.length > 0.8) {
    const peak = [...monthCounts(buildingRents).entries()].sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: "supply",
      tone: "watch",
      title: "Newly handed over: many units letting at once",
      detail: `${Math.round((firstLets / buildingRents.length) * 100)}% of ${buildingRents.length} Ejari contracts in 2026 are first lettings; the peak was ${peak[1]} in ${peak[0]}.`,
      action: "Letting soon? Price near the median of new leases: tenants have many similar units to choose from.",
      source: "ejari",
    });
  }

  // 6. Market direction: same windows as the momentum reading and the outlook (W5).
  const jPrevMkt = jvcMedianPerSqm(resales, prev);
  const chg = jNow / jPrevMkt - 1;
  insights.push({
    id: "market",
    tone: chg < -0.02 ? "watch" : chg > 0.02 ? "good" : "neutral",
    title: chg < -0.02 ? "JVC prices are softening" : chg > 0.02 ? "JVC prices are rising" : "JVC prices are flat",
    detail: `JVC flats: AED ${Math.round(jNow).toLocaleString("en-US")} per m² in ${windowLabel(window3(month))} vs ${Math.round(jPrevMkt).toLocaleString("en-US")} in ${windowLabel(window3(prev))} (${pp(chg)}).`,
    action:
      chg < -0.02
        ? "Selling within a year? Compare any offer with recent deals, not last year's prices. Holding and letting? Rent matters more than price."
        : "Your value follows the market: we will flag big moves.",
    source: "dld",
  });

  // Badge and headline both describe the building; the market reading is shown on its own line.
  return { headline: headlineOf(insights), tone: overallTone(insights.filter((i) => i.id !== "market")), insights };
}

function monthCounts(rows: RentRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(monthOf(r.registered), (m.get(monthOf(r.registered)) ?? 0) + 1);
  return m;
}

export function overallTone(insights: Insight[]): Tone {
  const good = insights.filter((i) => i.tone === "good").length;
  const watch = insights.filter((i) => i.tone === "watch").length;
  return good > watch ? "good" : watch > good ? "watch" : "neutral";
}

/** One-line summary: the building first, then the market. */
export function headlineOf(insights: Insight[]): string {
  const building = insights.filter((i) => i.id !== "market");
  const market = insights.find((i) => i.id === "market");
  const good = building.filter((i) => i.tone === "good").length;
  const watch = building.filter((i) => i.tone === "watch").length;
  const b = good > watch ? "A strong building" : watch > good ? "A building to watch" : "A typical JVC building";
  const m = !market ? "" : market.tone === "watch" ? " in a softening market" : market.tone === "good" ? " in a rising market" : " in a flat market";
  return b + m;
}

export interface Advice {
  tone: Tone;
  title: string;
  detail: string;
  action: string;
}

/** Renter: what the Rent watch verdict means and what to do. */
export function rentAdvice(input: { verdict: "below" | "around" | "above"; gap: number; annualRent: number; median: number; maxIncrease: number | null }): Advice {
  const saving = Math.max(0, input.annualRent - input.median);
  if (input.verdict === "above")
    return {
      tone: "watch",
      title: `You pay about AED ${Math.round(saving / 1000)}K a year more than new tenants`,
      detail: "New leases for units like yours are cheaper right now.",
      action: "At renewal, show these numbers and ask to stay at today's market rent. Moving only pays off if the saving beats agency fee and moving costs.",
    };
  if (input.verdict === "below")
    return {
      tone: "good",
      title: "You have a good deal",
      detail: "You pay less than most new tenants for a similar unit.",
      action:
        input.maxIncrease != null
          ? `Renew rather than move. By law the landlord can raise the rent by at most ${(input.maxIncrease * 100).toFixed(0)}%.`
          : "Renew rather than move: a new lease would likely cost more.",
    };
  return {
    tone: "neutral",
    title: "You pay a fair rent",
    detail: "Your rent is close to what new tenants pay.",
    action: "No need to move for price. Check the allowed increase before you sign the renewal.",
  };
}

/** Buyer: what the asking price means and what to do. */
export function buyAdvice(asking: number, est: { low: number; mid: number; high: number }): Advice {
  if (asking > est.high)
    return {
      tone: "watch",
      title: "Above recent deals: room to negotiate",
      detail: "Most similar units sold for less in the last 3 months.",
      action: `Offer near the top of the range (about ${aed(roundEstimate(est.high), { compact: true })}) and ask the agent which deals justify the price.`,
    };
  if (asking < est.low)
    return {
      tone: "watch",
      title: "Below recent deals: ask why",
      detail: "Cheap for the building. It may be a motivated seller, or a unit with a weaker view, floor or condition.",
      action: "Visit, check the view and service charges, then move fast if it checks out.",
    };
  return {
    tone: "good",
    title: "In line with recent deals",
    detail: "The price sits within the range of similar resales.",
    action: "Fair to offer close to asking. Check the bank valuation before you sign the MOU.",
  };
}
