/** Small numeric helpers shared by all calculations. */

export function sorted(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

/** Quantile with linear interpolation (same as numpy default). Returns NaN for empty input. */
export function quantile(values: number[], q: number): number {
  if (values.length === 0) return NaN;
  const s = sorted(values);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export const median = (values: number[]) => quantile(values, 0.5);

export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Share of values strictly below x, 0-100. */
export function percentileOf(values: number[], x: number): number {
  if (values.length === 0) return NaN;
  const below = values.filter((v) => v < x).length;
  const equal = values.filter((v) => v === x).length;
  return ((below + equal / 2) / values.length) * 100;
}

/** "2026-10" -> "2026-08" for offset -2. */
export function addMonths(month: string, offset: number): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + offset;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Months in [from, to] inclusive, both "YYYY-MM". */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(toIso + "T00:00:00Z") - Date.parse(fromIso + "T00:00:00Z");
  return Math.round(ms / 86_400_000);
}

export function round(value: number, step = 1): number {
  return Math.round(value / step) * step;
}
