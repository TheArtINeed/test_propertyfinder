/** Server-side loader for the DLD snapshot. Reads the JSON once per process. */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { RentRow, SaleRow } from "./types";
import { listBuildings, residentialResales, type Building } from "./market";
import { residentialRents } from "./rent";

export interface Snapshot {
  resales: SaleRow[];
  rents: RentRow[];
  buildings: Building[];
  period: [string, string];
}

let cache: Snapshot | null = null;

function readRows<T>(file: string): { rows: T[]; meta: { period: [string, string] } } {
  return JSON.parse(readFileSync(path.join(process.cwd(), "dataset", file), "utf8"));
}

export function loadSnapshot(): Snapshot {
  if (cache) return cache;
  const sales = readRows<SaleRow>("dld_jvc_sales.json");
  const rents = readRows<RentRow>("dld_jvc_rents.json");
  const resales = residentialResales(sales.rows);
  cache = {
    resales,
    rents: residentialRents(rents.rows),
    buildings: listBuildings(resales),
    period: sales.meta.period,
  };
  return cache;
}

/** Raw rows, for data tests that check the filters. */
export function loadRawSales(): SaleRow[] {
  return readRows<SaleRow>("dld_jvc_sales.json").rows;
}
export function loadRawRents(): RentRow[] {
  return readRows<RentRow>("dld_jvc_rents.json").rows;
}

export interface OwnerConfirmed {
  id: string;
  bedrooms: number;
  sizeSqm: number;
  annualRent: number;
  availableFrom: string;
}

/** Synthetic listings re-used as "owner-confirmed" cards (owner set "rent out from date"). */
export function ownerConfirmedUnits(): OwnerConfirmed[] {
  const data = JSON.parse(readFileSync(path.join(process.cwd(), "dataset", "listings.json"), "utf8"));
  return (data.listings as Record<string, unknown>[])
    .filter((l) => l.area === "Jumeirah Village Circle" && l.purpose === "rent" && l.property_type === "apartment")
    .slice(0, 3)
    .map((l) => ({
      id: String(l.id),
      bedrooms: Number(l.bedrooms),
      sizeSqm: Math.round(Number(l.size_sqft) / 10.7639),
      annualRent: Number(l.price_aed),
      availableFrom: String(l.available_from),
    }));
}
