"use client";

import { useState, type ReactNode } from "react";
import { track } from "@/lib/track";

/** D1: full readings open on demand; logs analysis_opened once. */
export function AnalysisToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="linkbtn"
        aria-expanded={open}
        onClick={() => {
          if (!open) track("analysis_opened", {});
          setOpen(!open);
        }}
      >
        {open ? "Hide the analysis" : "See the analysis"}
      </button>
      {open ? children : null}
    </>
  );
}
