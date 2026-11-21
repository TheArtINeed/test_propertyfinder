import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { estimateValue, MIN_RANGE } from "@/lib/market";
import { buildDigest, nextStep, renewalRiskNote } from "@/lib/digest";
import { valuationInsights } from "@/lib/insights";
import { dataNews } from "@/lib/news";
import { noticeUrgency, NOTICE_URGENT_DAYS } from "@/lib/renter";
import { loadSnapshot } from "@/lib/data";
import { HERO_BUILDING } from "@/lib/types";
import MyHome from "@/app/own/[building]/home/page";
import Rent from "@/app/rent/page";
import { salesAt } from "./fixtures";

const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");
const snap = loadSnapshot();
const unit = { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 };
const home = (q: Record<string, string>) => MyHome({ params: Promise.resolve({ building: "luma-park-views" }), searchParams: Promise.resolve(q) });
const letQ = { unit: "1204", rooms: "1", size: "80", occ: "let", rent: "95000", leaseEnd: "2027-01-31" };

describe("U1: the estimate never sits on the edge of its range", () => {
  it("widens a skewed P25-P75 range to at least +-4% around the median", () => {
    // P75 equals the median: the old range put the estimate on its top edge.
    const e = estimateValue(salesAt([14000, 16000, 16000, 16000, 16000]), unit, "2026-10")!;
    expect(e.mid).toBe(16000 * 80);
    expect(e.high).toBeCloseTo(e.mid * (1 + MIN_RANGE), 6);
    expect(e.low).toBeLessThanOrEqual(e.mid * (1 - MIN_RANGE));
  });
  it("keeps a wide P25-P75 range as it is", () => {
    const e = estimateValue(salesAt([12000, 14000, 16000, 18000, 20000]), unit, "2026-10")!;
    expect(e.low).toBe(14000 * 80);
    expect(e.high).toBe(18000 * 80);
  });
  it("on the snapshot the October top deal for the hero 1BR is inside the range", () => {
    const e = estimateValue(snap.resales, unit)!;
    const top = dataNews(snap.resales, snap.rents, HERO_BUILDING, 1).find((n) => n.id.startsWith("deal-top"))!;
    const topAed = Math.max(...snap.resales.filter((r) => r.project === HERO_BUILDING && r.rooms === 1 && r.date.startsWith("2026-10")).map((r) => r.value_aed));
    expect(top).toBeTruthy();
    expect(topAed).toBeLessThanOrEqual(e.high);
    expect(e.mid - e.low).toBeGreaterThanOrEqual(e.mid * MIN_RANGE - 1);
    expect(e.high - e.mid).toBeGreaterThanOrEqual(e.mid * MIN_RANGE - 1);
  });
});

describe("U2: the two yields are named and match the valuation", () => {
  it("digest market yield equals the valuation reading, and the owner's yield uses their rent", () => {
    const d = buildDigest(snap.resales, snap.rents, unit, { occupancy: "let", annualRent: 95_000 })!;
    const reading = valuationInsights(snap.resales, snap.rents, unit, estimateValue(snap.resales, unit)!).insights.find((r) => r.id === "yield")!;
    expect(reading.detail).toContain(`${(d.yield.market! * 100).toFixed(1)}% at the median new-lease rent`);
    expect(d.yield.unit).toBeCloseTo(95_000 / estimateValue(snap.resales, unit)!.mid, 6);
    expect(d.yield.unit).not.toBeCloseTo(d.yield.market!, 3);
  });
  it("without the owner's rent both yields are the market one", () => {
    const d = buildDigest(snap.resales, snap.rents, unit, { occupancy: "live" })!;
    expect(d.yield.unit).toBe(d.yield.market);
  });
  it("My Home shows both yields with labels", async () => {
    const h = await html(home(letQ));
    expect(h).toContain("On your rent / PropWorth estimate.");
    expect(h).toContain("On today&#x27;s new-lease rent:");
    const live = await html(home({ unit: "1204", rooms: "1", size: "80", occ: "live" }));
    expect(live).toContain("On the median new-lease rent here / PropWorth estimate.");
    expect(live).not.toContain("On today&#x27;s new-lease rent:");
  });
});

describe("U3: owner rent well above new leases is a risk", () => {
  it("warns only above the 10% gap", () => {
    expect(renewalRiskNote(95_000, 80_000, 21)).toMatch(/about AED 15K a year less.*near AED 80K/);
    expect(renewalRiskNote(88_000, 80_000, 21)).toBeNull(); // +10% exactly
    expect(renewalRiskNote(null, 80_000, 21)).toBeNull();
    expect(renewalRiskNote(95_000, 80_000, 0)).toBeNull();
  });
  it("lease ending soon + above market: the next step says to plan at market rent", () => {
    const base = { demandHigh: false, unitYield: null, jvcYield: 0.07 };
    expect(nextStep({ ...base, daysToLeaseEnd: 60, ownerGap: 0.19 }).title).toMatch(/above new leases: plan the re-let at market rent/);
    expect(nextStep({ ...base, daysToLeaseEnd: 60, ownerGap: 0.05 }).title).toBe("Lease ends soon: set your re-let plan");
    expect(nextStep({ ...base, daysToLeaseEnd: 60, ownerGap: 0.19 }).kind).toBe("relet");
  });
  it("My Home shows the warning for the demo owner and not for a market rent", async () => {
    expect(await html(home(letQ))).toContain('data-testid="renewal-risk"');
    expect(await html(home({ ...letQ, rent: "80000" }))).not.toContain('data-testid="renewal-risk"');
  });
  it("the plans card explains the default re-let rent", async () => {
    const h = await html(home(letQ));
    expect(h).toMatch(/New leases here: median AED \d+K a year/);
  });
});

describe("U4: the renter sees an urgent notice deadline", () => {
  it("urgency bounds", () => {
    expect(noticeUrgency(null)).toBeNull();
    expect(noticeUrgency(-1)).toBe("passed");
    expect(noticeUrgency(0)).toBe("urgent");
    expect(noticeUrgency(NOTICE_URGENT_DAYS)).toBe("urgent");
    expect(noticeUrgency(NOTICE_URGENT_DAYS + 1)).toBeNull();
  });
  const rent = (end: string) =>
    html(Rent({ searchParams: Promise.resolve({ go: "1", b: "luma-park-views", rooms: "1", size: "80", rent: "90000", end }) }));
  it("shows the alert 9 days before the deadline (lease ends Feb 28, 2027; today Nov 21, 2026)", async () => {
    const h = await rent("2027-02-28");
    expect(h).toContain('data-testid="notice-urgent"');
    expect(h).toContain("9 days left for renewal notice");
  });
  it("no alert when there is time or the deadline has passed", async () => {
    expect(await rent("2027-06-30")).not.toContain('data-testid="notice-urgent"');
    expect(await rent("2027-01-15")).not.toContain('data-testid="notice-urgent"');
  });
});
