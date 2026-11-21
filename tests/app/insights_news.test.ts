import { describe, expect, it } from "vitest";
import { buyAdvice, headlineOf, liquidityRank, monthlyPerSqm, overallTone, rentAdvice, valuationInsights, type Insight } from "@/lib/insights";
import { buildFeed, dataNews, ILLUSTRATIVE_NEWS, ILLUSTRATIVE_POSTS } from "@/lib/news";
import { activeOrDefault, estimateValue, listBuildings, searchBuildings } from "@/lib/market";
import { loadSnapshot } from "@/lib/data";
import { HERO_BUILDING } from "@/lib/types";
import { rent, sale, salesAt } from "./fixtures";

const ins = (id: Insight["id"], tone: Insight["tone"]): Insight => ({ id, tone, title: "", detail: "", action: "", source: "dld" });

describe("pilot building (V2)", () => {
  const rows = [
    ...Array.from({ length: 12 }, () => sale({ project: "Big Tower" })),
    ...Array.from({ length: 10 }, () => sale({ project: "Pilot" })),
  ];
  const bs = listBuildings(rows, ["Pilot"]);
  it("active building first, others inactive", () => {
    expect(bs.map((b) => [b.name, b.active])).toEqual([["Pilot", true], ["Big Tower", false]]);
    expect(searchBuildings(bs, "t")[0].name).toBe("Pilot");
  });
  it("rent / buy fall back to the active building", () => {
    expect(activeOrDefault(bs, "big-tower").name).toBe("Pilot");
    expect(activeOrDefault(bs, null).name).toBe("Pilot");
    expect(activeOrDefault(bs, "pilot").name).toBe("Pilot");
  });
  it("in the real snapshot only the hero is active", () => {
    const real = loadSnapshot().buildings.filter((b) => b.active).map((b) => b.name);
    expect(real).toEqual([HERO_BUILDING]);
  });
});

describe("insights (V5)", () => {
  it("monthly series leaves gaps under 3 deals", () => {
    const rows = [...salesAt([10000, 11000, 12000], { date: "2026-01-10" }), ...salesAt([9000], { date: "2026-02-10" })];
    const s = monthlyPerSqm(rows, () => true, "2026-01", "2026-03");
    expect(s.map((p) => p.value)).toEqual([11000, null, null]);
    expect(s.map((p) => p.count)).toEqual([3, 1, 0]);
  });

  it("price level: premium vs JVC same bedrooms is 'good'", () => {
    const rows = [
      ...salesAt(Array(5).fill(20000), { project: "Tower A" }),
      ...salesAt(Array(10).fill(15000), { project: "Other" }),
    ];
    const unit = { building: "Tower A", rooms: 1, sizeSqm: 80 };
    const r = valuationInsights(rows, [], unit, estimateValue(rows, unit)!);
    const p = r.insights.find((i) => i.id === "price_level")!;
    expect(p.tone).toBe("good");
    expect(p.title).toMatch(/above JVC/);
  });

  it("liquidity rank counts resales in the last 3 months", () => {
    const rows = [...Array(5).fill(0).map(() => sale({ project: "A" })), ...Array(2).fill(0).map(() => sale({ project: "B" })), sale({ project: "B", date: "2026-01-01" })];
    expect(liquidityRank(rows, "B")).toEqual({ rank: 2, of: 2, deals: 2 });
  });

  it("flags a first-letting wave in a new building", () => {
    const rents = Array.from({ length: 60 }, (_, i) => rent({ registered: i < 40 ? "2026-06-10" : "2026-07-10" }));
    const rows = salesAt(Array(10).fill(15000));
    const unit = { building: "Tower A", rooms: 1, sizeSqm: 80 };
    const r = valuationInsights(rows, rents, unit, estimateValue(rows, unit)!);
    const s = r.insights.find((i) => i.id === "supply")!;
    expect(s.tone).toBe("watch");
    expect(s.detail).toContain("40 in 2026-06");
  });

  it("headline and overall tone", () => {
    expect(headlineOf([ins("price_level", "good"), ins("liquidity", "good"), ins("market", "watch")])).toBe("A strong building in a softening market");
    expect(headlineOf([ins("yield", "watch"), ins("market", "neutral")])).toBe("A building to watch in a flat market");
    expect(overallTone([ins("price_level", "good"), ins("market", "watch")])).toBe("neutral");
  });

  it("every reading on real data has an action and a source", () => {
    const { resales, rents } = loadSnapshot();
    const unit = { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 };
    const r = valuationInsights(resales, rents, unit, estimateValue(resales, unit)!);
    expect(r.insights.length).toBeGreaterThanOrEqual(5);
    expect(r.insights.every((i) => i.action.length > 10 && i.source)).toBe(true);
    expect(r.insights.find((i) => i.id === "supply")).toBeDefined(); // Luma is newly handed over
  });

  it("renter advice by verdict", () => {
    expect(rentAdvice({ verdict: "above", gap: 0.2, annualRent: 96_000, median: 80_000, maxIncrease: 0 }).title).toContain("AED 16K");
    expect(rentAdvice({ verdict: "below", gap: -0.2, annualRent: 64_000, median: 80_000, maxIncrease: 0.1 }).action).toContain("10%");
    expect(rentAdvice({ verdict: "around", gap: 0, annualRent: 80_000, median: 80_000, maxIncrease: null }).tone).toBe("neutral");
  });

  it("buyer advice by position in the range", () => {
    const est = { low: 1_200_000, mid: 1_250_000, high: 1_300_000 };
    expect(buyAdvice(1_400_000, est).title).toMatch(/negotiate/);
    // Updated for spec v8 W10: one money formatter ("AED 1.3M", not "AED 1300K").
    expect(buyAdvice(1_400_000, est).action).toContain("about AED 1.3M");
    expect(buyAdvice(1_100_000, est).title).toMatch(/ask why/);
    expect(buyAdvice(1_250_000, est).tone).toBe("good");
  });
});

describe("news feed (V7, V8)", () => {
  it("data news: record deal and lease count from rows", () => {
    const rows = [
      sale({ date: "2026-05-01", value_aed: 1_200_000 }),
      sale({ date: "2026-10-20", value_aed: 1_300_000 }),
      sale({ date: "2026-10-05", value_aed: 1_250_000 }),
    ];
    const n = dataNews(rows, [rent({}), rent({ annual_aed: 100_000 })], "Tower A", 1, "2026-10");
    expect(n[0].kind).toBe("data");
    const top = n.find((x) => x.id.startsWith("deal-top"))!;
    expect(top.title).toBe("New 2026 high: a 1BR sold for AED 1.3M");
    expect(top.impact).toBe("up");
    expect(n.find((x) => x.id.startsWith("rent-"))!.title).toBe("2 new leases signed (all sizes), median AED 95K a year"); // spec v14 D2: scope named
  });

  it("illustrative items and posts are marked as such; feed is newest first", () => {
    expect(ILLUSTRATIVE_NEWS.every((n) => n.kind === "illustrative")).toBe(true);
    expect(ILLUSTRATIVE_POSTS.every((p) => /verified/.test(p.author))).toBe(true);
    const { resales, rents } = loadSnapshot();
    const feed = buildFeed(resales, rents, HERO_BUILDING, 1);
    expect(feed.some((n) => n.kind === "data")).toBe(true);
    expect([...feed].sort((a, b) => b.date.localeCompare(a.date))).toEqual(feed);
  });
});
