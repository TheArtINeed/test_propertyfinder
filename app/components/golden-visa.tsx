import { aed } from "@/lib/format";
import { GOLDEN_VISA_DLD_URL, goldenVisa } from "@/lib/finance";
import { Track } from "./client";

/** G1: one line on the AED 2M Golden Visa threshold; never says "you qualify". */
export function GoldenVisaLine({ estimate, pricePaid, scope = "home" }: { estimate: number; pricePaid?: number | null; scope?: "home" | "portfolio" }) {
  const g = goldenVisa(estimate, pricePaid);
  if (g.kind === "none") return null;
  const what = scope === "portfolio" ? "Your homes are" : "Your home is";
  const text =
    g.kind === "may_qualify"
      ? `You paid AED 2M or more${scope === "portfolio" ? " in total" : ""}: you may qualify for a 10-year Golden Visa.`
      : g.kind === "value_above"
        ? `${what} worth AED 2M or more today. DLD's Golden Visa service looks at the purchase value, so check whether today's value counts.`
        : `${aed(Math.round(g.gap / 5000) * 5000, { compact: true })} to the AED 2M Golden Visa threshold.`;
  return (
    <p className="golden" data-testid="golden-visa">
      <Track name="golden_visa_viewed" props={{ kind: g.kind, scope }} />
      {text}{" "}
      <a href={GOLDEN_VISA_DLD_URL} target="_blank" rel="noreferrer">
        DLD Golden Visa service
      </a>
      <span className="tiny"> · Check current rules with DLD; mortgage terms vary.</span>
    </p>
  );
}
