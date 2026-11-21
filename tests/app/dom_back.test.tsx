// @vitest-environment happy-dom
/** Spec v14 D3: Back returns to the previous in-app screen; a deep link falls back to the fixed href. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/x" }));
const router = { back: vi.fn(), push: vi.fn() };

import { BackButton, backTarget, NAV_DEPTH_KEY } from "@/app/components/back";

beforeEach(() => {
  sessionStorage.clear();
  router.back = vi.spyOn(window.history, "back").mockImplementation(() => {}) as never;
  router.push = vi.spyOn(window.location, "assign").mockImplementation(() => {}) as never;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Back button", () => {
  it("rule: history only when there was an earlier in-app page", () => {
    expect(backTarget(2, 3)).toBe("history");
    expect(backTarget(1, 3)).toBe("href");
    expect(backTarget(0, 1)).toBe("href");
    expect(backTarget(5, 1)).toBe("href");
  });

  it("came from another screen of the app (e.g. /propworth -> My Home): goes back in history", () => {
    sessionStorage.setItem(NAV_DEPTH_KEY, "2");
    window.history.pushState({}, "", "/a");
    window.history.pushState({}, "", "/b");
    render(<BackButton href="/own/luma-park-views/value" />);
    fireEvent.click(screen.getByLabelText("Back"));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("opened from a shared link (first page in this tab): goes to the fixed parent screen", () => {
    sessionStorage.setItem(NAV_DEPTH_KEY, "1");
    render(<BackButton href="/own/luma-park-views/value" />);
    fireEvent.click(screen.getByLabelText("Back"));
    expect(router.push).toHaveBeenCalledWith("/own/luma-park-views/value");
    expect(router.back).not.toHaveBeenCalled();
  });

  it("still a real link without JavaScript", () => {
    render(<BackButton href="/rent" />);
    expect(screen.getByLabelText("Back").getAttribute("href")).toBe("/rent");
  });
});
