import { describe, expect, it } from "vitest";
import {
  annualise,
  estimateValue,
  findComps,
  isResale,
  listBuildings,
  outlook,
  outlookRange,
  residentialResales,
  searchBuildings,
  slugify,
  window3,
} from "@/lib/market";
import { addMonths, median, quantile } from "@/lib/stats";
import { sale, salesAt } from "./fixtures";

describe("stats", () => {
  it("quantile interpolates linearly", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(quantile([10, 20, 30, 40, 50], 0.25)).toBe(20);
    expect(Number.isNaN(median([]))).toBe(true);
  });
  it("adds months across years", () => {
    expect(addMonths("2026-01", -2)).toBe("2025-11");
    expect(addMonths("2026-10", 3)).toBe("2027-01");
    expect(window3("2026-10")).toEqual(["2026-08", "2026-10"]);
  });
});

describe("resale filter", () => {
  it("keeps ready owner-to-owner Sale only", () => {
    expect(isResale(sale({}))).toBe(true);
    expect(isResale(sale({ procedure: "Delayed Sell" }))).toBe(false);
    expect(isResale(sale({ procedure: "Lease to Own Registration" }))).toBe(false);
    expect(isResale(sale({ off_plan: true }))).toBe(false);
    expect(residentialResales([sale({ sub_type: "Shop" }), sale({})])).toHaveLength(1);
  });
});

describe("building search (O1)", () => {
  const rows = [
    ...Array.from({ length: 12 }, () => sale({ project: "Luma Park Views" })),
    ...Array.from({ length: 10 }, () => sale({ project: "Binghatti Apex" })),
    ...Array.from({ length: 9 }, () => sale({ project: "Tiny Tower" })),
  ];
  const buildings = listBuildings(rows);
  it("lists only buildings with >= 10 resales", () => {
    expect(buildings.map((b) => b.name)).toEqual(["Luma Park Views", "Binghatti Apex"]);
    expect(buildings[0].slug).toBe("luma-park-views");
  });
  it("matches partial names, case-insensitive, any word order", () => {
    expect(searchBuildings(buildings, "luma")[0].name).toBe("Luma Park Views");
    expect(searchBuildings(buildings, "PARK lu")[0].name).toBe("Luma Park Views");
    expect(searchBuildings(buildings, "apex")[0].name).toBe("Binghatti Apex");
    expect(searchBuildings(buildings, "nowhere")).toEqual([]);
  });
  it("slugifies names", () => {
    expect(slugify("OXBRIDGE GARDENS")).toBe("oxbridge-gardens");
  });
});

describe("comps and estimate", () => {
  const unit = { building: "Tower A", rooms: 1, sizeSqm: 80 };

  it("uses same building, rooms, size +-15% when there are enough comps", () => {
    const rows = [
      ...salesAt([15000, 16000, 17000, 18000, 19000]),
      sale({ size_sqm: 100 }), // outside +15%
      sale({ rooms: 2 }),
      sale({ date: "2026-07-31" }), // outside the 3-month window
    ];
    const c = findComps(rows, unit, "2026-10");
    expect(c.level).toBe("building_rooms");
    expect(c.rows).toHaveLength(5);
  });

  it("falls back to building any rooms, then to JVC same rooms", () => {
    const anyRooms = [...salesAt([1, 2, 3], { rooms: 1 }), ...salesAt([4, 5], { rooms: 2, size_sqm: 120 })];
    expect(findComps(anyRooms, unit).level).toBe("building_any");
    const jvc = salesAt([1, 2, 3, 4, 5], { project: "Other" });
    expect(findComps(jvc, unit).level).toBe("jvc_rooms");
  });

  it("estimate = median AED/sqm x size with a P25-P75 range and confidence", () => {
    const rows = salesAt([15000, 16000, 17000, 18000, 19000]);
    const e = estimateValue(rows, unit, "2026-10")!;
    expect(e.mid).toBe(17000 * 80);
    expect(e.low).toBe(16000 * 80);
    expect(e.high).toBe(18000 * 80);
    expect(e.confidence).toBe("medium");
    expect(estimateValue(salesAt(Array(10).fill(15000)), unit)!.confidence).toBe("high");
    expect(estimateValue(salesAt([1, 2, 3, 4, 5], { project: "Other" }), unit)!.confidence).toBe("low");
  });

  it("rolls the 3-month window with the month", () => {
    const rows = [...salesAt(Array(5).fill(10000), { date: "2026-08-10" }), ...salesAt(Array(5).fill(20000))];
    expect(estimateValue(rows, unit, "2026-09")!.perSqm).toBe(10000);
    expect(estimateValue(rows, unit, "2026-10")!.perSqm).toBe(15000);
  });

  it("returns null with no comps at any level", () => {
    expect(estimateValue([], unit)).toBeNull();
  });
});

describe("outlook", () => {
  it("annualises over the gap between window centres", () => {
    expect(annualise(1.1, 12)).toBeCloseTo(0.1);
    expect(annualise(1.05, 6)).toBeCloseTo(0.1025);
  });
  it("widens the lower bound for supply risk and clamps to -20% / +15%", () => {
    const r = outlookRange(0.08, ["2026-01", "2026-03"], ["2026-08", "2026-10"]);
    expect(r.high).toBeCloseTo(0.13);
    expect(r.low).toBeCloseTo(-0.02);
    const hot = outlookRange(0.3, ["2026-01", "2026-03"], ["2026-08", "2026-10"]);
    expect(hot.high).toBe(0.15);
    expect(hot.trend).toBe(0.15);
    const cold = outlookRange(-0.25, ["2026-01", "2026-03"], ["2026-08", "2026-10"]);
    expect(cold.low).toBe(-0.2);
  });
  // Updated on purpose for spec v8 W5: same windows as the momentum reading (May-Jul vs Aug-Oct, 3 months apart).
  it("compares the previous 3 months with the last 3 full months", () => {
    const rows = [
      ...salesAt(Array(5).fill(10000), { date: "2026-06-10", project: "X" }),
      ...salesAt(Array(5).fill(10100), { date: "2026-09-10", project: "Y" }),
      ...salesAt(Array(5).fill(99999), { date: "2026-02-10", project: "Z" }), // Jan-Mar no longer used
    ];
    const o = outlook(rows, "2026-10");
    expect(o.from).toEqual(["2026-05", "2026-07"]);
    expect(o.to).toEqual(["2026-08", "2026-10"]);
    expect(o.trend).toBeCloseTo(Math.pow(1.01, 12 / 3) - 1);
  });
});
