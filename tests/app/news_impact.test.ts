import { describe, expect, it } from "vitest";
import { dataNews, marketMoves } from "@/lib/news";
import { loadSnapshot } from "@/lib/data";
import { HERO_BUILDING } from "@/lib/types";
import { rent, sale } from "./fixtures";

/** N2 amended: market moves can go up, down or stay neutral, with the thresholds in the spec. */
const monthSales = (month: string, n: number, value = 1_200_000) => Array.from({ length: n }, (_, i) => sale({ date: `${month}-${String(10 + (i % 15)).padStart(2, "0")}`, value_aed: value }));
const count = (items: ReturnType<typeof dataNews>) => items.find((n) => n.id.startsWith("deal-count"))!;

describe("deal count vs the 2026 average", () => {
  // Jan-Sep: 10 deals a month on average
  const base = ["01", "02", "03", "04", "05", "06", "07", "08", "09"].flatMap((m) => monthSales(`2026-${m}`, 10));
  it("more than +20% is up, less than -20% is down, else neutral", () => {
    expect(count(dataNews([...base, ...monthSales("2026-10", 13)], [], "Tower A", 1, "2026-10")).impact).toBe("up");
    expect(count(dataNews([...base, ...monthSales("2026-10", 12)], [], "Tower A", 1, "2026-10")).impact).toBe("neutral"); // exactly +20%
    expect(count(dataNews([...base, ...monthSales("2026-10", 8)], [], "Tower A", 1, "2026-10")).impact).toBe("neutral"); // exactly -20%
    expect(count(dataNews([...base, ...monthSales("2026-10", 7)], [], "Tower A", 1, "2026-10")).impact).toBe("down");
  });
});

describe("new-lease rents vs the 3 months before", () => {
  const leases = (month: string, aed: number) => Array.from({ length: 3 }, () => rent({ registered: `${month}-10`, annual_aed: aed }));
  const move = (aed: number) => dataNews([], [...leases("2026-08", 100_000), ...leases("2026-10", aed)], "Tower A", 1, "2026-10").find((n) => n.id.startsWith("rent-"))!;
  it("+/-3% bands", () => {
    expect(move(104_000).impact).toBe("up");
    expect(move(103_000).impact).toBe("neutral");
    expect(move(97_000).impact).toBe("neutral");
    expect(move(96_000).impact).toBe("down");
    expect(move(96_000).impactText).toBe("New-lease rents down 4% on the 3 months before");
  });
});

describe("top deal vs the owner's estimate range", () => {
  const top = (value: number) =>
    dataNews([sale({ date: "2026-05-10", value_aed: 2_000_000 }), sale({ date: "2026-10-10", value_aed: value })], [], "Tower A", 1, "2026-10", { low: 1_200_000, high: 1_300_000 }).find((n) => n.id.startsWith("deal-top"))!;
  it("above, inside and below the range", () => {
    expect(top(1_350_000).impact).toBe("up");
    expect(top(1_250_000)).toMatchObject({ impact: "neutral", impactText: "In line with your estimate" });
    expect(top(1_150_000).impact).toBe("down");
  });
});

describe("on the snapshot, October is not all neutral", () => {
  it("the hero building shows at least one up or down move", () => {
    const { resales, rents } = loadSnapshot();
    const items = marketMoves(resales, rents, HERO_BUILDING, 1, "2026-10", { low: 1_210_000, high: 1_340_000 });
    expect(items.some((n) => n.impact !== "neutral")).toBe(true);
  });
});
