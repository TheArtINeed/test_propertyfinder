import { describe, expect, it } from "vitest";
import {
  addYears, checkLeaseEnd, checkLoan, checkPercent, checkPrice, checkRent, checkStartDate, checkTitleDeed, checkUnitNumber, inRange, LIMITS,
} from "@/lib/sanity";
import { parseBuyQuery, parseRentQuery, validateClaim, validateUnitForm } from "@/lib/forms";
import { leadFieldErrors, parseUnitQuery, validateIntent } from "@/lib/owner";

const T = "2026-11-21";

describe("sanity rules at both bounds (spec 13)", () => {
  it("rent AED 10,000 – 2,000,000", () => {
    expect(checkRent(10_000)).toBeUndefined();
    expect(checkRent(2_000_000)).toBeUndefined();
    expect(checkRent(9_999)).toMatch(/between AED 10,000 and 2,000,000/);
    expect(checkRent(2_000_001)).toBeDefined();
    expect(checkRent("85,000")).toBeUndefined();
    expect(checkRent("abc")).toBeDefined();
  });
  it("price AED 100,000 – 50,000,000", () => {
    expect(checkPrice(100_000)).toBeUndefined();
    expect(checkPrice(50_000_000)).toBeUndefined();
    expect(checkPrice(99_999)).toBeDefined();
    expect(checkPrice(10_000_000_000)).toMatch(/between AED 100,000 and 50,000,000/);
  });
  it("loan: optional, not above the price paid", () => {
    expect(checkLoan("")).toBeUndefined();
    expect(checkLoan(0)).toBeUndefined();
    expect(checkLoan(600_000, 1_100_000)).toBeUndefined();
    expect(checkLoan(1_100_000, 1_100_000)).toBeUndefined();
    expect(checkLoan(1_100_001, 1_100_000)).toBe("The loan can't be more than the price paid");
    expect(checkLoan(-1)).toBeDefined();
  });
  it("lease end: today to 5 years ahead", () => {
    expect(checkLeaseEnd(T, T)).toBeUndefined();
    expect(checkLeaseEnd(addYears(T, 5), T)).toBeUndefined();
    expect(checkLeaseEnd("2026-11-20", T)).toBe("The lease end is in the past: enter the current lease");
    expect(checkLeaseEnd("2031-11-22", T)).toBeDefined();
    expect(checkLeaseEnd("tomorrow", T)).toBe("Pick the lease end date");
  });
  it("start date: today to 2 years ahead", () => {
    expect(checkStartDate(T, T)).toBeUndefined();
    expect(checkStartDate("2028-11-21", T)).toBeUndefined();
    expect(checkStartDate("2028-11-22", T)).toBeDefined();
    expect(checkStartDate("2026-11-20", T)).toBeDefined();
  });
  it("percent, unit number, title deed", () => {
    expect(checkPercent("", LIMITS.ask, "an increase")).toBeUndefined();
    expect(checkPercent("100", LIMITS.ask, "an increase")).toBeUndefined();
    expect(checkPercent("101", LIMITS.ask, "an increase")).toBe("Enter an increase from 0 to 100%");
    expect(checkPercent("21", LIMITS.rate, "a rate")).toBeDefined();
    expect(checkUnitNumber("12-04B")).toBeUndefined();
    expect(checkUnitNumber("12 04")).toBeDefined();
    expect(checkUnitNumber("1234567890123")).toBeDefined();
    expect(checkTitleDeed("")).toBeUndefined();
    expect(checkTitleDeed("AB")).toBeDefined();
    expect(checkTitleDeed("DEMO-0001")).toBeUndefined();
  });
  it("inRange drops out-of-range deep-link values", () => {
    expect(inRange(10_000_000_000, LIMITS.price)).toBeNull();
    expect(inRange(1_100_000, LIMITS.price)).toBe(1_100_000);
  });
});

