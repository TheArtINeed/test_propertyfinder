// @vitest-environment happy-dom
/** Spec v15 H2: a renter who requested a viewing sees when that unit is taken. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}"))));

import { OwnerConfirmedList } from "@/app/components/leads";
import { VIEWINGS_KEY } from "@/lib/renter";

const unit = (id: string, matched: boolean, state: never) => ({ id, bedrooms: 1, sizeSqm: 73, annualRent: 72_000, availableFrom: "2027-01-30", matched, daysFromLeaseEnd: 0, state });

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("taken units in the renter list", () => {
  it("requested unit now let: notice with the number of similar free units", async () => {
    localStorage.setItem(VIEWINGS_KEY, JSON.stringify(["T1"]));
    render(
      <OwnerConfirmedList
        leaseEnd="2027-02-28"
        units={[unit("A1", true, { kind: "available" } as never), unit("T1", false, { kind: "let_agreed", date: "2026-11-18" } as never)]}
      />,
    );
    expect(await screen.findByTestId("taken-request")).toBeTruthy();
    expect(screen.getByTestId("taken-request").textContent).toContain("A unit you asked to view is now let. 1 similar unit is free around your lease end.");
  });

  it("nothing requested: no notice; taken card has no button", () => {
    render(<OwnerConfirmedList leaseEnd={null} units={[unit("T1", false, { kind: "withdrawn" } as never)]} />);
    expect(screen.queryByTestId("taken-request")).toBeNull();
    expect(screen.getByTestId("taken-unit").querySelector("button")).toBeNull();
    expect(screen.getByText("No longer for rent")).toBeTruthy();
  });
});
