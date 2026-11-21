import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { buildDigest, digestMessage, nextStep } from "@/lib/digest";
import { leadStatus, nextUpdateDate } from "@/lib/owner";
import { areaNews, DATA_SOURCE, ILLUSTRATIVE_LABEL, marketMoves } from "@/lib/news";
import { matchOwnerConfirmed, reminderDates, validateContact } from "@/lib/renter";
import { loadSnapshot } from "@/lib/data";
import { EVENT_NAMES } from "@/lib/events";
import { HERO_BUILDING } from "@/lib/types";
import MyHome from "@/app/own/[building]/home/page";
import Rent from "@/app/rent/page";
import Buy from "@/app/buy/page";

const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");
const unitQ = { unit: "1204", rooms: "1", size: "80", occ: "let", rent: "95000", leaseEnd: "2027-01-31" };
const home = (q: Record<string, string>) => MyHome({ params: Promise.resolve({ building: "luma-park-views" }), searchParams: Promise.resolve(q) });

describe("F1: next-step rule order", () => {
  it("an ended lease wins over 'rent above market'", () => {
    const s = nextStep({ daysToLeaseEnd: -5, ownerGap: 0.3, demandHigh: true, unitYield: 0.05, jvcYield: 0.07 });
    expect(s.kind).toBe("relet");
    expect(s.title).toMatch(/ended: re-let now/);
    expect(nextStep({ daysToLeaseEnd: 0, ownerGap: 0.3, demandHigh: false, unitYield: null, jvcYield: 0.07 }).title).toMatch(/ends soon/);
  });
});

describe("V11, V12: subscription and WhatsApp message", () => {
  it("next update is the 1st of next month", () => {
    expect(nextUpdateDate("2026-11-21")).toBe("2026-12-01");
    expect(nextUpdateDate("2026-12-31")).toBe("2027-01-01");
  });
  it("the WhatsApp text uses the digest's own numbers, in 3 lines", () => {
    const { resales, rents } = loadSnapshot();
    const d = buildDigest(resales, rents, { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 }, { occupancy: "let", annualRent: 95_000, leaseEnd: "2027-01-31" })!;
    const lines = digestMessage(d, HERO_BUILDING, "1204", "pf.ae/x");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("October");
    expect(lines[1]).toContain(`${d.deals.all.length} resales`);
    expect(lines[1]).toContain(`${d.rent.stats.count} new leases`);
    expect(lines[2]).toContain(d.nextStep.title);
  });
  // Updated for spec v14 D2: the WhatsApp preview moved from the Update tab into the update settings ("Change").
  it("the WhatsApp preview is not repeated in the Update tab", async () => {
    expect(await html(home(unitQ))).not.toContain("How it arrives on WhatsApp");
  });
});

describe("N1, N2: news apart from the numbers", () => {
  // Updated for spec v14 D2: Update has the numbers only; market moves and building news live in the News tab.
  it("Update tab: no news and no market moves; News tab: both sections, news never inside the numbers", async () => {
    const h = await html(home(unitQ));
    expect(h).toContain('data-block="numbers"');
    for (const n of areaNews()) expect(h).not.toContain(n.title);
    expect(h).not.toContain("Market moves");
    const news = await html(home({ ...unitQ, tab: "news" }));
    const numbersStart = news.indexOf('data-block="numbers"');
    const newsStart = news.indexOf('data-block="news"');
    expect(newsStart).toBeGreaterThan(numbersStart);
    expect(news.slice(numbersStart, newsStart)).toContain("Market moves");
    for (const n of areaNews()) expect(news.slice(numbersStart, newsStart)).not.toContain(n.title);
    expect(news.slice(newsStart)).toContain("Building and area news");
  });
  it("every item has date, source, impact and the right label", () => {
    const { resales, rents } = loadSnapshot();
    const moves = marketMoves(resales, rents, HERO_BUILDING, 1);
    expect(moves.length).toBeGreaterThan(0);
    for (const n of moves) expect([n.kind, n.source]).toEqual(["data", DATA_SOURCE]);
    for (const n of areaNews()) expect([n.kind, n.source]).toEqual(["illustrative", ILLUSTRATIVE_LABEL]);
    for (const n of [...moves, ...areaNews()]) {
      expect(n.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["up", "down", "neutral"]).toContain(n.impact);
      expect(n.impactText.length).toBeGreaterThan(3);
    }
  });
  it("impact shows an icon and a word, not color alone", async () => {
    const h = await html(home({ ...unitQ, tab: "news" }));
    expect(h).toMatch(/Down: East-facing/);
    expect(h).toMatch(/Up: More demand/);
  });
});

