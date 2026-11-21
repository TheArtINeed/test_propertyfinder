/**
 * Building and area feed, like a stock app's news and discussion tab.
 * - "data" items are generated from real DLD / Ejari rows (source label "DLD" / "Ejari").
 * - "illustrative" items show the kind of news an editor or partner feed would add; they are not real events.
 */
import { DIGEST_MONTH, type RentRow, type SaleRow } from "./types";
import { median } from "./stats";
import { monthOf } from "./market";

export type Impact = "up" | "down" | "neutral";

export interface NewsItem {
  id: string;
  date: string; // YYYY-MM-DD
  tag: "Deals" | "Rents" | "Building" | "Area" | "Infrastructure" | "View";
  title: string;
  body: string;
  impact: Impact;
  impactText: string;
  kind: "data" | "illustrative";
  source: string;
}

export const DATA_SOURCE = "DLD / Ejari open data";
export const ILLUSTRATIVE_LABEL = "Illustrative example, not a real event";

const k = (n: number) => `AED ${n >= 1_000_000 ? (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M" : Math.round(n / 1000) + "K"}`;
const lastDay = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};
const MONTH = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleString("en-US", { month: "long", timeZone: "UTC" });

/** News generated from the snapshot for one building and month. */
export function dataNews(resales: SaleRow[], rents: RentRow[], building: string, rooms: number, month = DIGEST_MONTH): NewsItem[] {
  const out: NewsItem[] = [];
  const b = resales.filter((r) => r.project === building);
  const sameRooms = b.filter((r) => r.rooms === rooms);
  const inMonth = sameRooms.filter((r) => monthOf(r.date) === month);
  const before = sameRooms.filter((r) => monthOf(r.date) < month);

  if (inMonth.length) {
    const top = inMonth.reduce((a, r) => (r.value_aed > a.value_aed ? r : a));
    const prevMax = before.length ? Math.max(...before.map((r) => r.value_aed)) : 0;
    const record = top.value_aed > prevMax;
    out.push({
      id: `deal-top-${month}`,
      date: top.date,
      tag: "Deals",
      title: record ? `New 2026 high: a ${rooms === 0 ? "studio" : rooms + "BR"} sold for ${k(top.value_aed)}` : `Top deal in ${MONTH(month)}: ${k(top.value_aed)}`,
      body: `${inMonth.length} ${rooms === 0 ? "studios" : rooms + "BR flats"} resold in ${MONTH(month)}. The top one was ${Math.round(top.size_sqm)} m²${top.bulkCount && top.bulkCount > 1 ? ` (same-day bulk deal, ${top.bulkCount} units)` : ""}.`,
      impact: record ? "up" : "neutral",
      impactText: record ? "Supports your estimate" : "In line with your range",
      kind: "data",
      source: DATA_SOURCE,
    });
  }

  const monthDeals = b.filter((r) => monthOf(r.date) === month).length;
  const avgDeals = b.filter((r) => monthOf(r.date) < month).length / Math.max(1, Number(month.slice(5)) - 1);
  if (monthDeals || avgDeals) {
    const busier = monthDeals > avgDeals * 1.2;
    out.push({
      id: `deal-count-${month}`,
      date: lastDay(month),
      tag: "Deals",
      title: busier ? `Busier month: ${monthDeals} resales` : `${monthDeals} resales in ${MONTH(month)}`,
      body: `The 2026 average before ${MONTH(month)} was ${avgDeals.toFixed(1)} a month.`,
      impact: busier ? "up" : "neutral",
      impactText: busier ? "More buyers active" : "Normal activity",
      kind: "data",
      source: DATA_SOURCE,
    });
  }

  const br = rents.filter((r) => r.project === building && r.version === "New");
  const brMonth = br.filter((r) => monthOf(r.registered) === month);
  if (brMonth.length) {
    out.push({
      id: `rent-${month}`,
      date: lastDay(month),
      tag: "Rents",
      title: `${brMonth.length} new leases signed (all sizes), median ${k(median(brMonth.map((r) => r.annual_aed)))} a year`,
      body: "All sizes, Ejari registrations in the building.",
      impact: "neutral",
      impactText: "Sets the rent your tenant compares with",
      kind: "data",
      source: DATA_SOURCE,
    });
  }
  return out.sort((a, c) => c.date.localeCompare(a.date));
}

