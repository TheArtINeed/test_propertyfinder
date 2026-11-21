/**
 * Demo prefill (spec section 12): every form opens with these values so reviewers can click through.
 * All fields stay editable. Consent is pre-ticked only because this is a demo.
 */
export const DEMO = {
  building: "luma-park-views",
  unit: "1204",
  rooms: 1,
  sizeSqm: 80,
  owner: {
    occupancy: "let" as const,
    annualRent: 95_000,
    leaseEnd: "2027-01-31",
    pricePaid: 1_100_000,
    loan: 600_000,
    titleDeed: "DEMO-0001",
    mortgageRatePct: 5.25,
    fixedRateEnd: "2027-04-30",
    consent: true,
  },
  subscription: { channel: "whatsapp" as const, frequency: "monthly" as const },
  plans: { rentOutFrom: "2027-02-01" },
  lead: { contact: "whatsapp" as const, consent: true },
  viewing: { channel: "whatsapp" as const, consent: true },
  renter: { annualRent: 90_000, leaseEnd: "2027-02-28", askedIncreasePct: 10 },
  buyer: { asking: 1_500_000 },
} as const;

/** Form value on first open = demo value; after a submit = exactly what the user sent (may be empty). */
export function prefill<T extends string | number>(submitted: boolean, sent: string | number | null | undefined, demo: T): string {
  if (submitted) return sent == null ? "" : String(sent);
  return String(demo);
}
