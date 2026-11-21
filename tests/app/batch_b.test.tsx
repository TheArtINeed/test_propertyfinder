import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => "/" }));

import { goldenVisa, GOLDEN_VISA_DLD_URL, monthlyPayment, refinance, refinanceTitle, EXAMPLE_RATE } from "@/lib/finance";
import { combinedPricePaid, urgency } from "@/lib/portfolio";
import { nextStep } from "@/lib/digest";
import { DEMO_OWNER_STATUS, listingState, takenRequests, withStates } from "@/lib/renter";
import { refiAlert } from "@/lib/alerts";
import { parseUnitQuery } from "@/lib/owner";
import { checkFixedRateEnd } from "@/lib/sanity";
import { EVENT_NAMES } from "@/lib/events";
import MyHome from "@/app/own/[building]/home/page";
import Rent from "@/app/rent/page";

const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");
const T = "2026-11-21";

describe("G1: Golden Visa threshold (purchase value per DLD's page)", () => {
  it("thresholds at 1.49M / 1.5M / 1.99M / 2M", () => {
    expect(goldenVisa(1_490_000)).toEqual({ kind: "none" });
    expect(goldenVisa(1_500_000)).toEqual({ kind: "none" }); // gap exactly 25%: not shown
    expect(goldenVisa(1_990_000)).toEqual({ kind: "gap", gap: 10_000 });
    expect(goldenVisa(2_000_000)).toEqual({ kind: "value_above", basis: "estimate" });
  });
  it("price paid of 2M or more: may qualify, whatever the estimate", () => {
    expect(goldenVisa(1_800_000, 2_000_000)).toEqual({ kind: "may_qualify", basis: "price_paid" });
    expect(goldenVisa(2_100_000, 1_900_000)).toEqual({ kind: "value_above", basis: "estimate" });
  });
  it("portfolio: combined price paid only when every home has one", () => {
    expect(combinedPricePaid([{ pricePaid: 1_100_000 }, { pricePaid: 1_000_000 }])).toBe(2_100_000);
    expect(combinedPricePaid([{ pricePaid: 1_100_000 }, {}])).toBeNull();
    expect(combinedPricePaid([])).toBeNull();
  });
  it("My Home shows the line with the DLD link and never says 'you qualify'", async () => {
    const h = await html(MyHome({ params: Promise.resolve({ building: "luma-park-views" }), searchParams: Promise.resolve({ unit: "1707", rooms: "2", size: "119", paid: "1900000" }) }));
    expect(h).toContain('data-testid="golden-visa"');
    expect(h).toContain(GOLDEN_VISA_DLD_URL);
    expect(h).toContain("Check current rules with DLD");
    expect(h).not.toMatch(/you qualify/i);
  });
});

describe("H2: taken units", () => {
  it("listing state for each owner status", () => {
    expect(listingState(undefined)).toEqual({ kind: "available" });
    expect(listingState({ status: "rent_out" })).toEqual({ kind: "available" });
    expect(listingState({ status: "let", at: "2026-11-18" })).toEqual({ kind: "let_agreed", date: "2026-11-18" });
    expect(listingState({ status: "not_now" })).toEqual({ kind: "withdrawn" });
    expect(listingState({ status: "for_sale" })).toEqual({ kind: "withdrawn" });
  });
  it("taken units go last; requested-but-taken are found", () => {
    const units = [{ id: "A" }, { id: "SYN-0020" }, { id: "B" }];
    expect(withStates(units, DEMO_OWNER_STATUS).map((u) => u.id)).toEqual(["A", "B", "SYN-0020"]);
    expect(takenRequests(["A", "SYN-0020"], { A: { kind: "available" }, "SYN-0020": { kind: "let_agreed", date: "x" } })).toEqual(["SYN-0020"]);
  });
  it("/rent shows taken units greyed, with no viewing button", async () => {
    const h = await html(Rent({ searchParams: Promise.resolve({ go: "1", b: "luma-park-views", rooms: "1", size: "80", rent: "90000", end: "2027-02-28" }) }));
    expect(h).toContain("Let agreed · Nov 18, 2026");
    expect(h).toContain("No longer for rent");
    const taken = h.slice(h.indexOf('data-testid="taken-unit"'));
    expect(taken.slice(0, taken.indexOf("</li>"))).not.toContain("<button");
  });
});

