import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

import { loadSnapshot } from "@/lib/data";
import { buildDigest } from "@/lib/digest";
import { parsePortfolioHomes, portfolioSummary, urgency, type PortfolioHome } from "@/lib/portfolio";
import { isEventName } from "@/lib/events";
import { SOURCES, AS_OF, HERO_BUILDING } from "@/lib/types";
import { POST } from "@/app/api/portfolio/route";
import Home from "@/app/page";
import Valuation from "@/app/own/[building]/value/page";

const { resales, rents } = loadSnapshot();
const slug = "luma-park-views";
const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");

const oneBr: PortfolioHome = { id: "a", slug, unitNumber: "1204", rooms: 1, sizeSqm: 80, occupancy: "let", annualRent: 95_000, leaseEnd: "2027-01-31" };
const twoBr: PortfolioHome = { id: "b", slug, unitNumber: "1707", rooms: 2, sizeSqm: 119, occupancy: "live" };
const digestOf = (h: PortfolioHome) => buildDigest(resales, rents, { building: HERO_BUILDING, rooms: h.rooms, sizeSqm: h.sizeSqm }, h)!;

describe("W14: PropWorth summary across homes", () => {
  it("with one home, the summary equals that home's digest", () => {
    const p = portfolioSummary(resales, rents, [oneBr]);
    const d = digestOf(oneBr);
    expect(p.count).toBe(1);
    expect([p.low, p.mid, p.high]).toEqual([d.capital.low, d.capital.value, d.capital.high]);
    expect(p.rentIn).toBe(95_000);
    expect(p.yield).toBeCloseTo(95_000 / d.capital.value, 10);
  });

  it("with two homes, values add up; rent and yield count only the let home", () => {
    const p = portfolioSummary(resales, rents, [oneBr, twoBr]);
    const a = digestOf(oneBr);
    const b = digestOf(twoBr);
    expect(p.count).toBe(2);
    expect(p.low).toBeCloseTo(a.capital.low + b.capital.low, 6);
    expect(p.mid).toBeCloseTo(a.capital.value + b.capital.value, 6);
    expect(p.high).toBeCloseTo(a.capital.high + b.capital.high, 6);
    expect(p.rentIn).toBe(95_000);
    expect(p.yield).toBeCloseTo(95_000 / a.capital.value, 10);
  });

  it("no let home: rent in and yield are null", () => {
    const p = portfolioSummary(resales, rents, [twoBr]);
    expect(p.rentIn).toBeNull();
    expect(p.yield).toBeNull();
  });

  it("needs attention: an ended lease beats a lease ending soon", () => {
    const soon = { ...oneBr, id: "soon", leaseEnd: "2027-01-31" }; // ~71 days after AS_OF
    const ended = { ...oneBr, id: "ended", unitNumber: "0901", leaseEnd: "2026-10-29" };
    const p = portfolioSummary(resales, rents, [soon, ended]);
    expect(p.attention?.id).toBe("ended");
    expect(p.attention?.nextStep.kind).toBe("relet");
    expect(p.attention?.nextStep.title).toMatch(/re-let now/i);
  });

  it("needs attention: of two soon-ending leases the nearer one wins", () => {
    const later = { ...oneBr, id: "later", leaseEnd: "2027-02-15" };
    const nearer = { ...oneBr, id: "nearer", leaseEnd: "2026-12-31" };
    expect(portfolioSummary(resales, rents, [later, nearer]).attention?.id).toBe("nearer");
  });

  it("urgency ranks relet (ended) < relet < renewal risk < offers; keep is not urgent", () => {
    const step = (kind: "relet" | "renewal_risk" | "open_to_offers" | "keep") => ({ kind, title: "", illustrative: false });
    expect(urgency({ nextStep: step("relet"), daysToLeaseEnd: -1 })).toBe(0);
    expect(urgency({ nextStep: step("relet"), daysToLeaseEnd: 30 })).toBe(1);
    expect(urgency({ nextStep: step("renewal_risk"), daysToLeaseEnd: 300 })).toBe(2);
    expect(urgency({ nextStep: step("open_to_offers"), daysToLeaseEnd: null })).toBe(3);
    expect(urgency({ nextStep: step("keep"), daysToLeaseEnd: null })).toBeNull();
  });

  it("skips homes in unknown buildings and keeps the rest", () => {
    const p = portfolioSummary(resales, rents, [oneBr, { ...twoBr, id: "x", slug: "nope" }]);
    expect(p.count).toBe(1);
    expect(p.skipped).toEqual(["x"]);
  });

  it("parsePortfolioHomes validates the body", () => {
    expect(parsePortfolioHomes({})).toBe("homes must be an array");
    expect(parsePortfolioHomes({ homes: Array(21).fill(oneBr) })).toBe("too many homes");
    expect(parsePortfolioHomes({ homes: [{ ...oneBr, rooms: 7 }] })).toBe("rooms must be 0-3");
    expect(parsePortfolioHomes({ homes: [{ ...oneBr, sizeSqm: 5 }] })).toBe("size must be 15-1,500 m²");
    const ok = parsePortfolioHomes({ homes: [{ ...oneBr, annualRent: -5, occupancy: "weird" }] });
    expect(Array.isArray(ok) && ok[0].annualRent).toBeNull();
    expect(Array.isArray(ok) && ok[0].occupancy).toBeUndefined();
  });

  it("POST /api/portfolio returns the summary and rejects bad input", async () => {
    const good = await POST(new Request("http://x/api/portfolio", { method: "POST", body: JSON.stringify({ homes: [oneBr, twoBr] }) }));
    const j = await good.json();
    expect(good.status).toBe(200);
    expect(j.portfolio.count).toBe(2);
    const bad = await POST(new Request("http://x/api/portfolio", { method: "POST", body: "not json" }));
    expect(bad.status).toBe(400);
  });

  it("portfolio_viewed is a known event", () => {
    expect(isEventName("portfolio_viewed")).toBe(true);
  });

  it("uses the prototype's fixed today", () => {
    expect(AS_OF).toBe("2026-11-21");
  });
});

describe("W13: PropWorth is named in the UI", () => {
  it("the value source label is 'PropWorth estimate'", () => {
    expect(SOURCES.estimate).toBe("PropWorth estimate");
  });

  it("first screen CTA asks for the PropWorth estimate", async () => {
    expect(await html(Home())).toContain("Get your PropWorth estimate");
  });

  it("valuation names the PropWorth estimate", async () => {
    const h = await html(Valuation({ params: Promise.resolve({ building: slug }), searchParams: Promise.resolve({ unit: "1204", rooms: "1", size: "80" }) }));
    expect(h).toContain("PropWorth estimate today");
    expect(h).not.toContain("PF estimate");
  });

  it("no 'PF estimate' left in app or lib sources", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) ? [p] : [];
      });
    const hits = [...walk("app"), ...walk("lib")].filter((f) => readFileSync(f, "utf8").includes("PF estimate"));
    expect(hits).toEqual([]);
  });
});
