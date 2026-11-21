// @vitest-environment happy-dom
/** Spec section 24 (v17): the first screen gives a first-time user a reason to start; a returning owner sees PropWorth first. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import Home from "@/app/page";
import { FirstScreen } from "@/app/components/first-screen";
import { loadSnapshot } from "@/lib/data";
import { buildDigest } from "@/lib/digest";
import { estimateValue } from "@/lib/market";
import { BENEFITS, TRUST_LINE, firstScreenProof } from "@/lib/first-screen";
import { DEMO } from "@/lib/demo";
import { isEventName } from "@/lib/events";
import { DIGEST_MONTH, HERO_BUILDING } from "@/lib/types";
import { HOMES_KEY, homeId, saveHome, type Home as SavedHome } from "@/lib/owner";

const { resales, rents } = loadSnapshot();
const proof = firstScreenProof(resales, rents)!;
const html = () => renderToString(Home()).replaceAll("<!-- -->", "");

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ ok: false }) })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("F10b: live proof card on real data", () => {
  it("numbers equal the valuation and the digest for the demo 1BR", () => {
    const unit = { building: HERO_BUILDING, rooms: DEMO.rooms, sizeSqm: DEMO.sizeSqm };
    const est = estimateValue(resales, unit)!;
    const d = buildDigest(resales, rents, unit, {}, DIGEST_MONTH)!;
    expect(proof.low).toBe(est.low);
    expect(proof.high).toBe(est.high);
    expect(proof.rentMedian).toBe(d.rent.stats.median);
    expect(proof.resales).toBe(d.deals.all.length);
    expect(proof.month).toBe(DIGEST_MONTH);
  });

  it("renders on the first screen with its source", () => {
    const h = html();
    expect(h).toContain('data-testid="proof-card"');
    expect(h).toContain(">Example<");
    expect(h).toContain(`What PropWorth shows for a 1BR in ${HERO_BUILDING}`);
    expect(h).toContain("Real numbers for October 2026, our pilot building in JVC");
    expect(h).toContain("DLD registered resales and Ejari contracts");
  });
});

describe("F10c, F10d: benefits and trust line", () => {
  it("3-4 one-line benefits, no instruction verbs", () => {
    expect(BENEFITS.length).toBeGreaterThanOrEqual(3);
    expect(BENEFITS.length).toBeLessThanOrEqual(4);
    for (const b of BENEFITS) {
      expect(b.text).not.toMatch(/\b(tap|click)\b/i);
      expect(b.text.length).toBeLessThanOrEqual(90);
    }
    const h = html();
    for (const b of BENEFITS) expect(h).toContain(b.text);
  });

  it("trust line appears once, under the actions in the hero", () => {
    const h = html();
    expect(h.split(TRUST_LINE).length - 1).toBe(1);
    const hero = h.slice(h.indexOf('class="hero"'), h.indexOf("</section>"));
    expect(hero.indexOf("Get your PropWorth estimate")).toBeLessThan(hero.indexOf(TRUST_LINE));
  });
});

describe("F10a: D10 cuts are kept", () => {
  it("no long pitch blocks, entry-points link or duplicate destinations", () => {
    const h = html();
    for (const s of ["What you get", "How it works", "Why save it?", "Not an owner?", 'href="/entry-points"']) expect(h).not.toContain(s);
    for (const dest of ['href="/own"', 'href="/rent"', 'href="/buy"']) expect(h.split(dest).length - 1).toBe(1);
  });

  it("first-time screen is short: hero, proof card, one benefits card", () => {
    const h = html();
    const cards = h.match(/class="card[ "]/g) ?? [];
    expect(cards.length).toBe(2);
  });
});

describe("F10e: returning owner sees PropWorth first", () => {
  const saved: SavedHome = {
    id: homeId("luma-park-views", "1204"),
    building: HERO_BUILDING,
    slug: "luma-park-views",
    unitNumber: "1204",
    rooms: 1,
    sizeSqm: 80,
    claimedAt: "2026-11-21",
    verification: "none",
    statusHistory: [],
  };

  it("without homes: value blocks shown, no fold", async () => {
    render(<FirstScreen proof={proof}>hero</FirstScreen>);
    await waitFor(() => expect(screen.getByTestId("proof-card")).toBeTruthy());
    expect(screen.getByTestId("trust-line")).toBeTruthy();
    expect(screen.queryByText(/What PropWorth tracks for you/)).toBeNull();
  });

  it("with homes: PropWorth card above the actions, value folded into one line", async () => {
    saveHome(localStorage, saved);
    expect(localStorage.getItem(HOMES_KEY)).toBeTruthy();
    const { container } = render(<FirstScreen proof={proof}>hero</FirstScreen>);
    await waitFor(() => expect(screen.getByText(/What PropWorth tracks for you/)).toBeTruthy());
    const text = container.innerHTML;
    expect(text.indexOf("My Home · Luma Park Views · 1204")).toBeLessThan(text.indexOf("Open my PropWorth"));
    expect(screen.queryByTestId("trust-line")).toBeNull();
    const fold = container.querySelector("details.fold") as HTMLDetailsElement;
    expect(fold.open).toBe(false);
  });

  it("first_screen_value_expanded is a known event", () => {
    expect(isEventName("first_screen_value_expanded")).toBe(true);
  });
});
