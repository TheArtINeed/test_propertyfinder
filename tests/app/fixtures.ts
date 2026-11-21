import type { RentRow, SaleRow } from "@/lib/types";

let n = 0;
export function sale(p: Partial<SaleRow>): SaleRow {
  n += 1;
  return {
    id: `s${n}`,
    date: "2026-10-15",
    procedure: "Sale",
    off_plan: false,
    project: "Tower A",
    sub_type: "Flat",
    rooms: 1,
    size_sqm: 80,
    value_aed: 1_200_000,
    ...p,
  };
}

export function rent(p: Partial<RentRow>): RentRow {
  return {
    registered: "2026-10-10",
    start: "2026-10-10",
    end: "2027-10-09",
    version: "New",
    project: "Tower A",
    sub_type: "Flat",
    size_sqm: 80,
    annual_aed: 90_000,
    ...p,
  };
}

/** n sales at AED/sqm = psm[i] in the given building / month. */
export function salesAt(psm: number[], p: Partial<SaleRow> = {}): SaleRow[] {
  const size = p.size_sqm ?? 80;
  return psm.map((x) => sale({ ...p, size_sqm: size, value_aed: x * size }));
}
