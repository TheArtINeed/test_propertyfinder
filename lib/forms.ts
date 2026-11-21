/** Parsing of the GET forms on /rent and /buy (inputs live in the URL, so Back and sharing keep them). */
import { checkLeaseEnd, checkLoan, checkPercent, checkPrice, checkRent, checkTitleDeed, checkUnitNumber, LIMITS } from "./sanity";

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
  if (s.trim() === "") return 1; // default 1BR, not Number("") = 0 (studio)
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
  errors: FieldErrors<"size" | "rent" | "end" | "ask" | "rate">;
  /** Exactly what the user typed, to show back in the form after a submit. */
  raw: { size: string; rent: string; end: string; ask: string };
}

export function parseRentQuery(q: Q): RentQuery {
  const sizeSqm = pos(one(q, "size"));
  const annualRent = pos(one(q, "rent"));
  const asked = one(q, "ask");
  const askedNum = asked === "" ? null : Number(asked);
  const rate = pos(one(q, "rate"));
  // "go" is a hidden field in the form: an empty submit must still show errors.
  const submitted = one(q, "go") === "1" || one(q, "size") !== "" || one(q, "rent") !== "";
  const errors: RentQuery["errors"] = {};
  if (submitted) {
    if (!(sizeSqm && sizeSqm > 15 && sizeSqm < 1500)) errors.size = "Enter your size in m² (15 – 1,500)";
    if (one(q, "rent") === "") errors.rent = "Enter your annual rent";
    else if (checkRent(one(q, "rent"))) errors.rent = checkRent(one(q, "rent"));
    if (one(q, "end") !== "") errors.end = checkLeaseEnd(one(q, "end"));
    errors.ask = checkPercent(asked, LIMITS.ask, "an increase");
    errors.rate = checkPercent(one(q, "rate"), LIMITS.rate, "a rate");
    for (const k of Object.keys(errors) as (keyof typeof errors)[]) if (!errors[k]) delete errors[k];
  }
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
    raw: { size: one(q, "size"), rent: one(q, "rent"), end: one(q, "end"), ask: one(q, "ask") },
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
  raw: { size: string; price: string };
}

export function parseBuyQuery(q: Q): BuyQuery {
  const sizeSqm = pos(one(q, "size"));
  const asking = pos(one(q, "price"));
  const submitted = one(q, "go") === "1" || one(q, "price") !== "";
  const errors: FieldErrors<"size" | "price"> = {};
  if (submitted && !(sizeSqm && sizeSqm > 15 && sizeSqm < 1500)) errors.size = "Enter the size in m² (15 – 1,500)";
  if (submitted && one(q, "price") === "") errors.price = "Enter the asking price";
  else if (submitted && checkPrice(one(q, "price"))) errors.price = checkPrice(one(q, "price"));
  return {
    building: one(q, "b") || null,
    rooms: rooms(one(q, "rooms")),
    sizeSqm,
    asking,
    unit: one(q, "unit").slice(0, 12),
    submitted,
    errors,
    raw: { size: one(q, "size"), price: one(q, "price") },
  };
}


export function validateUnitForm(input: { unit: string; size: string; system: "sqm" | "sqft" }): {
  errors: FieldErrors<"unit" | "size">;
  sizeSqm: number | null;
} {
  const errors: FieldErrors<"unit" | "size"> = {};
  const unitErr = checkUnitNumber(input.unit);
  if (unitErr) errors.unit = unitErr;
  const raw = Number(input.size.replace(/[, ]/g, ""));
  const sqm = input.system === "sqft" ? raw / 10.7639 : raw;
  if (!input.size.trim()) errors.size = "Enter the size";
  else if (!(sqm > 15 && sqm < 1500)) errors.size = input.system === "sqft" ? "Enter a size between 160 and 16,000 ft²" : "Enter a size between 15 and 1,500 m²";
  return { errors, sizeSqm: errors.size ? null : Math.round(sqm * 10) / 10 };
}

export type ClaimErrors = FieldErrors<"unit" | "rent" | "leaseEnd" | "paid" | "loan" | "deed" | "consent">;

export function validateClaim(input: {
  unit: string;
  occupancy: "let" | "live";
  rent: string;
  leaseEnd: string;
  consent: boolean;
  paid?: string;
  loan?: string;
  deed?: string;
}): ClaimErrors {
  const e: ClaimErrors = {};
  const set = (k: keyof ClaimErrors, msg: string | undefined) => {
    if (msg) e[k] = msg;
  };
  set("unit", checkUnitNumber(input.unit));
  if (input.occupancy === "let") {
    set("rent", input.rent.trim() === "" ? "Enter the annual rent" : checkRent(input.rent));
    set("leaseEnd", input.leaseEnd === "" ? "Pick the lease end date" : checkLeaseEnd(input.leaseEnd));
  }
  if (input.paid && input.paid.trim() !== "") set("paid", checkPrice(input.paid));
  if (input.loan) set("loan", checkLoan(input.loan, e.paid ? null : input.paid || null));
  if (input.deed) set("deed", checkTitleDeed(input.deed));
  if (!input.consent) e.consent = "Please agree to how PF uses your data";
  return e;
}
