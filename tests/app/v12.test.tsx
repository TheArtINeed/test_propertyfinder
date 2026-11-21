import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { alertsForHome, dealAlert, leaseAlert, newsAlerts, RENT_MOVE, rentMoveAlert } from "@/lib/alerts";
import { buildDigest } from "@/lib/digest";
import { FREQUENCY_LABEL } from "@/lib/owner";
import { EVENT_NAMES } from "@/lib/events";
import { loadSnapshot } from "@/lib/data";
import { HERO_BUILDING } from "@/lib/types";
import Valuation from "@/app/own/[building]/value/page";
import MyHome from "@/app/own/[building]/home/page";
import { readFileSync } from "node:fs";
import { rent, sale } from "./fixtures";

const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");
const unit = { building: "Tower A", rooms: 1, sizeSqm: 80 };
const T = "2026-11-21";

describe("A2: event alerts", () => {
  it("deal alert: the top resale of the month in the building", () => {
    const a = dealAlert([sale({ value_aed: 1_200_000 }), sale({ value_aed: 1_320_000, date: "2026-10-29" }), sale({ project: "Other", value_aed: 9e6 })], "Tower A", "2026-10", "x")!;
    expect(a.title).toBe("New deal in Tower A");
    expect(a.body).toContain("AED 1.32M");
    expect(a.body).toContain("2 resales this month");
    expect(a.date).toBe("2026-10-29");
    expect(dealAlert([], "Tower A", "2026-10", "x")).toBeNull();
  });

  it("rent move fires only above 5% (both directions)", () => {
    const at = (median: number, month: string) => Array.from({ length: 5 }, () => rent({ annual_aed: median, registered: `${month}-10` }));
    const up = [...at(80_000, "2026-06"), ...at(80_000 * (1 + RENT_MOVE + 0.01), "2026-09")];
    expect(rentMoveAlert(up, unit, "2026-10", "x")!.title).toMatch(/^Rents up \+6%/);
    const flat = [...at(80_000, "2026-06"), ...at(80_000 * (1 + RENT_MOVE), "2026-09")];
    expect(rentMoveAlert(flat, unit, "2026-10", "x")).toBeNull();
    const down = [...at(80_000, "2026-06"), ...at(72_000, "2026-09")];
    expect(rentMoveAlert(down, unit, "2026-10", "x")!.title).toMatch(/^Rents down -10%/);
  });

  it("lease milestones: scheduled 90-day, 30-day, ended", () => {
    expect(leaseAlert(null, 80_000, T, "x")).toBeNull();
    const far = leaseAlert("2027-06-30", 80_000, T, "x")!;
    expect(far.title).toBe("Your tenant's lease ends in 3 months");
    expect(far.date).toBe("2027-04-01");
    expect(leaseAlert("2026-12-15", null, T, "x")!.title).toBe("Your tenant's lease ends in a month");
    expect(leaseAlert("2026-12-21", null, T, "x")!.title).toBe("Your tenant's lease ends in a month"); // exactly 30 days
    expect(leaseAlert("2026-11-20", null, T, "x")!.title).toBe("Your lease has ended");
  });

  it("news alerts are illustrative and only for items with a price impact", () => {
    const n = newsAlerts("x");
    expect(n.length).toBeGreaterThan(0);
    expect(n.every((a) => a.illustrative && a.source.startsWith("Illustrative"))).toBe(true);
    expect(n.some((a) => a.title.startsWith("Road works"))).toBe(false);
  });

  it("every alert has push, WhatsApp and email previews, a reason and a source; newest first", () => {
    const { resales, rents } = loadSnapshot();
    const u = { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 };
    const d = buildDigest(resales, rents, u, { occupancy: "let", annualRent: 95_000, leaseEnd: "2027-01-31" })!;
    const list = alertsForHome({ resales, rents, unit: u, unitNumber: "1204", digest: d, leaseEnd: "2027-01-31", marketRent: 80_000, url: "pf.ae/x" });
    expect(list.map((a) => a.kind)).toEqual(expect.arrayContaining(["deal", "lease", "news", "monthly"]));
    for (const a of list) {
      expect(a.push.title && a.push.body && a.email.subject && a.why && a.source).toBeTruthy();
      expect(a.whatsapp).toHaveLength(2);
      expect(a.whatsapp[1]).toContain("pf.ae/x");
    }
    expect([...list].sort((a, b) => b.date.localeCompare(a.date))).toEqual(list);
    expect(list.find((a) => a.kind === "monthly")!.date).toBe("2026-11-01");
    expect(list.find((a) => a.kind === "lease")!.source).toBe("Your lease details");
  });
});

describe("A1, A3 on the pages; A4 vision line", () => {
  const props = (q: Record<string, string>) => ({ params: Promise.resolve({ building: "luma-park-views" }), searchParams: Promise.resolve(q) });
  it("valuation has a 'How we estimate' link", async () => {
    expect(await html(Valuation(props({ unit: "1204", rooms: "1", size: "80" })))).toContain("How we estimate");
  });
  // Updated for spec v14 D2: alerts come after the plans and the numbers; building news moved to the News tab.
  it("My Home shows 'Your alerts' after the plans card and the numbers, plus 'How we estimate'", async () => {
    const h = await html(MyHome(props({ unit: "1204", rooms: "1", size: "80", occ: "let", rent: "95000", leaseEnd: "2027-01-31" })));
    const plans = h.indexOf("What are your plans?");
    const numbers = h.indexOf('data-block="numbers"');
    const alerts = h.indexOf("Your alerts");
    expect(plans).toBeGreaterThan(0);
    expect(numbers).toBeGreaterThan(plans);
    expect(alerts).toBeGreaterThan(numbers);
    expect(h).not.toContain('data-block="news"');
    expect(h).toContain("Your tenant&#x27;s lease ends in 3 months");
    expect(h).toContain("How we estimate");
  });
  it("frequency labels put events first; new events are known", () => {
    expect(FREQUENCY_LABEL.monthly).toBe("Monthly update + important events");
    expect(FREQUENCY_LABEL.big_changes).toBe("Only important events");
    expect(EVENT_NAMES).toEqual(expect.arrayContaining(["method_viewed", "alert_opened"]));
  });
  it("ONE-PAGER has the long-term vision line", () => {
    expect(readFileSync("ONE-PAGER.md", "utf8")).toMatch(/market terminal/);
  });
});
