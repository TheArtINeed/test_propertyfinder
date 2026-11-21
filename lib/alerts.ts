/**
 * A2 (spec section 19): event alerts. The monthly update is the fallback; events come first.
 * Pure functions over the snapshot rows and the owner's details. Delivery is simulated.
 */
import { AS_OF, DIGEST_MONTH, type RentRow, type SaleRow } from "./types";
import { addMonths, median } from "./stats";
import { monthOf, window3, type Unit } from "./market";
import { filterRents } from "./rent";
import { areaNews, IMPACT_WORD } from "./news";
import type { Digest } from "./digest";

export type AlertKind = "deal" | "rent_move" | "lease" | "refi" | "news" | "monthly";

export interface Alert {
  id: string;
  kind: AlertKind;
  date: string; // YYYY-MM-DD, when it would be sent
  title: string;
  body: string;
  why: string;
  illustrative: boolean;
  source: string;
  push: { title: string; body: string };
  whatsapp: string[];
  email: { subject: string };
}

/** Rent move threshold: new-lease median for the size band, last 3 months vs the 3 before. */
export const RENT_MOVE = 0.05;

const SOURCE: Record<AlertKind, string> = {
  deal: "DLD registered resales",
  rent_move: "Ejari contracts",
  lease: "Your lease details",
  refi: "Your mortgage details",
  news: "Illustrative example, not a real event",
  monthly: "PropWorth estimate",
};

const k = (n: number) => (n >= 1_000_000 ? `AED ${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M` : `AED ${Math.round(n / 1000)}K`);
const pp = (x: number) => `${x > 0 ? "+" : ""}${Math.round(x * 100)}%`;
const minusDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};
const lastDay = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

function make(a: Omit<Alert, "push" | "whatsapp" | "email" | "source">, url: string): Alert {
  const source = a.illustrative ? "Illustrative example, not a real event" : SOURCE[a.kind];
  return {
    ...a,
    source,
    push: { title: a.title, body: a.body },
    whatsapp: [`${a.title}.`, `${a.body} ${url}`],
    email: { subject: a.title },
  };
}

/** (1) A resale in the building this month: the top one. */
export function dealAlert(resales: SaleRow[], building: string, month: string, url: string): Alert | null {
  const inMonth = resales.filter((r) => r.project === building && monthOf(r.date) === month);
  if (!inMonth.length) return null;
  const top = inMonth.reduce((a, r) => (r.value_aed > a.value_aed ? r : a));
  return make(
    {
      id: `deal-${top.id}`,
      kind: "deal",
      date: top.date,
      title: `New deal in ${building}`,
      body: `A ${top.rooms === 0 ? "studio" : `${top.rooms}BR`} of ${Math.round(top.size_sqm)} m² sold for ${k(top.value_aed)}${inMonth.length > 1 ? ` (${inMonth.length} resales this month)` : ""}.`,
      why: "A registered resale in your building (DLD).",
      illustrative: false,
    },
    url,
  );
}

/** (2) New-lease median for the size band moved more than 5%. */
export function rentMoveAlert(rents: RentRow[], unit: Unit, month: string, url: string): Alert | null {
  const now = window3(month);
  const prev = window3(addMonths(month, -3));
  const pick = (w: [string, string]) =>
    filterRents(rents, { building: unit.building, sizeSqm: unit.sizeSqm, from: w[0], to: w[1], version: "New" }).map((r) => r.annual_aed);
  const a = pick(now);
  const b = pick(prev);
  if (a.length < 5 || b.length < 5) return null;
  const change = median(a) / median(b) - 1;
  // Epsilon: 80,000 x 1.05 is a hair above 5% in floating point; exactly 5% must not fire.
  if (Math.abs(change) <= RENT_MOVE + 1e-9) return null;
  return make(
    {
      id: `rent-${month}`,
      kind: "rent_move",
      date: lastDay(month),
      title: `Rents ${change > 0 ? "up" : "down"} ${pp(change)} for homes like yours`,
      body: `New leases in ${unit.building}: median ${k(median(a))} a year, was ${k(median(b))}.`,
      why: `New-lease rents for your size moved more than ${RENT_MOVE * 100}% in 3 months (Ejari).`,
      illustrative: false,
    },
    url,
  );
}