describe("H1: refinance", () => {
  it("due at 6 months to the fixed-rate end (not 7), or +0.5 pp above the example rate", () => {
    expect(refinance({ loan: 600_000, fixedRateEnd: "2027-05-21", today: T })!.due).toBe(true); // 6 months
    expect(refinance({ loan: 600_000, fixedRateEnd: "2027-06-21", today: T })!.due).toBe(false); // 7 months
    expect(refinance({ loan: 600_000, mortgageRate: EXAMPLE_RATE + 0.005, today: T })!.due).toBe(true);
    expect(refinance({ loan: 600_000, mortgageRate: EXAMPLE_RATE + 0.0049, today: T })!.due).toBe(false);
  });
  it("no line without loan details", () => {
    expect(refinance({ loan: null, mortgageRate: 0.07, today: T })).toBeNull();
    expect(refinance({ loan: 600_000, today: T })).toBeNull();
  });
  it("saving = annuity at the current rate minus at the example rate, 20 years", () => {
    const r = refinance({ loan: 600_000, mortgageRate: 0.0525, today: T })!;
    expect(r.saving).toBeCloseTo(monthlyPayment(600_000, 0.0525, 20) - monthlyPayment(600_000, EXAMPLE_RATE, 20));
    expect(refinanceTitle(r)).toMatch(/^Your mortgage rate is above today's offers: you could save about AED \d+ a month$/);
    const fixed = refinance({ loan: 600_000, mortgageRate: 0.04, fixedRateEnd: "2027-04-30", today: T })!;
    expect(fixed.saving).toBeNull();
    expect(refinanceTitle(fixed)).toBe("Your fixed rate ends in 5 months: compare mortgage offers");
  });
  it("rule order: a lease ending wins; refinance comes next, before renewal risk and offers", () => {
    const refi = refinance({ loan: 600_000, mortgageRate: 0.06, today: T });
    const base = { ownerGap: 0.3, demandHigh: true, unitYield: 0.05, jvcYield: 0.07, refi };
    expect(nextStep({ ...base, daysToLeaseEnd: 40 }).kind).toBe("relet");
    expect(nextStep({ ...base, daysToLeaseEnd: 300 }).kind).toBe("refinance");
    expect(urgency({ nextStep: { kind: "refinance", title: "", illustrative: false }, daysToLeaseEnd: null })).toBe(3);
  });
  it("alerts at 6 and 3 months before the fixed-rate end", () => {
    expect(refiAlert("2027-06-30", T, "x")!.date).toBe("2026-12-30"); // 6-month alert, scheduled
    expect(refiAlert("2027-01-31", T, "x")!.title).toBe("Your fixed rate ends in 3 months");
    expect(refiAlert("2026-11-01", T, "x")).toBeNull();
  });
  it("mortgage details travel in the URL with sanity limits", () => {
    expect(parseUnitQuery({ rooms: "1", size: "80", rate: "5.25", fixedEnd: "2027-04-30" })).toMatchObject({ mortgageRate: 0.0525, fixedRateEnd: "2027-04-30" });
    expect(parseUnitQuery({ rooms: "1", size: "80", rate: "45", fixedEnd: "2020-01-01" })).toMatchObject({ mortgageRate: null, fixedRateEnd: null });
    expect(checkFixedRateEnd("")).toBeUndefined();
    expect(checkFixedRateEnd("2026-11-20")).toBeDefined();
    expect(checkFixedRateEnd("2036-11-22")).toBeDefined();
  });
  it("owner who lives in the home with a high rate: My Home offers 'Compare mortgage offers'", async () => {
    const h = await html(
      MyHome({ params: Promise.resolve({ building: "luma-park-views" }), searchParams: Promise.resolve({ unit: "1204", rooms: "1", size: "80", occ: "live", loan: "600000", rate: "5.25" }) }),
    );
    expect(h).toMatch(/Your mortgage rate is above today&#x27;s offers: you could save about AED \d+ a month/);
    expect(h).toContain("Compare mortgage offers");
  });
  it("events are known", () => {
    expect(EVENT_NAMES).toEqual(expect.arrayContaining(["golden_visa_viewed", "refi_step_shown", "taken_unit_viewed"]));
  });
});
