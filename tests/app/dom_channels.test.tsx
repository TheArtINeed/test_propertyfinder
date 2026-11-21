// @vitest-environment happy-dom
/** V11 amended: several channels for the update, at least one. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}"))));

import { GetMonthly } from "@/app/components/client";
import { channelsLabel, channelsOf, getHomes, toggleChannel } from "@/lib/owner";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("channels", () => {
  it("toggle adds and removes, keeps order, never empties", () => {
    expect(toggleChannel(["whatsapp"], "email")).toEqual(["whatsapp", "email"]);
    expect(toggleChannel(["email"], "whatsapp")).toEqual(["whatsapp", "email"]);
    expect(toggleChannel(["whatsapp", "email"], "whatsapp")).toEqual(["email"]);
    expect(toggleChannel(["email"], "email")).toEqual(["email"]);
    expect(channelsLabel(["whatsapp", "email", "in_app"])).toBe("WhatsApp + Email + In-app");
  });
  it("older saves with one channel still read", () => {
    expect(channelsOf({ channels: undefined as never, channel: "email" })).toEqual(["email"]);
    expect(channelsOf(undefined)).toEqual([]);
  });
  // Updated for the "preselect as many as possible" change: all channels start selected; unselecting In-app keeps the other two.
  it("the save sheet starts with every channel selected and saves the ones left on", () => {
    render(<GetMonthly ctx={{ slug: "luma-park-views", building: "Luma Park Views", unitNumber: "1204", rooms: 1, sizeSqm: 80 }} />);
    fireEvent.click(screen.getByText("Get this every month"));
    const chip = (name: string) => screen.getAllByRole("button").find((b) => b.textContent === name)!;
    for (const n of ["WhatsApp", "Email", "In-app"]) expect(chip(n).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chip("In-app"));
    expect(chip("In-app").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByText("Save and get my update"));
    expect(getHomes(localStorage)[0].subscription?.channels).toEqual(["whatsapp", "email"]);
    expect(push).toHaveBeenCalled();
  });
});