/**
 * (3) Lease milestones. Ended -> "has ended"; within 30 days -> the 30-day alert;
 * otherwise the 90-day alert (already sent, or scheduled if it is still ahead).
 */
export function leaseAlert(leaseEnd: string | null | undefined, marketRent: number | null, today: string, url: string): Alert | null {
  if (!leaseEnd) return null;
  const rentLine = marketRent ? ` New leases here: median ${k(marketRent)}.` : "";
  if (leaseEnd < today)
    return make(
      { id: `lease-ended-${leaseEnd}`, kind: "lease", date: today, title: "Your lease has ended", body: `Re-let now or set your plans.${rentLine}`, why: "The lease end you saved has passed.", illustrative: false },
      url,
    );
  const d30 = minusDays(leaseEnd, 30);
  const days = today >= d30 ? 30 : 90;
  return make(
    {
      id: `lease-${days}-${leaseEnd}`,
      kind: "lease",
      date: minusDays(leaseEnd, days),
      title: days === 30 ? "Your tenant's lease ends in a month" : "Your tenant's lease ends in 3 months",
      body: `Renew or re-let?${rentLine}`,
      why: `${days} days before the lease end you saved (${leaseEnd})${days === 90 ? ": the RERA notice deadline" : ""}.`,
      illustrative: false,
    },
    url,
  );
}

/** H1: fixed-rate milestones, 6 and 3 months before the end; the 3-month one once that date has come. */
export function refiAlert(fixedRateEnd: string | null | undefined, today: string, url: string): Alert | null {
  if (!fixedRateEnd || fixedRateEnd < today) return null;
  const minusMonths = (iso: string, n: number) => {
    const d = new Date(iso + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() - n);
    return d.toISOString().slice(0, 10);
  };
  const m3 = minusMonths(fixedRateEnd, 3);
  const months = today >= m3 ? 3 : 6;
  return make(
    {
      id: `refi-${months}-${fixedRateEnd}`,
      kind: "refi",
      date: minusMonths(fixedRateEnd, months),
      title: `Your fixed rate ends in ${months} months`,
      body: "Compare mortgage offers before the rate resets.",
      why: `${months} months before the end of the fixed rate you saved (${fixedRateEnd}).`,
      illustrative: false,
    },
    url,
  );
}

/** (4) Building and area news with a price impact (illustrative). */
export function newsAlerts(url: string): Alert[] {
  return areaNews()
    .filter((n) => n.impact !== "neutral")
    .map((n) =>
      make({ id: `news-${n.id}`, kind: "news", date: n.date, title: n.title, body: `${IMPACT_WORD[n.impact]}: ${n.impactText}.`, why: "News near your building with a likely effect on price.", illustrative: true }, url),
    );
}

/** (5) The monthly update on the 1st: the fallback when nothing else happened. */
export function monthlyAlert(d: Digest, building: string, unitNumber: string, sendOn: string, url: string): Alert {
  const month = new Date(d.month + "-01T00:00:00Z").toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return make(
    {
      id: `monthly-${d.month}`,
      kind: "monthly",
      date: sendOn,
      title: `Your home in ${month}`,
      body: `${building} ${unitNumber} is worth ${k(Math.round(d.capital.low / 5000) * 5000)}–${k(Math.round(d.capital.high / 5000) * 5000)}.`,
      why: "Your monthly update, on the 1st.",
      illustrative: false,
    },
    url,
  );
}

/** All alerts for one home, newest first. */
export function alertsForHome(input: {
  resales: SaleRow[];
  rents: RentRow[];
  unit: Unit;
  unitNumber: string;
  digest: Digest;
  leaseEnd?: string | null;
  fixedRateEnd?: string | null;
  marketRent: number | null;
  url: string;
  month?: string;
  today?: string;
}): Alert[] {
  const month = input.month ?? DIGEST_MONTH;
  const today = input.today ?? AS_OF;
  const list = [
    dealAlert(input.resales, input.unit.building, month, input.url),
    rentMoveAlert(input.rents, input.unit, month, input.url),
    leaseAlert(input.leaseEnd, input.marketRent, today, input.url),
    refiAlert(input.fixedRateEnd, today, input.url),
    ...newsAlerts(input.url),
    monthlyAlert(input.digest, input.unit.building, input.unitNumber, `${addMonths(month, 1)}-01`, input.url),
  ].filter((a): a is Alert => a != null);
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
