// @vitest-environment happy-dom
/**
 * Step 1 of the DOM tests: the PropWorth home counter in a simulated browser.
 * Covers the bugs we only caught by hand: counts drifting between screens and tabs,
 * and the request loop when another tab wrote to storage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { HeroCta, PortfolioPill } from "@/app/components/portfolio";
import { MyHomes } from "@/app/components/client";
import { HOMES_KEY, homeId, saveHome, type Home } from "@/lib/owner";

const home = (unit: string): Home => ({
  id: homeId("luma-park-views", unit),
  building: "Luma Park Views",
  slug: "luma-park-views",
  unitNumber: unit,
  rooms: 1,
  sizeSqm: 80,
  claimedAt: "2026-11-21",
  verification: "none",
  statusHistory: [],
});

/** What another tab does: write storage, then the browser fires "storage" in this tab. */
function otherTabWrites(key: string, value: string) {
  localStorage.setItem(key, value);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      new Response(
        JSON.stringify(
          url.includes("/api/portfolio")
            ? { ok: true, portfolio: { count: 0, low: 0, mid: 0, high: 0, rentIn: null, yield: null, attention: null, lines: [], skipped: [] } }
            : { ok: true },
        ),
      ),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const portfolioCalls = () => fetchMock.mock.calls.filter(([u]) => String(u).includes("/api/portfolio")).length;

describe("home counter in the browser", () => {
  it("no homes: no pill, main button asks for the first estimate", () => {
    render(
      <>
        <PortfolioPill />
        <HeroCta />
      </>,
    );
    expect(screen.queryByText(/PropWorth ·/)).toBeNull();
    expect(screen.getByText("Get your PropWorth estimate, free")).toBeTruthy();
  });

  it("after a save the pill and the main button show 1", () => {
    saveHome(localStorage, home("1204"));
    render(
      <>
        <PortfolioPill />
        <HeroCta />
      </>,
    );
    expect(screen.getByText("PropWorth · 1")).toBeTruthy();
    expect(screen.getByText("Open my PropWorth (1 home)")).toBeTruthy();
  });

  it("saving the same unit again keeps 1", () => {
    saveHome(localStorage, home("1204"));
    saveHome(localStorage, home("1204"));
    render(<PortfolioPill />);
    expect(screen.getByText("PropWorth · 1")).toBeTruthy();
  });

  it("another tab adds and removes a home: this tab follows without navigating", async () => {
    saveHome(localStorage, home("1204"));
    render(<PortfolioPill />);
    expect(screen.getByText("PropWorth · 1")).toBeTruthy();

    otherTabWrites(HOMES_KEY, JSON.stringify([home("1204"), home("1205")]));
    await waitFor(() => expect(screen.getByText("PropWorth · 2")).toBeTruthy());

    otherTabWrites(HOMES_KEY, JSON.stringify([home("1204")]));
    await waitFor(() => expect(screen.getByText("PropWorth · 1")).toBeTruthy());
  });

  it("another tab clears everything: the pill disappears", async () => {
    saveHome(localStorage, home("1204"));
    render(<PortfolioPill />);
    localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    await waitFor(() => expect(screen.queryByText(/PropWorth ·/)).toBeNull());
  });

  it("no request loop: other tabs writing their event log do not trigger new portfolio requests", async () => {
    saveHome(localStorage, home("1204"));
    render(<MyHomes />);
    await waitFor(() => expect(portfolioCalls()).toBe(1));

    for (let i = 0; i < 20; i++) otherTabWrites("pf.events", JSON.stringify([{ name: "x", i }]));
    await new Promise((r) => setTimeout(r, 50));
    expect(portfolioCalls()).toBe(1);

    // A real change to the homes list fetches exactly once more.
    otherTabWrites(HOMES_KEY, JSON.stringify([home("1204"), home("1205")]));
    await waitFor(() => expect(portfolioCalls()).toBe(2));
    await new Promise((r) => setTimeout(r, 50));
    expect(portfolioCalls()).toBe(2);
  });
});
