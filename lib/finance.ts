/** Money maths: capital, bank valuation gap, mortgage, rent vs buy. Pure functions. */
import { DLD_FEE } from "./types";

export interface Capital {
  value: number;
  equity: number | null; // value - loan
  gain: number | null; // value - price paid - 4% DLD fee on the price paid
}

export function capital(value: number, opts: { pricePaid?: number | null; loan?: number | null }): Capital {
  const loan = opts.loan ?? null;
  const paid = opts.pricePaid ?? null;
  return {
    value,
    equity: loan == null ? null : value - loan,
    gain: paid == null ? null : value - paid - paid * DLD_FEE,
  };
}

export const MAX_LTV = 0.8;

export interface BankGap {
  overP75: boolean;
  gapToEstimate: number; // asking - estimate (mid)
  loan: number; // 80% of the lower of price and bank valuation
  cashNeeded: number; // asking - loan
  cashIfValuedAtPrice: number; // 20% of asking
  extraCash: number;
}

/** Banks lend on the lower of price and valuation; we use the estimate midpoint as the likely valuation. */
export function bankGap(asking: number, estimate: { mid: number; high: number }, ltv = MAX_LTV): BankGap {
  const valuation = Math.min(asking, estimate.mid);
  const loan = valuation * ltv;
  const cashNeeded = asking - loan;
  const cashIfValuedAtPrice = asking * (1 - ltv);
  return {
    overP75: asking > estimate.high,
    gapToEstimate: asking - estimate.mid,
    loan,
    cashNeeded,
    cashIfValuedAtPrice,
    extraCash: cashNeeded - cashIfValuedAtPrice,
  };
}

/** Standard annuity payment. Rate is annual, e.g. 0.045. */
export function monthlyPayment(principal: number, annualRate: number, years: number): number {
  const n = years * 12;
  const r = annualRate / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Example mortgage rate, not a quote. Labelled "Example rate" in the UI. */
export const EXAMPLE_RATE = 0.045;
export const DOWN_PAYMENT = 0.2;
export const MORTGAGE_YEARS = 25;

export interface RentVsBuy {
  price: number;
  upfront: number; // 20% down + 4% DLD fee
  loan: number;
  monthlyMortgage: number;
  monthlyRent: number;
  difference: number; // mortgage - rent, per month
  priceToRent: number; // price / annual rent
}

export function rentVsBuy(price: number, annualRent: number, rate = EXAMPLE_RATE): RentVsBuy {
  const loan = price * (1 - DOWN_PAYMENT);
  const monthlyMortgage = monthlyPayment(loan, rate, MORTGAGE_YEARS);
  const monthlyRent = annualRent / 12;
  return {
    price,
    upfront: price * DOWN_PAYMENT + price * DLD_FEE,
    loan,
    monthlyMortgage,
    monthlyRent,
    difference: monthlyMortgage - monthlyRent,
    priceToRent: price / annualRent,
  };
}

/** Deterministic string hash (FNV-1a), for mocked numbers. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Demand {
  searches: number;
  priceCap: number;
  level: "high" | "normal";
  label: string;
}

const DEMAND_BASE = [900, 1400, 700, 350, 200]; // studio, 1BR, 2BR, 3BR, 4BR+

/**
 * MOCKED demand: PF search data is not public. Same unit type and price band -> same number.
 * Always carries the "Illustrative" label.
 */
export function mockDemand(rooms: number, estimate: number, month: string): Demand {
  const priceCap = Math.ceil(estimate / 250_000) * 250_000;
  const base = DEMAND_BASE[Math.min(rooms, 4)];
  const jitter = hash(`${rooms}|${priceCap}|${month}`) % 400;
  const searches = base + jitter;
  return {
    searches,
    priceCap,
    level: searches >= base + 200 ? "high" : "normal",
    label: "Illustrative: based on PF searches in production",
  };
}
