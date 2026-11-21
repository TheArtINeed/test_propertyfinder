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

/**
 * G1 (spec v13, adjusted at build): AED 2M Golden Visa threshold.
 * DLD's own service page states the PURCHASE value must be AED 2M or more (mortgaged: a bank letter that 2M is paid):
 * https://dubailand.gov.ae/en/eservices/request-for-golden-visa-investor/ . Some guides say a current valuation can count.
 * So: price paid >= 2M -> "may qualify"; estimate >= 2M only -> "worth 2M+ today, check with DLD";
 * estimate within 25% below 2M -> the gap; else nothing.
 */
export const GOLDEN_VISA_AED = 2_000_000;
export const GOLDEN_VISA_DLD_URL = "https://dubailand.gov.ae/en/eservices/request-for-golden-visa-investor/";
export type GoldenVisa =
  | { kind: "may_qualify"; basis: "price_paid" }
  | { kind: "value_above"; basis: "estimate" }
  | { kind: "gap"; gap: number }
  | { kind: "none" };

export function goldenVisa(estimate: number, pricePaid?: number | null): GoldenVisa {
  if (pricePaid != null && pricePaid >= GOLDEN_VISA_AED) return { kind: "may_qualify", basis: "price_paid" };
  if (estimate >= GOLDEN_VISA_AED) return { kind: "value_above", basis: "estimate" };
  const gap = GOLDEN_VISA_AED - estimate;
  if (gap / GOLDEN_VISA_AED < 0.25) return { kind: "gap", gap };
  return { kind: "none" };
}

/**
 * H1 (spec v15): refinance as a next step for owners with a loan.
 * Due when the fixed-rate period ends within 6 months, or the current rate is at least 0.5 pp above the example rate.
 * Saving = monthly payment at the current rate minus at the example rate, on the loan balance over the remaining term.
 */
export const REFI_MONTHS = 6;
export const REFI_RATE_GAP = 0.005;
export const REFI_TERM_YEARS = 20;

export interface Refinance {
  due: boolean;
  monthsToFixedEnd: number | null;
  rateGap: number | null; // current - example rate
  saving: number | null; // AED per month, > 0 only
}

export function refinance(input: { loan?: number | null; mortgageRate?: number | null; fixedRateEnd?: string | null; today: string; marketRate?: number }): Refinance | null {
  const loan = input.loan ?? 0;
  if (!(loan > 0) || (input.mortgageRate == null && !input.fixedRateEnd)) return null;
  const market = input.marketRate ?? EXAMPLE_RATE;
  let monthsToFixedEnd: number | null = null;
  if (input.fixedRateEnd) {
    const [y, m] = input.today.split("-").map(Number);
    const [fy, fm] = input.fixedRateEnd.split("-").map(Number);
    monthsToFixedEnd = (fy - y) * 12 + (fm - m);
  }
  const rateGap = input.mortgageRate != null ? input.mortgageRate - market : null;
  const savingRaw =
    input.mortgageRate != null ? monthlyPayment(loan, input.mortgageRate, REFI_TERM_YEARS) - monthlyPayment(loan, market, REFI_TERM_YEARS) : null;
  const saving = savingRaw != null && savingRaw > 0 ? savingRaw : null;
  const fixedSoon = monthsToFixedEnd != null && monthsToFixedEnd >= 0 && monthsToFixedEnd <= REFI_MONTHS;
  const rateHigh = rateGap != null && rateGap >= REFI_RATE_GAP - 1e-9;
  return { due: fixedSoon || rateHigh, monthsToFixedEnd, rateGap, saving };
}

export function refinanceTitle(r: Refinance): string {
  const save = r.saving ? `: you could save about AED ${Math.round(r.saving / 50) * 50} a month` : ": compare mortgage offers";
  if (r.monthsToFixedEnd != null && r.monthsToFixedEnd >= 0 && r.monthsToFixedEnd <= REFI_MONTHS)
    return `Your fixed rate ends in ${r.monthsToFixedEnd} ${r.monthsToFixedEnd === 1 ? "month" : "months"}${save}`;
  return `Your mortgage rate is above today's offers${save}`;
}
