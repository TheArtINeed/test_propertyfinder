import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { DEMO, prefill } from "@/lib/demo";
import { validateClaim, validateUnitForm } from "@/lib/forms";
import { validateLead } from "@/lib/owner";
import PickUnit from "@/app/own/[building]/page";
import MyHome from "@/app/own/[building]/home/page";
import Rent from "@/app/rent/page";
import Buy from "@/app/buy/page";

const html = async (el: ReactElement | Promise<ReactElement>) => renderToString(await el).replaceAll("<!-- -->", "");
const sp = (q: Record<string, string>) => ({ searchParams: Promise.resolve(q) });
const val = (h: string, id: string) => h.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`))?.[1] ?? h.match(new RegExp(`value="([^"]*)"[^>]*id="${id}"`))?.[1];

describe("prefill helper (spec 12)", () => {
  it("demo value on first open, the user's exact input after a submit", () => {
    expect(prefill(false, "", 80)).toBe("80");
    expect(prefill(true, "", 80)).toBe("");
    expect(prefill(true, "75", 80)).toBe("75");
  });
  it("demo values pass every form's validation, so prefilled forms submit as is", () => {
    expect(validateUnitForm({ unit: DEMO.unit, size: String(DEMO.sizeSqm), system: "sqm" }).errors).toEqual({});
    expect(
      validateClaim({ unit: DEMO.unit, occupancy: DEMO.owner.occupancy, rent: String(DEMO.owner.annualRent), leaseEnd: DEMO.owner.leaseEnd, consent: DEMO.owner.consent }),
    ).toEqual({});
    expect(
      validateLead({ intent: "rent_out", askingPrice: 80_000, availableFrom: DEMO.plans.rentOutFrom, contact: DEMO.lead.contact, consent: DEMO.lead.consent }),
    ).toEqual([]);
  });
});

describe("every form opens prefilled and editable", () => {
  it("unit picker: 1204, 1BR, 80 m²", async () => {
    const h = await html(PickUnit({ params: Promise.resolve({ building: DEMO.building }), searchParams: Promise.resolve({}) }));
    expect(val(h, "unit")).toBe("1204");
    expect(val(h, "size")).toBe("80");
    expect(h).toMatch(/aria-pressed="true"[^>]*>1BR</);
    expect(h).not.toMatch(/id="unit"[^>]*readOnly|id="unit"[^>]*disabled/);
  });

  it("/rent: building, 1BR, size, rent, lease end, asked increase; no results before the button", async () => {
    const h = await html(Rent(sp({})));
    expect(val(h, "size")).toBe("80");
    expect(val(h, "rent")).toBe("90000");
    expect(val(h, "end")).toBe("2027-02-28"); // spec v8 W9 (see section 15 note)
    expect(val(h, "ask")).toBe("10");
    expect(h).toMatch(/<option value="1" selected="">1 bedroom/);
    expect(h).toMatch(/<option value="luma-park-views" selected="">/);
    expect(h).not.toContain("Rent watch");
  });

  it("/rent after an empty submit keeps the fields empty and shows errors", async () => {
    const h = await html(Rent(sp({ go: "1", b: DEMO.building, rooms: "1", size: "", rent: "", end: "", ask: "" })));
    expect(val(h, "size")).toBe("");
    expect(val(h, "rent")).toBe("");
    expect(h).toContain("Enter your annual rent");
  });

  it("/rent after a submit shows what the user typed, even if invalid", async () => {
    const h = await html(Rent(sp({ go: "1", size: "abc", rent: "70000" })));
    expect(val(h, "size")).toBe("abc");
    expect(val(h, "rent")).toBe("70000");
  });

  it("/buy: size and asking price", async () => {
    const h = await html(Buy(sp({})));
    expect(val(h, "size")).toBe("80");
    expect(val(h, "price")).toBe("1500000"); // spec v8 W11: matches the ONE-PAGER buyer example
    expect(h).not.toContain("Fair price");
  });

  it("My Home plans card: Rent out from 2027-02-01 at the market rent", async () => {
    const h = await html(
      MyHome({ params: Promise.resolve({ building: DEMO.building }), searchParams: Promise.resolve({ unit: "1204", rooms: "1", size: "80", occ: "let", rent: "95000", leaseEnd: "2027-01-31" }) }),
    );
    expect(h).toMatch(/aria-pressed="true"[^>]*>Rent out</);
    expect(val(h, "i-date")).toBe("2027-02-01");
    expect(Number(val(h, "i-rent"))).toBeGreaterThan(50_000);
  });
});