describe("V13, V14, V15: renter loop", () => {
  const units = [
    { id: "a", bedrooms: 1, sizeSqm: 75, annualRent: 80_000, availableFrom: "2027-03-20" },
    { id: "b", bedrooms: 1, sizeSqm: 75, annualRent: 80_000, availableFrom: "2027-01-16" }, // -30 days
    { id: "c", bedrooms: 1, sizeSqm: 75, annualRent: 80_000, availableFrom: "2027-03-17" }, // +30 days
    { id: "d", bedrooms: 1, sizeSqm: 75, annualRent: 80_000, availableFrom: "2027-01-15" }, // -31 days
  ];
  it("match window is +-30 days, inclusive; matches first, closest first", () => {
    const m = matchOwnerConfirmed(units, "2027-02-15");
    expect(m.filter((u) => u.matched).map((u) => u.id)).toEqual(["b", "c"]);
    expect(m.map((u) => u.id)).toEqual(["b", "c", "d", "a"]);
    expect(matchOwnerConfirmed(units, null).every((u) => !u.matched)).toBe(true);
  });
  it("reminders 90 and 30 days before the lease end", () => {
    expect(reminderDates("2027-02-15", "2026-11-21")).toEqual([
      { daysBefore: 90, date: "2026-11-17", past: true },
      { daysBefore: 30, date: "2027-01-16", past: false },
    ]);
  });
  it("viewing / contact request needs channel, a valid date and consent", () => {
    expect(validateContact({ channel: "whatsapp", date: "2027-02-15", needsDate: true, consent: true })).toEqual({});
    expect(Object.keys(validateContact({ channel: null, date: "2020-01-01", needsDate: true, consent: false })).sort()).toEqual([
      "channel", "consent", "date",
    ]);
  });
  it("/rent shows reminders and the matched unit first, clickable", async () => {
    const h = await html(Rent({ searchParams: Promise.resolve({ go: "1", b: "luma-park-views", rooms: "1", size: "80", rent: "90000", end: "2027-02-15" }) }));
    expect(h).toContain("Remind me before renewal");
    expect(h).toContain("Watch rents in Luma Park Views");
    expect(h).toContain("Free when your lease ends");
    expect(h.indexOf("Free when your lease ends")).toBeLessThan(h.indexOf("Request ›", h.indexOf("Free when your lease ends") + 1) + 1);
    expect(h).toMatch(/<button class="unit-card match"/);
  });
});

describe("V16, V17: handoff and buyer next step", () => {
  it("request is Sent, then Accepted after 2 hours", () => {
    expect(leadStatus("2026-11-21T10:00:00Z", "2026-11-21T11:59:59Z")).toBe("sent");
    expect(leadStatus("2026-11-21T10:00:00Z", "2026-11-21T12:00:00Z")).toBe("accepted");
  });
  it("/buy offers mortgage pre-approval and an agent", async () => {
    const h = await html(Buy({ searchParams: Promise.resolve({ go: "1", b: "luma-park-views", rooms: "1", size: "80", price: "1450000" }) }));
    expect(h).toContain("Get mortgage pre-approval");
    expect(h).toContain("Ask an agent about this unit");
  });
  it("all v7 events are known to the API", () => {
    for (const e of ["digest_subscribed", "renter_reminder_set", "renter_lead_submitted", "lead_status_viewed", "mortgage_lead_submitted", "buyer_lead_submitted", "news_opened"])
      expect(EVENT_NAMES).toContain(e);
  });
});
