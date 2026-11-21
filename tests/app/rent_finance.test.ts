import { describe, expect, it } from "vitest";
import { grossYield, reraIndexProxy, reraMaxIncrease, renewalCheck, rentWatch, verdictOf } from "@/lib/rent";
import { bankGap, capital, mockDemand, monthlyPayment, rentVsBuy } from "@/lib/finance";
import { rent } from "./fixtures";

describe("Rent watch (R2)", () => {
  const building = Array.from({ length: 10 }, (_, i) => rent({ annual_aed: 80_000 + i * 2_000 }));
  const jvc = Array.from({ length: 20 }, () => rent({ project: "Other", annual_aed: 70_000 }));

  it("compares with new leases in the building when it has >= 10", () => {
    const w = rentWatch([...building, ...jvc], { building: "Tower A", sizeSqm: 80, annualRent: 99_000 }, "2026-10")!;
    expect(w.level).toBe("building");
    expect(w.stats.count).toBe(10);
    expect(w.stats.median).toBe(89_000);
    expect(w.gap).toBeCloseTo(10_000 / 89_000);
    expect(w.verdict).toBe("above");
  });

  it("falls back to JVC by size when the building has fewer than 10", () => {
    const w = rentWatch([...building.slice(0, 9), ...jvc], { building: "Tower A", sizeSqm: 80, annualRent: 70_000 }, "2026-10")!;
    expect(w.level).toBe("jvc");
    expect(w.stats.count).toBe(29);
  });

  it("ignores renewals, other sizes and months outside the window", () => {
    const rows = [
      rent({ version: "Renewed", annual_aed: 1 }),
      rent({ size_sqm: 120, annual_aed: 1 }),
      rent({ registered: "2026-07-01", annual_aed: 1 }),
      rent({ annual_aed: 50_000 }),
    ];
    const w = rentWatch(rows, { sizeSqm: 80, annualRent: 50_000 }, "2026-10")!;
    expect(w.stats.count).toBe(1);
    expect(w.verdict).toBe("around");
  });

  it("verdict thresholds at +-5%", () => {
    expect(verdictOf(-0.051)).toBe("below");
    expect(verdictOf(0.05)).toBe("around");
    expect(verdictOf(0.051)).toBe("above");
  });
});

describe("RERA allowed increase (O8, R3)", () => {
  it("returns the right band at each boundary", () => {
    const idx = 100_000;
    expect(reraMaxIncrease(100_000, idx)).toBe(0);
    expect(reraMaxIncrease(90_000, idx)).toBe(0); // exactly 10% below
    expect(reraMaxIncrease(89_999, idx)).toBe(0.05);
    expect(reraMaxIncrease(80_000, idx)).toBe(0.05); // 20%
    expect(reraMaxIncrease(79_999, idx)).toBe(0.1);
    expect(reraMaxIncrease(70_000, idx)).toBe(0.1); // 30%
    expect(reraMaxIncrease(69_999, idx)).toBe(0.15);
    expect(reraMaxIncrease(60_000, idx)).toBe(0.15); // 40%
    expect(reraMaxIncrease(59_999, idx)).toBe(0.2);
    expect(reraMaxIncrease(120_000, idx)).toBe(0); // above the index
  });

  it("index proxy uses ALL contracts (new + renewed) of the size band", () => {
    const rows = [
      rent({ annual_aed: 100_000 }),
      rent({ version: "Renewed", annual_aed: 80_000 }),
      rent({ version: "Renewed", annual_aed: 90_000 }),
      rent({ annual_aed: 9_000_000 }), // Ejari outlier: must not move the index
      rent({ size_sqm: 200, annual_aed: 1 }),
    ];
    const s = reraIndexProxy(rows, 80);
    expect(s.count).toBe(4);
    expect(s.index).toBe(95_000);
  });

  it("checks the asked increase and the 90-day notice", () => {
    const r = renewalCheck(80_000, 100_000, { askedIncrease: 0.1, leaseEnd: "2027-03-01", today: "2026-11-21" });
    expect(r.maxIncrease).toBe(0.05);
    expect(r.allowed).toBe(false);
    expect(r.maxNewRent).toBeCloseTo(84_000);
    expect(r.noticeDeadline).toBe("2026-12-01");
    expect(r.daysToNotice).toBe(10);
    expect(renewalCheck(80_000, 100_000, { askedIncrease: 0.05, today: "2026-11-21" }).allowed).toBe(true);
  });
});

describe("finance", () => {
  it("yield", () => {
    expect(grossYield(80_000, 1_000_000)).toBe(0.08);
  });

  it("capital includes the 4% DLD fee on the price paid", () => {
    const c = capital(1_300_000, { pricePaid: 1_000_000, loan: 700_000 });
    expect(c.equity).toBe(600_000);
    expect(c.gain).toBe(260_000);
    expect(capital(1, {})).toEqual({ value: 1, equity: null, gain: null });
  });

  it("bank gap: lends 80% of the lower of price and valuation", () => {
    const g = bankGap(1_200_000, { mid: 1_000_000, high: 1_100_000 });
    expect(g.overP75).toBe(true);
    expect(g.loan).toBe(800_000);
    expect(g.cashNeeded).toBe(400_000);
    expect(g.cashIfValuedAtPrice).toBeCloseTo(240_000);
    expect(g.extraCash).toBeCloseTo(160_000);
    expect(bankGap(900_000, { mid: 1_000_000, high: 1_100_000 }).extraCash).toBeCloseTo(0);
  });

  it("mortgage payment matches the annuity formula", () => {
    expect(monthlyPayment(800_000, 0.045, 25)).toBeCloseTo(4446.67, 1);
    expect(monthlyPayment(1200, 0, 1)).toBe(100);
  });

  it("rent vs buy: 20% down + 4% fee upfront, 25-year loan", () => {
    const r = rentVsBuy(1_000_000, 60_000, 0.045);
    expect(r.upfront).toBe(240_000);
    expect(r.loan).toBe(800_000);
    expect(r.monthlyRent).toBe(5_000);
    expect(r.difference).toBeCloseTo(r.monthlyMortgage - 5_000);
    expect(r.priceToRent).toBeCloseTo(16.67, 1);
  });

  it("mocked demand is deterministic and labelled", () => {
    const a = mockDemand(1, 1_100_000, "2026-10");
    expect(mockDemand(1, 1_100_000, "2026-10")).toEqual(a);
    expect(a.priceCap).toBe(1_250_000);
    expect(a.label).toMatch(/^Illustrative/);
    expect(a.searches).toBeGreaterThanOrEqual(1400);
    expect(a.searches).toBeLessThan(1800);
  });
});
