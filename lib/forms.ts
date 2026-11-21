/** Parsing of the GET forms on /rent and /buy (inputs live in the URL, so Back and sharing keep them). */

/** Field -> message. Shown under the field it belongs to; empty object = valid. */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;
export const hasErrors = (e: object) => Object.keys(e).length > 0;

type Q = Record<string, string | string[] | undefined>;
const one = (q: Q, k: string) => (Array.isArray(q[k]) ? q[k]![0] : (q[k] as string | undefined)) ?? "";
const pos = (s: string) => {
  const v = Number(s.replace(/[, ]/g, ""));
  return Number.isFinite(v) && v > 0 ? v : null;
};
const isoDate = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
const rooms = (s: string) => {
  const v = Number(s);
  return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 1;
};

export interface RentQuery {
  building: string | null; // slug
  rooms: number;
  sizeSqm: number | null;
  annualRent: number | null;
  leaseEnd: string | null;
  askedIncrease: number | null; // share, 0.05
  rate: number | null; // share
  submitted: boolean;
  errors: FieldErrors<"size" | "rent">;
}

export function parseRentQuery(q: Q): RentQuery {
  const sizeSqm = pos(one(q, "size"));
  const annualRent = pos(one(q, "rent"));
  const asked = one(q, "ask");
  const askedNum = asked === "" ? null : Number(asked);
  const rate = pos(one(q, "rate"));
  const submitted = one(q, "size") !== "" || one(q, "rent") !== "";
  const errors: FieldErrors<"size" | "rent"> = {};
  if (submitted && !(sizeSqm && sizeSqm > 15 && sizeSqm < 1500)) errors.size = "Enter your size in m² (15 – 1,500)";
  if (submitted && !annualRent) errors.rent = "Enter your annual rent";
  return {
    building: one(q, "b") || null,
    rooms: rooms(one(q, "rooms")),
    sizeSqm,
    annualRent,
    leaseEnd: isoDate(one(q, "end")),
    askedIncrease: askedNum != null && Number.isFinite(askedNum) && askedNum >= 0 && askedNum <= 100 ? askedNum / 100 : null,
    rate: rate && rate < 20 ? rate / 100 : null,
    submitted,
    errors,
  };
}

export interface BuyQuery {
  building: string | null;
  rooms: number;
  sizeSqm: number | null;
  asking: number | null;
  unit: string;
  submitted: boolean;
  errors: FieldErrors<"size" | "price">;
}

export function parseBuyQuery(q: Q): BuyQuery {
  const sizeSqm = pos(one(q, "size"));
  const asking = pos(one(q, "price"));
  const submitted = one(q, "price") !== "";
  const errors: FieldErrors<"size" | "price"> = {};
  if (submitted && !(sizeSqm && sizeSqm > 15 && sizeSqm < 1500)) errors.size = "Enter the size in m² (15 – 1,500)";
  if (submitted && !asking) errors.price = "Enter the asking price";
  return {
    building: one(q, "b") || null,
    rooms: rooms(one(q, "rooms")),
    sizeSqm,
    asking,
    unit: one(q, "unit").slice(0, 12),
    submitted,
    errors,
  };
}


export function validateUnitForm(input: { unit: string; size: string; system: "sqm" | "sqft" }): {
  errors: FieldErrors<"unit" | "size">;
  sizeSqm: number | null;
} {
  const errors: FieldErrors<"unit" | "size"> = {};
  if (!input.unit.trim()) errors.unit = "Enter your unit number";
  const raw = Number(input.size.replace(/[, ]/g, ""));
  const sqm = input.system === "sqft" ? raw / 10.7639 : raw;
  if (!input.size.trim()) errors.size = "Enter the size";
  else if (!(sqm > 15 && sqm < 1500)) errors.size = input.system === "sqft" ? "Enter a size between 160 and 16,000 ft²" : "Enter a size between 15 and 1,500 m²";
  return { errors, sizeSqm: errors.size ? null : Math.round(sqm * 10) / 10 };
}

export function validateClaim(input: {
  unit: string;
  occupancy: "let" | "live";
  rent: string;
  leaseEnd: string;
  consent: boolean;
}): FieldErrors<"unit" | "rent" | "leaseEnd" | "consent"> {
  const e: FieldErrors<"unit" | "rent" | "leaseEnd" | "consent"> = {};
  if (!input.unit.trim()) e.unit = "Enter your unit number";
  if (input.occupancy === "let" && !(Number(input.rent) > 0)) e.rent = "Enter the annual rent";
  if (input.occupancy === "let" && !input.leaseEnd) e.leaseEnd = "Pick the lease end date";
  if (!input.consent) e.consent = "Please agree to how PF uses your data";
  return e;
}