describe("forms use the rules", () => {
  it("claim sheet: price paid, loan, lease end, title deed", () => {
    const base = { unit: "1204", occupancy: "let" as const, rent: "95000", leaseEnd: "2027-01-31", consent: true };
    expect(validateClaim({ ...base, paid: "1100000", loan: "600000", deed: "DEMO-0001" })).toEqual({});
    const e = validateClaim({ ...base, rent: "5", leaseEnd: "2026-10-29", paid: "10000000000", loan: "1000000", deed: "x" });
    expect(Object.keys(e).sort()).toEqual(["deed", "leaseEnd", "paid", "rent"]);
    expect(validateClaim({ ...base, paid: "1000000", loan: "1200000" }).loan).toBe("The loan can't be more than the price paid");
  });
  it("unit form: unit number format", () => {
    expect(validateUnitForm({ unit: "12/04", size: "80", system: "sqm" }).errors.unit).toBeDefined();
  });
  it("/rent: rent range, past lease end, increase and rate", () => {
    const q = parseRentQuery({ go: "1", size: "80", rent: "5000000", end: "2025-01-01", ask: "150", rate: "30" });
    expect(Object.keys(q.errors).sort()).toEqual(["ask", "end", "rate", "rent"]);
    expect(parseRentQuery({ go: "1", size: "80", rent: "90000", end: "2027-02-15", ask: "10" }).errors).toEqual({});
  });
  it("/buy: asking price range", () => {
    expect(parseBuyQuery({ go: "1", size: "80", price: "50000" }).errors.price).toMatch(/between AED 100,000/);
  });
  it("plans card and lead: rent vs sale ranges, dates", () => {
    expect(validateIntent({ kind: "rent_out", date: "2027-02-01", price: "80000" })).toEqual({});
    expect(validateIntent({ kind: "rent_out", date: "2025-01-01", price: "5000000" })).toEqual({
      date: "Pick a date from today to 2 years ahead",
      price: "Enter a yearly rent between AED 10,000 and 2,000,000",
    });
    expect(validateIntent({ kind: "open_to_offers", date: "", price: "80000" }).price).toMatch(/between AED 100,000/);
    expect(validateIntent({ kind: "not_now", date: "", price: "" })).toEqual({});
    expect(leadFieldErrors({ intent: "sell", askingPrice: 80_000, availableFrom: "2027-02-01", contact: "call", consent: true }).price).toBeDefined();
    expect(leadFieldErrors({ intent: "rent_out", askingPrice: 80_000, availableFrom: "2027-02-01", contact: "call", consent: true })).toEqual({});
  });
  it("deep link with absurd values: ignored, unit still opens", () => {
    const p = parseUnitQuery({ unit: "1707", rooms: "2", size: "119", occ: "let", rent: "155000", leaseEnd: "2026-10-29", paid: "10000000000", loan: "1000000" })!;
    expect(p.pricePaid).toBeNull();
    expect(p.leaseEnd).toBeNull();
    expect(p.annualRent).toBe(155_000);
    expect(p.loan).toBe(1_000_000);
    expect(parseUnitQuery({ rooms: "1", size: "80", paid: "1000000", loan: "2000000" })!.loan).toBeNull();
  });
});

import { renderToString } from "react-dom/server";
import Rent from "@/app/rent/page";
const page = async (q: Record<string, string>) => renderToString(await Rent({ searchParams: Promise.resolve(q) })).replaceAll("<!-- -->", "");

describe("/rent shows sanity messages under the fields", () => {
  it("past lease end and a 150% increase: messages under their fields, no results", async () => {
    const h = await page({ go: "1", b: "luma-park-views", rooms: "1", size: "80", rent: "90000", end: "2025-01-01", ask: "150" });
    expect(h.indexOf("The lease end is in the past")).toBeGreaterThan(h.indexOf('id="end"'));
    expect(h.indexOf("Enter an increase from 0 to 100%")).toBeGreaterThan(h.indexOf('id="ask"'));
    expect(h).not.toContain("Rent watch");
  });
  it("a bad mortgage rate keeps the results and falls back to the example rate", async () => {
    const h = await page({ go: "1", b: "luma-park-views", rooms: "1", size: "80", rent: "90000", rate: "35" });
    expect(h).toContain("Rent watch");
    expect(h).toContain("Using the example rate");
    expect(h).toContain("at 4.5%");
  });
});
