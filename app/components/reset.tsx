"use client";

import { useEffect } from "react";
import { deleteAllData } from "@/lib/owner";

/** R1: wipe everything the prototype saved on this device (local + session), then open the first screen. */
export function resetDemo() {
  try {
    deleteAllData(localStorage);
    deleteAllData(sessionStorage);
  } catch {
    /* storage blocked */
  }
  window.location.assign("/");
}

export function ResetDemoLink() {
  return (
    <a
      href="/?reset=1"
      className="reset-link"
      onClick={(e) => {
        e.preventDefault();
        resetDemo();
      }}
    >
      Reset demo
    </a>
  );
}

/** R1: a clean link for testers, `/?reset=1`. Mounted once in the layout. */
export function ResetFromUrl() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reset") === "1") resetDemo();
  }, []);
  return null;
}
