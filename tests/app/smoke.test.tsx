import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

import Home from "@/app/page";
import Own from "@/app/own/page";
import PickUnit from "@/app/own/[building]/page";
import Valuation from "@/app/own/[building]/value/page";
import MyHome from "@/app/own/[building]/home/page";
import Rent from "@/app/rent/page";
import Buy from "@/app/buy/page";
import Privacy from "@/app/privacy/page";
import EntryPoints from "@/app/entry-points/page";
import { POST } from "@/app/api/events/route";

const hero = "luma-park-views";
const unit = { unit: "1204", rooms: "1", size: "80" };
const props = (building: string, sp: Record<string, string> = {}) => ({
  params: Promise.resolve({ building }),
  searchParams: Promise.resolve(sp),
});
// Strip React's text-node separators so assertions read like the visible text.
const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");

describe("smoke: every route renders for the hero building and has a next action", () => {
  it("/ pitches the product, then gives owner, renter and buyer entries (V3)", async () => {
    const h = await html(<Home />);
    for (const s of ["What you get", "How it works", "Why save it?", "No sign-up to see the value", 'href="/own"', 'href="/rent"', 'href="/buy"', 'href="/entry-points"'])
      expect(h).toContain(s);
  });

  it("/entry-points shows site hooks into each flow (V4)", async () => {
    const h = await html(<EntryPoints />);
    expect(h).toContain("Transactions tab");
    expect(h).toContain('href="/rent"');
    expect(h).toContain("Why it works");
  });

  it("inactive buildings show 'coming soon', not a valuation (V2)", async () => {
    for (const page of [PickUnit, Valuation, MyHome]) {
      const h = await html(page(props("binghatti-apex", unit)));
      expect(h).toContain("is coming soon");
      expect(h).not.toContain("Estimated value");
    }
  });

  it("/rent and /buy offer only the pilot building; others disabled", async () => {
    const h = await html(Buy({ searchParams: Promise.resolve({ b: "binghatti-apex" }) }));
    expect(h).toMatch(/<option value="luma-park-views" selected="">Luma Park Views<\/option>/);
    expect(h).toMatch(/<option value="binghatti-apex" disabled="">Binghatti Apex · coming soon<\/option>/);
  });

  it("My Home tabs: analysis, news, community (V5-V9)", async () => {
    const base = { ...unit, occ: "let", rent: "95000", leaseEnd: "2027-01-31" };
    const a = await html(MyHome(props(hero, { ...base, tab: "analysis" })));
    expect(a).toContain("What this means");
    expect(a).toContain("Median price per m²");
    const n = await html(MyHome(props(hero, { ...base, tab: "news" })));
    expect(n).toContain("News for your home");
    expect(n).toContain("Illustrative example, not a real event");
    expect(n).toContain("DLD / Ejari open data");
    const c = await html(MyHome(props(hero, { ...base, tab: "community" })));
    expect(c).toContain("Verified owners only");
    expect(c).not.toContain("What are your plans?");
  });

  it("/own suggests the hero building", async () => {
    expect(await html(<Own />)).toContain("Luma Park Views");
  });

  it("/own/[building] asks only unit number, rooms, size", async () => {
    const h = await html(PickUnit(props(hero)));
    expect(h).toContain("Unit number");
    expect(h).toContain("See my home");
  });

  it("/own/[building]/value shows estimate, range, deals and the monthly CTA", async () => {
    const h = await html(Valuation(props(hero, unit)));
    expect(h).toMatch(/Estimated value today/);
    expect(h).toMatch(/Range AED/);
    expect(h).toMatch(/Based on \d+ deals/);
    expect(h).toContain("Get this every month");
    expect(h).toContain("not advice");
    expect(h).toContain("What this means");
    expect(h).toContain("Show as table");
  });

  it("/own/[building]/home shows the digest blocks in order and the intent card", async () => {
    const h = await html(MyHome(props(hero, { ...unit, occ: "let", rent: "95000", leaseEnd: "2027-01-31" })));
    const order = ["<h3>Rent</h3>", "<h3>Deals</h3>", "<h3>Demand</h3>", "<h3>Your capital</h3>", "<h3>Next step</h3>"].map((s) => h.indexOf(s));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(h).toContain("October 2026");
    expect(h).toContain("Illustrative");
    expect(h).toContain("What are your plans?");
  });

  it("/rent shows Rent watch, renewal, owner-confirmed, rent vs buy -> /buy", async () => {
    const h = await html(Rent({ searchParams: Promise.resolve({ b: hero, rooms: "1", size: "80", rent: "90000", end: "2027-02-15", ask: "10" }) }));
    for (const s of ["Rent watch", "What this means", "At renewal", "Owner-confirmed", "Rent vs buy", "Rental Dispute Center", 'href="/buy?b=luma-park-views'])
      expect(h).toContain(s);
  });

  it("/rent shows input errors instead of results", async () => {
    const h = await html(Rent({ searchParams: Promise.resolve({ size: "80", rent: "" }) }));
    expect(h).toContain("Enter your annual rent");
    expect(h).not.toContain("Rent watch");
  });

  it("/buy shows fair price, bank gap and 'I bought this' prefilled", async () => {
    const h = await html(Buy({ searchParams: Promise.resolve({ b: hero, rooms: "1", size: "80", price: "1450000" }) }));
    expect(h).toContain("Fair price");
    expect(h).toContain("Bank valuation");
    expect(h).toContain("room to negotiate");
    expect(h).toContain("/own/luma-park-views/value?rooms=1&amp;size=80&amp;paid=1450000&amp;from=buy");
  });

  it("unknown building and missing unit give a next action, not a dead end", async () => {
    expect(await html(Valuation(props("nope", unit)))).toContain("Search again");
    expect(await html(MyHome(props(hero, {})))).toContain("Add unit details");
  });

  it("/privacy renders", async () => {
    expect(await html(<Privacy />)).toContain("delete all your data");
  });
});

describe("POST /api/events", () => {
  const post = (body: unknown) =>
    POST(new Request("http://x/api/events", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
  it("accepts a known event", async () => {
    const r = await post({ name: "lead_submitted", props: { intent: "sell" } });
    expect(r.status).toBe(200);
  });
  it("rejects unknown events and bad JSON", async () => {
    expect((await post({ name: "evil" })).status).toBe(400);
    expect((await post("{not json")).status).toBe(400);
  });
});