/** Illustrative editorial / partner items: NOT real events. Labelled in the UI. */
export const ILLUSTRATIVE_NEWS: NewsItem[] = [
  {
    id: "ill-tower-east",
    date: "2026-11-12",
    tag: "View",
    title: "Permit filed for a 22-floor tower on the plot to the east",
    body: "Completion would be around 2029. Units facing east below floor 22 would look at the new tower instead of the park.",
    impact: "down",
    impactText: "East-facing, lower floors: view risk",
    kind: "illustrative",
    source: ILLUSTRATIVE_LABEL,
  },
  {
    id: "ill-school",
    date: "2026-11-05",
    tag: "Area",
    title: "New primary school to open in JVC in September 2027",
    body: "Walking distance for this building. Family demand for 2BR and 3BR units usually grows near new schools.",
    impact: "up",
    impactText: "More demand for 2–3BR",
    kind: "illustrative",
    source: ILLUSTRATIVE_LABEL,
  },
  {
    id: "ill-road",
    date: "2026-10-28",
    tag: "Infrastructure",
    title: "Road works on the main JVC exit until March",
    body: "Expect slower morning traffic for about 4 months.",
    impact: "neutral",
    impactText: "Short-term only",
    kind: "illustrative",
    source: ILLUSTRATIVE_LABEL,
  },
  {
    id: "ill-service",
    date: "2026-10-15",
    tag: "Building",
    title: "2027 service charge budget published",
    body: "The owners' association proposes a small rise for chiller and security. Owners can comment before approval.",
    impact: "down",
    impactText: "Slightly lower net yield",
    kind: "illustrative",
    source: ILLUSTRATIVE_LABEL,
  },
];

export interface Post {
  id: string;
  author: string; // role, never a real name
  ago: string;
  text: string;
  replies: number;
  helpful: number;
  topic: "Renewals" | "Building" | "Selling" | "Letting";
}

/** Illustrative owner discussion (verified owners only in the product). */
export const ILLUSTRATIVE_POSTS: Post[] = [
  {
    id: "p1",
    author: "Owner, 1BR · verified",
    ago: "2 days ago",
    text: "First tenants' leases end next summer. Has anyone agreed a renewal yet? What increase did you get?",
    replies: 14,
    helpful: 31,
    topic: "Renewals",
  },
  {
    id: "p2",
    author: "Owner, 2BR · verified",
    ago: "5 days ago",
    text: "AC noise on floors 10–15 is fixed after the snagging visit. Log a ticket with the facility manager if you still have it.",
    replies: 6,
    helpful: 22,
    topic: "Building",
  },
  {
    id: "p3",
    author: "Owner, 1BR · verified",
    ago: "1 week ago",
    text: "Listed at the top of the PF range, got two viewings and no offers in 3 weeks. Dropped to the median, sold in 10 days.",
    replies: 9,
    helpful: 47,
    topic: "Selling",
  },
  {
    id: "p4",
    author: "Owner, 1BR · verified",
    ago: "2 weeks ago",
    text: "Tip for letting here: 4 cheques instead of 1 got me a tenant in a week, at the same rent.",
    replies: 3,
    helpful: 18,
    topic: "Letting",
  },
];

/** Feed = real data items first by date, then illustrative ones, newest first. */
export function buildFeed(resales: SaleRow[], rents: RentRow[], building: string, rooms: number, month = DIGEST_MONTH): NewsItem[] {
  return [...dataNews(resales, rents, building, rooms, month), ...ILLUSTRATIVE_NEWS].sort((a, c) => c.date.localeCompare(a.date));
}

/** N2: "Market moves" = numbers from DLD / Ejari; they stay with the numbers. */
export const marketMoves = dataNews;
/** N2: "Building and area news" = project and editorial items; only in the news block. */
export function areaNews(): NewsItem[] {
  return [...ILLUSTRATIVE_NEWS].sort((a, c) => c.date.localeCompare(a.date));
}
export const IMPACT_WORD: Record<Impact, string> = { up: "Up", down: "Down", neutral: "Neutral" };

/**
 * V18: three lines for the "Every month you'll also get" card on the valuation:
 * one real market move (top deal of the month, same function as My Home), one area news item, the reminder.
 */
export function updatePreview(resales: SaleRow[], rents: RentRow[], building: string, rooms: number, month = DIGEST_MONTH) {
  const moves = marketMoves(resales, rents, building, rooms, month);
  const move = moves.find((n) => n.id.startsWith("deal-top")) ?? moves[0] ?? null;
  const news = areaNews().find((n) => n.impact !== "neutral") ?? areaNews()[0];
  return { move, news };
}
