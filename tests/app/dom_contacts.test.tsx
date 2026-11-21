// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ContactSheet } from "@/app/components/leads";
import { buildLead, contactsLabel, toggleIn, CONTACT_ORDER, type Home } from "@/lib/owner";
import { DEMO } from "@/lib/demo";

vi.mock("@/lib/track", () => ({ track: vi.fn() }));
afterEach(cleanup);

describe("contact channels: several at once, all preselected", () => {
  it("toggleIn keeps the order and never empties the list", () => {
    expect(toggleIn(["whatsapp"], "email", CONTACT_ORDER)).toEqual(["whatsapp", "email"]);
    expect(toggleIn(["email"], "whatsapp", CONTACT_ORDER)).toEqual(["whatsapp", "email"]);
    expect(toggleIn(["call"], "call", CONTACT_ORDER)).toEqual(["call"]);
  });
  it("labels read as a sentence", () => {
    expect(contactsLabel(["whatsapp", "call", "email"])).toBe("WhatsApp, call or email");
    expect(contactsLabel(["email"])).toBe("Email");
  });
  it("demo preselects every channel", () => {
    expect(DEMO.lead.contacts).toEqual(CONTACT_ORDER);
    expect(DEMO.viewing.channels).toEqual(CONTACT_ORDER);
    expect([...DEMO.subscription.channels].sort()).toEqual(["email", "in_app", "whatsapp"]);
  });
  it("lead keeps all chosen contacts, older single-contact drafts still work", () => {
    const home = { id: "h", building: "B", unitNumber: "1", rooms: 1, sizeSqm: 80, verification: "self" } as unknown as Home;
    const base = { intent: "rent_out" as const, askingPrice: 95_000, availableFrom: "2027-02-01", contact: "whatsapp" as const, consent: true };
    expect(buildLead(home, { ...base, contacts: ["whatsapp", "email"] }, { low: 1, mid: 2, high: 3 }, "t").contacts).toEqual(["whatsapp", "email"]);
    expect(buildLead(home, base, { low: 1, mid: 2, high: 3 }, "t").contacts).toEqual(["whatsapp"]);
  });
  it("viewing sheet: all chips on, unselect one, confirmation names the rest", () => {
    render(<ContactSheet title="Request a viewing" summary="x" event="renter_lead_submitted" props={{}} recipient="The owner's agent" onClose={() => {}} />);
    const chip = (n: string) => screen.getAllByRole("button").find((b) => b.textContent === n)!;
    for (const n of ["WhatsApp", "Call", "Email"]) expect(chip(n).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chip("Call"));
    fireEvent.click(screen.getByText("Send request"));
    expect(screen.getByText(/will contact you by WhatsApp or email via PF/)).toBeTruthy();
  });
});
