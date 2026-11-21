"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "../icons";

/** Count of in-app page views in this tab (sessionStorage), so Back knows whether there is an in-app page to return to. */
export const NAV_DEPTH_KEY = "pf.navDepth";

export function navDepth(): number {
  try {
    return Number(sessionStorage.getItem(NAV_DEPTH_KEY) ?? "0");
  } catch {
    return 0;
  }
}

/** D3: Back goes to the previous screen when it is in this app; on a deep link it falls back to `href`. */
export function backTarget(depth: number, historyLength: number): "history" | "href" {
  return depth > 1 && historyLength > 1 ? "history" : "href";
}

/** Mounted once in the layout: counts each in-app page (path change). */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      sessionStorage.setItem(NAV_DEPTH_KEY, String(navDepth() + 1));
    } catch {
      /* storage blocked */
    }
  }, [pathname]);
  return null;
}

/** Uses the browser history directly, so it renders anywhere (no router needed). */
export function BackButton({ href }: { href: string }) {
  return (
    <a
      className="iconbtn"
      href={href}
      aria-label="Back"
      onClick={(e) => {
        e.preventDefault();
        if (backTarget(navDepth(), window.history.length) === "history") window.history.back();
        else window.location.assign(href);
      }}
    >
      <Icon name="back" />
    </a>
  );
}
