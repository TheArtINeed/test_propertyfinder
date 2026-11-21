import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { addHomePath, afterSavePath, homeId, nextFreeUnit } from "@/lib/owner";
import { sortByUrgency } from "@/lib/portfolio";
import { EVENT_NAMES } from "@/lib/events";
import Home from "@/app/page";
import Own from "@/app/own/page";
import PropWorthPage from "@/app/propworth/page";

const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");
const step = (kind: string, days: number | null = null) => ({ nextStep: { kind, title: kind, illustrative: false } as never, daysToLeaseEnd: days });

describe("P4: adding never overwrites a saved home", () => {
  it("suggests the next free unit number", () => {
    const slug = "luma-park-views";
    expect(nextFreeUnit([], slug, "1204")).toBe("1204");
    expect(nextFreeUnit([{ id: homeId(slug, "1204") }], slug, "1204")).toBe("1205");
    expect(nextFreeUnit([{ id: homeId(slug, "1204") }, { id: homeId(slug, "1205") }], slug, "1204")).toBe("1206");
    expect(nextFreeUnit([{ id: homeId("other", "1204") }], slug, "1204")).toBe("1204");
  });
  it("after saving: back to /propworth when started there, else to the new home", () => {
    expect(afterSavePath("propworth", "luma#1205", "/own/x/home")).toBe("/propworth?added=luma%231205");
    expect(afterSavePath(null, "luma#1205", "/own/x/home")).toBe("/own/x/home");
  });
});

describe("P3: add-a-home chooser", () => {
  it("only a pilot apartment goes to the valuation; everything else is coming soon", () => {
    expect(addHomePath("apartment", "pilot")).toEqual({ kind: "valuation", href: "/own/luma-park-views?from=propworth" });
    expect(addHomePath("villa", "pilot").kind).toBe("coming_soon");
    expect(addHomePath("apartment", "other").kind).toBe("coming_soon");
    expect(addHomePath("office", "other").kind).toBe("coming_soon");
  });
});

describe("P1: portfolio order", () => {
  it("ended lease, then lease ending, renewal risk, offers; calm homes keep their order", () => {
    const lines = [step("keep"), step("open_to_offers"), step("relet", 40), step("renewal_risk"), step("relet", -3), step("keep")];
    expect(sortByUrgency(lines).map((l) => `${(l.nextStep as { kind: string }).kind}${l.daysToLeaseEnd ?? ""}`)).toEqual([
      "relet-3", "relet40", "renewal_risk", "open_to_offers", "keep", "keep",
    ]);
  });
});

describe("P9: visible from the start", () => {
  // Superseded by spec v14 D10: no empty PropWorth card and no benefit line; the card shows only when homes exist.
  it("first screen with no homes: no PropWorth card, no benefit list", async () => {
    const h = await html(<Home />);
    expect(h).not.toContain('id="propworth"');
    expect(h).not.toContain("All your homes in one PropWorth");
  });
});

describe("P2, P4: links and add context", () => {
  it("/propworth renders its heading", async () => {
    const h = await html(<PropWorthPage />);
    expect(h).toContain("Your PropWorth");
    expect(h).toContain("All your homes in one place");
  });
  it("/own?from=propworth says it is adding to the portfolio and keeps the context", async () => {
    const h = await html(Own({ searchParams: Promise.resolve({ from: "propworth" }) }));
    expect(h).toContain("Add a home to your PropWorth");
    expect(h).toContain('href="/own/luma-park-views?from=propworth"');
    const plain = await html(Own({ searchParams: Promise.resolve({}) }));
    expect(plain).toContain('href="/own/luma-park-views"');
  });
  it("new events are known", () => {
    expect(EVENT_NAMES).toEqual(expect.arrayContaining(["portfolio_opened", "home_add_started"]));
  });
});

import { SavedBanner } from "@/app/components/portfolio";

describe("P11: ask for more homes after the save", () => {
  it("the post-save banner offers both 'See all homes' and '+ Add another home'", async () => {
    const h = await html(<SavedBanner count={1} />);
    expect(h).toContain("Saved to your PropWorth");
    expect(h).toContain("1 home");
    expect(h).toContain('href="/propworth"');
    expect(h).toContain("+ Add another home");
  });
  it("no extra step before saving: the save sheet only mentions it", () => {
    const src = readFileSync("app/components/client.tsx", "utf8");
    expect(src).toContain("Own more homes? You can add them next.");
  });
});
import { readFileSync } from "node:fs";

import { portfolioCount, unvaluedIds } from "@/lib/portfolio";

describe("one count everywhere: saved homes", () => {
  it("label counts saved homes; a note says which part is valued", () => {
    expect(portfolioCount(1, 1)).toEqual({ label: "1 home", valueNote: null });
    expect(portfolioCount(2, 2)).toEqual({ label: "2 homes", valueNote: null });
    expect(portfolioCount(2, 1)).toEqual({ label: "2 homes", valueNote: "Value for 1 of 2 homes; the others are not valued yet" });
  });
  it("homes the summary could not value are listed, not dropped", () => {
    expect(unvaluedIds(["a", "b", "c"], { lines: [{ id: "a" }, { id: "c" }] as never })).toEqual(["b"]);
    expect(unvaluedIds(["a"], null)).toEqual([]);
  });
  it("the portfolio API keeps unknown buildings in 'skipped', so the UI can show them", async () => {
    const { POST } = await import("@/app/api/portfolio/route");
    const res = await POST(
      new Request("http://x/api/portfolio", {
        method: "POST",
        body: JSON.stringify({
          homes: [
            { id: "luma-park-views#1204", slug: "luma-park-views", unitNumber: "1204", rooms: 1, sizeSqm: 80 },
            { id: "other-jvc#7", slug: "other-jvc", unitNumber: "7", rooms: 1, sizeSqm: 80 },
          ],
        }),
      }),
    );
    const j = await res.json();
    expect(j.portfolio.count).toBe(1);
    expect(j.portfolio.skipped).toEqual(["other-jvc#7"]);
  });
});

import { isHomesChange } from "@/app/components/use-homes";
import { HOMES_KEY } from "@/lib/owner";

describe("no refresh loop between tabs", () => {
  it("only a change to the homes list (or a full clear) triggers a re-read; the event log does not", () => {
    expect(isHomesChange(HOMES_KEY)).toBe(true);
    expect(isHomesChange(null)).toBe(true);
    expect(isHomesChange("pf.events")).toBe(false);
    expect(isHomesChange("pf.helpful")).toBe(false);
  });
  it("tracking calls are guarded to once per screen", () => {
    const client = readFileSync("app/components/client.tsx", "utf8");
    const portfolio = readFileSync("app/components/portfolio.tsx", "utf8");
    expect(client).toMatch(/if \(!viewedLogged\.current\)/);
    expect(portfolio).toMatch(/if \(!openedLogged\.current\)/);
  });
});
