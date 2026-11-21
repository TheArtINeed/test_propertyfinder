import { describe, expect, it } from "vitest";
import { loadRawSales, loadSnapshot, ownerConfirmedUnits } from "@/lib/data";
import { estimateValue, isResale, monthOf, outlook } from "@/lib/market";
import { buildDigest } from "@/lib/digest";
import { DIGEST_MONTH, HERO_BUILDING, MIN_BUILDING_RESALES } from "@/lib/types";

const snap = loadSnapshot();

describe("DLD snapshot", () => {
  it("resale filter excludes Delayed Sell, off-plan and lease-to-own", () => {
    const raw = loadRawSales();
    expect(raw.some((r) => r.procedure === "Delayed Sell")).toBe(true);
    expect(snap.resales.every((r) => r.procedure === "Sale" && !r.off_plan)).toBe(true);
    expect(snap.resales.length).toBeLessThanOrEqual(raw.filter(isResale).length);
    expect(snap.resales.length).toBeGreaterThan(3000);
  });

  it("hero building has >= 50 resales and >= 200 contracts", () => {
    expect(snap.resales.filter((r) => r.project === HERO_BUILDING).length).toBeGreaterThanOrEqual(50);
    expect(snap.rents.filter((r) => r.project === HERO_BUILDING).length).toBeGreaterThanOrEqual(200);
  });

  it("every building in search has >= 10 resales", () => {
    expect(snap.buildings.length).toBeGreaterThan(20);
    expect(snap.buildings.every((b) => b.resales >= MIN_BUILDING_RESALES)).toBe(true);
    expect(snap.buildings.some((b) => b.name === HERO_BUILDING)).toBe(true);
  });

  it("October 2026 (M) is fully covered, with no week without rows", () => {
    for (const dates of [snap.resales.map((r) => r.date), snap.rents.map((r) => r.registered)]) {
      const oct = dates.filter((d) => monthOf(d) === DIGEST_MONTH);
      expect(oct.some((d) => d >= "2026-10-29")).toBe(true);
      for (let start = 1; start <= 25; start += 7) {
        const from = `2026-10-${String(start).padStart(2, "0")}`;
        const to = `2026-10-${String(Math.min(start + 6, 31)).padStart(2, "0")}`;
        expect(oct.some((d) => d >= from && d <= to), `${from}..${to}`).toBe(true);
      }
    }
  });

  it("hero 1BR gets a building-level estimate and a full digest", () => {
    const unit = { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 };
    const e = estimateValue(snap.resales, unit)!;
    expect(e.low).toBeLessThanOrEqual(e.mid);
    expect(e.mid).toBeLessThanOrEqual(e.high);
    expect(e.mid).toBeGreaterThan(800_000);
    expect(e.mid).toBeLessThan(2_500_000);
    const d = buildDigest(snap.resales, snap.rents, unit)!;
    expect(d.rent.stats.count).toBeGreaterThan(0);
    expect(d.yield.jvcMedian).toBeGreaterThan(0.04);
    expect(d.yield.jvcMedian).toBeLessThan(0.12);
    const o = outlook(snap.resales);
    expect(o.low).toBeLessThan(o.high);
  });

  it("owner-confirmed cards come from synthetic JVC rentals", () => {
    const units = ownerConfirmedUnits();
    expect(units.length).toBeGreaterThan(0);
    expect(units.every((u) => u.annualRent > 0 && u.availableFrom)).toBe(true);
  });
});
