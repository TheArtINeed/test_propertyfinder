// @vitest-environment happy-dom
/** Spec v16 R1: "Reset demo" wipes the prototype's data on this device and opens the first screen. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ResetDemoLink, ResetFromUrl } from "@/app/components/reset";
import { homeId, saveHome, getHomes } from "@/lib/owner";

const seed = () => {
  saveHome(localStorage, { id: homeId("luma-park-views", "1204"), building: "Luma Park Views", slug: "luma-park-views", unitNumber: "1204", rooms: 1, sizeSqm: 80, claimedAt: "2026-11-21", verification: "none", statusHistory: [] });
  localStorage.setItem("pf.events", "[1]");
  localStorage.setItem("other.app", "keep");
  sessionStorage.setItem("pf.justSaved", "x");
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("Reset demo", () => {
  it("the footer link deletes every pf.* key and goes to the first screen", () => {
    seed();
    const go = vi.spyOn(window.location, "assign").mockImplementation(() => {});
    render(<ResetDemoLink />);
    fireEvent.click(screen.getByText("Reset demo"));
    expect(getHomes(localStorage)).toEqual([]);
    expect(localStorage.getItem("pf.events")).toBeNull();
    expect(sessionStorage.getItem("pf.justSaved")).toBeNull();
    expect(localStorage.getItem("other.app")).toBe("keep");
    expect(go).toHaveBeenCalledWith("/");
  });

  it("/?reset=1 does the same on load", () => {
    seed();
    const go = vi.spyOn(window.location, "assign").mockImplementation(() => {});
    window.history.replaceState({}, "", "/?reset=1");
    render(<ResetFromUrl />);
    expect(getHomes(localStorage)).toEqual([]);
    expect(go).toHaveBeenCalledWith("/");
  });

  it("without ?reset=1 nothing is deleted", () => {
    seed();
    window.history.replaceState({}, "", "/");
    render(<ResetFromUrl />);
    expect(getHomes(localStorage)).toHaveLength(1);
  });
});
