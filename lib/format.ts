/** Display formatting shared by server and client components. */

export function aed(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "–";
  if (opts.compact) {
    if (Math.abs(n) >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
    if (Math.abs(n) >= 1_000) return `AED ${Math.round(n / 1_000)}K`;
  }
  return `AED ${Math.round(n).toLocaleString("en-US")}`;
}

/** Round an estimate to the nearest 5K so we never imply false precision. */
export const roundEstimate = (n: number) => Math.round(n / 5_000) * 5_000;

export function pct(x: number, digits = 0, signed = false): string {
  if (!Number.isFinite(x)) return "–";
  const v = (x * 100).toFixed(digits);
  return `${signed && x > 0 ? "+" : ""}${v}%`;
}

export const roomsLabel = (rooms: number) => (rooms === 0 ? "Studio" : `${rooms}BR`);

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function dateLabel(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
