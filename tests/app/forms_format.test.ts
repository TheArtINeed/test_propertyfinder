import { describe, expect, it } from "vitest";
import { parseBuyQuery, parseRentQuery, validateClaim, validateUnitForm } from "@/lib/forms";
import { aed, pct, roundEstimate } from "@/lib/format";

describe("rent form", () => {
  it("parses inputs from the URL", () => {
    const q = parseRentQuery({ b: "luma-park-views", rooms: "2", size: "116", rent: "130,000", end: "2027-01-31", ask: "5", rate: "4" });
    expect(q).toMatchObject({ building: "luma-park-views", rooms: 2, sizeSqm: 116, annualRent: 130_000, leaseEnd: "2027-01-31", askedIncrease: 0.05, rate: 0.04, errors: {} });
  });
  it("is not submitted on first open and reports bad input after submit", () => {
    expect(parseRentQuery({}).submitted).toBe(false);
    const q = parseRentQuery({ size: "5", rent: "abc", end: "tomorrow", rooms: "9" });
    expect(q.errors).toEqual({ size: "Enter your size in m² (15 – 1,500)", rent: "Enter your annual rent" });
    expect(q.leaseEnd).toBeNull();
    expect(q.rooms).toBe(1);
  });
});

describe("buy form", () => {
  it("needs size and asking price", () => {
    expect(parseBuyQuery({ price: "1250000", size: "80" }).errors).toEqual({});
    expect(Object.keys(parseBuyQuery({ price: "x", size: "" }).errors).sort()).toEqual(["price", "size"]);
  });
});

describe("format", () => {
  it("formats AED and percentages", () => {
    expect(aed(1_290_000)).toBe("AED 1,290,000");
    expect(aed(1_290_000, { compact: true })).toBe("AED 1.29M");
    expect(aed(85_000, { compact: true })).toBe("AED 85K");
    expect(pct(0.125, 0, true)).toBe("+13%");
    expect(pct(-0.2)).toBe("-20%");
    expect(roundEstimate(1_287_400)).toBe(1_285_000);
  });
});

describe("inline field errors (V1)", () => {
  it("unit form: one message per field, converts ft²", () => {
    expect(validateUnitForm({ unit: "", size: "", system: "sqm" }).errors).toEqual({ unit: "Enter your unit number", size: "Enter the size" });
    expect(validateUnitForm({ unit: "1245", size: "41", system: "sqm" })).toEqual({ errors: {}, sizeSqm: 41 });
    expect(validateUnitForm({ unit: "1", size: "861", system: "sqft" }).sizeSqm).toBeCloseTo(80, 0);
    expect(validateUnitForm({ unit: "1", size: "5", system: "sqm" }).errors.size).toMatch(/between/);
  });
  it("claim: rent and lease end only when let; consent always", () => {
    expect(validateClaim({ unit: "1", occupancy: "live", rent: "", leaseEnd: "", consent: true })).toEqual({});
    expect(Object.keys(validateClaim({ unit: "", occupancy: "let", rent: "", leaseEnd: "", consent: false })).sort()).toEqual([
      "consent", "leaseEnd", "rent", "unit",
    ]);
  });
});
