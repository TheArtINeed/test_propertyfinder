import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { collapseBulkDeals, estimateValue, outlook, OUTLOOK_CAP, OUTLOOK_FLOOR } from "@/lib/market";
import { buildDigest } from "@/lib/digest";
import { valuationInsights } from "@/lib/insights";
import { loadSnapshot } from "@/lib/data";
import { HERO_BUILDING } from "@/lib/types";
import { sale } from "./fixtures";

const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");
const snap = loadSnapshot();
const unit = { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 };

describe("W7: same-day bulk deals count once", () => {
  it("collapses same date + project + price + size, keeps the count", () => {
    const rows = collapseBulkDeals([
      sale({ date: "2026-10-29", value_aed: 1_319_425, size_sqm: 81.83 }),
      sale({ date: "2026-10-29", value_aed: 1_319_425, size_sqm: 81.83 }),
      sale({ date: "2026-10-29", value_aed: 1_319_425, size_sqm: 81.83 }),
      sale({ date: "2026-10-29", value_aed: 1_319_425, size_sqm: 77.89 }), // other size
      sale({ date: "2026-10-30", value_aed: 1_319_425, size_sqm: 81.83 }), // other day
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0].bulkCount).toBe(3);
    expect(rows[1].bulkCount).toBeUndefined();
  });
  it("on the snapshot the hero estimate sits inside its range", () => {
    const e = estimateValue(snap.resales, unit)!;
    expect(e.mid).toBeGreaterThan(e.low);
    expect(e.mid).toBeLessThan(e.high);
  });
});

describe("W5: outlook on the momentum windows", () => {
  it("is not pinned to a clamp on the snapshot", () => {
    const o = outlook(snap.resales);
    expect(o.from).toEqual(["2026-05", "2026-07"]);
    expect(o.low).toBeGreaterThan(OUTLOOK_FLOOR);
    expect(o.high).toBeLessThan(OUTLOOK_CAP);
  });
  it("momentum and market readings use the same months as the outlook", () => {
    const r = valuationInsights(snap.resales, snap.rents, unit, estimateValue(snap.resales, unit)!);
    for (const id of ["momentum", "market"] as const) expect(r.insights.find((i) => i.id === id)!.detail).toContain("May–Jul");
  });
});

describe("W6: no month-on-month value change", () => {
  it("digest compares with 3 months earlier, page says so", async () => {
    const d = buildDigest(snap.resales, snap.rents, unit)!;
    expect(d.capital).toHaveProperty("changeVs3m");
    expect(d.capital).not.toHaveProperty("changeVsPrev");
    const { default: MyHome } = await import("@/app/own/[building]/home/page");
    const h = await html(MyHome({ params: Promise.resolve({ building: "luma-park-views" }), searchParams: Promise.resolve({ unit: "1204", rooms: "1", size: "80" }) }));
    expect(h).not.toContain("vs last month");
    expect(h).toContain("over 3 months");
  });
});

import Home from "@/app/page";
import EntryPoints from "@/app/entry-points/page";
import Rent from "@/app/rent/page";
import { DEMO } from "@/lib/demo";
import { reminderDates, matchOwnerConfirmed } from "@/lib/renter";
import { ownerConfirmedUnits } from "@/lib/data";
import { bulkLabel, sqm } from "@/lib/format";
import { buyAdvice } from "@/lib/insights";
import { readFileSync } from "node:fs";

describe("W1, W2: brief compliance", () => {
  // Updated for spec v14 D10: "What you get" is gone; "I rent" stays in the hero.
  it("'I rent' sits in the first-screen hero", async () => {
    const h = await html(<Home />);
    const hero = h.slice(h.indexOf('class="hero"'), h.indexOf("</section>"));
    expect(hero).toContain('href="/rent">I rent: is my rent fair?');
  });
  it("no 'Why it works' in the app; README lists the entry points", async () => {
    expect(await html(<EntryPoints />)).not.toContain("Why it works");
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toContain("## Where My Home would appear");
    expect(readme).toContain("Transactions tab");
  });
});

describe("W8, W9: renter reach and demo lease end", () => {
  it("any JVC building gives a Rent watch result; no owner-confirmed units outside the pilot", async () => {
    const h = await html(Rent({ searchParams: Promise.resolve({ go: "1", b: "binghatti-apex", rooms: "0", size: "40", rent: "55000" }) }));
    expect(h).toContain("Rent watch");
    expect(h).toMatch(/<option value="binghatti-apex" selected="">Binghatti Apex<\/option>/);
    expect(h).toContain("No owner-confirmed units in Binghatti Apex yet");
    expect(h).not.toContain("Free when your lease ends");
  });
  it("renter select lists every building, enabled", async () => {
    const h = await html(Rent({ searchParams: Promise.resolve({}) }));
    expect(h).not.toContain("coming soon");
    expect(h).toContain('<option value="binghatti-apex">Binghatti Apex</option>');
  });
  it("demo lease end has a future notice date and still matches an owner-confirmed unit", () => {
    expect(reminderDates(DEMO.renter.leaseEnd, "2026-11-21").every((d) => !d.past)).toBe(true);
    expect(matchOwnerConfirmed(ownerConfirmedUnits(), DEMO.renter.leaseEnd).some((u) => u.matched)).toBe(true);
  });
});

describe("W10-W12: formatting", () => {
  it("buyer advice uses the compact money format", () => {
    expect(buyAdvice(1_500_000, { low: 1_210_000, mid: 1_270_000, high: 1_290_000 }).action).toContain("about AED 1.29M");
  });
  it("sizes rounded, bulk label only for N > 1", () => {
    expect(sqm(77.89)).toBe("78 m²");
    expect(bulkLabel(3)).toBe(" · same-day bulk deal (3 units)");
    expect(bulkLabel(1)).toBe("");
    expect(bulkLabel()).toBe("");
  });
  it("demo asking price matches the ONE-PAGER buyer example", () => {
    expect(DEMO.buyer.asking).toBe(1_500_000);
    expect(readFileSync("ONE-PAGER.md", "utf8")).toMatch(/AED 1\.5M/);
  });
});

import Valuation from "@/app/own/[building]/value/page";
import { marketMoves, updatePreview } from "@/lib/news";

describe("V18: monthly-update preview on the valuation", () => {
  const page = () => html(Valuation({ params: Promise.resolve({ building: "luma-park-views" }), searchParams: Promise.resolve({ unit: "1204", rooms: "1", size: "80" }) }));
  it("sits right above 'Get this every month' with 3 lines and their labels", async () => {
    const h = await page();
    const card = h.indexOf("Every month you&#x27;ll also get");
    const cta = h.indexOf("Get this every month");
    expect(card).toBeGreaterThan(0);
    expect(card).toBeLessThan(cta);
    const block = h.slice(card, cta);
    expect(block).toContain("DLD / Ejari open data");
    expect(block).toContain("Illustrative example, not a real event");
    expect(block).toContain("A reminder 90 days before your lease ends");
    expect(block).toMatch(/(Up|Down): /);
  });
  it("line 1 is the real top deal from the same function as My Home", () => {
    const p = updatePreview(snap.resales, snap.rents, HERO_BUILDING, 1);
    const same = marketMoves(snap.resales, snap.rents, HERO_BUILDING, 1).find((n) => n.id === p.move!.id)!;
    expect(p.move!.kind).toBe("data");
    expect(p.move!.title).toBe(same.title);
    expect(p.news.kind).toBe("illustrative");
  });
  it("no full news block on the valuation", async () => {
    const h = await page();
    expect(h).not.toContain("Building and area news");
    expect(h).not.toContain('data-block="news"');
  });
});
