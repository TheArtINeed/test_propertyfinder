"use client";

import { useEffect, useState } from "react";
import { getHomes, HOMES_KEY, type Home } from "@/lib/owner";

/** Re-read only when the homes list itself changes, or storage is cleared (key null). */
export function isHomesChange(key: string | null): boolean {
  return key === null || key === HOMES_KEY;
}

/**
 * Saved homes on this device, kept fresh: re-read when another tab changes the homes list,
 * on Safari's back-forward cache restore ("pageshow") and when the tab comes back into view.
 * Returns the same array object while the list is unchanged, so effects that depend on it do not re-run
 * (an earlier version re-read on every storage write, including the event log, and looped between tabs).
 * Null until first read, so the server render stays neutral.
 */
export function useSavedHomes(): Home[] | null {
  const [homes, setHomes] = useState<Home[] | null>(null);
  useEffect(() => {
    let last = "";
    const read = () => {
      let list: Home[] = [];
      try {
        list = getHomes(localStorage);
      } catch {
        list = [];
      }
      const key = JSON.stringify(list);
      if (key === last) return;
      last = key;
      setHomes(list);
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (isHomesChange(e.key)) read();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") read();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", read);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", read);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return homes;
}
