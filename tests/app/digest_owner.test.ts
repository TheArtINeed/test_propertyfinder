import { beforeEach, describe, expect, it } from "vitest";
import { buildDigest, nextStep, RELET_DAYS } from "@/lib/digest";
import {
  addLead, boughtThisQuery, buildLead, deleteAllData, getHomes, getLeads, homeId, LEAD_FIELDS,
  parseUnitQuery, removeHome, saveHome, setIntent, setStatus, validateLead, type Home,
} from "@/lib/owner";
import { parseEvent } from "@/lib/events";
import { rent, sale, salesAt } from "./fixtures";

const unit = { building: "Tower A", rooms: 1, sizeSqm: 80 };

describe("digest for M = 2026-10", () => {
  const resales = [
    ...salesAt([15000, 16000, 17000], { date: "2026-10-05" }),
    ...salesAt([18000, 19000], { date: "2026-09-05" }),
    sale({ date: "2026-10-20", rooms: 2, size_sqm: 120, value_aed: 2_000_000 }),
    sale({ date: "2026-11-02" }), // November is not "this month"
  ];
  const rents = [
    rent({ annual_aed: 80_000 }),
    rent({ annual_aed: 90_000 }),
    rent({ annual_aed: 100_000, registered: "2026-09-01" }),
    rent({ annual_aed: 85_000, version: "Renewed" }),
  ];

  it("counts rents and deals of M only and keeps the block order", () => {
    const d = buildDigest(resales, rents, unit, { occupancy: "let", annualRent: 99_000, leaseEnd: "2027-06-01" }, "2026-10", "2026-11-21")!;
    expect(d.rent.stats.count).toBe(2);
    expect(d.rent.stats.median).toBe(85_000);
    expect(d.deals.all).toHaveLength(4);
    expect(d.deals.likeYours).toHaveLength(3);
    expect(d.order).toEqual(["rent", "deals", "demand", "capital"]);
    expect(d.rent.ownerGap).toBeCloseTo(14_000 / 85_000);
    expect(d.nextStep.kind).toBe("renewal_risk");
    expect(d.demand.label).toMatch(/Illustrative/);
  });

  it("owner-occupier sees capital first", () => {
    expect(buildDigest(resales, rents, unit, { occupancy: "live" })!.order[0]).toBe("capital");
  });

  it("a month with no deals still shows rents and demand", () => {
    const old = salesAt([15000, 16000, 17000, 18000, 19000], { date: "2026-08-05" });
    const d = buildDigest(old, rents, unit, {}, "2026-10")!;
    expect(d.deals.all).toHaveLength(0);
    expect(d.rent.stats.count).toBe(2);
    expect(d.demand.searches).toBeGreaterThan(0);
  });
});

describe("next-step rules", () => {
  const base = { daysToLeaseEnd: null, ownerGap: null, demandHigh: false, unitYield: 0.07, jvcYield: 0.07 };
  it("re-let at <= 90 days to lease end", () => {
    expect(nextStep({ ...base, daysToLeaseEnd: RELET_DAYS }).kind).toBe("relet");
    expect(nextStep({ ...base, daysToLeaseEnd: RELET_DAYS + 1 }).kind).toBe("keep");
  });
  it("renewal risk above market +10%", () => {
    expect(nextStep({ ...base, ownerGap: 0.1 }).kind).toBe("keep");
    expect(nextStep({ ...base, ownerGap: 0.101 }).kind).toBe("renewal_risk");
  });
  it("open to offers on high demand and yield below JVC, labelled illustrative", () => {
    const s = nextStep({ ...base, demandHigh: true, unitYield: 0.06 });
    expect(s.kind).toBe("open_to_offers");
    expect(s.illustrative).toBe(true);
    expect(nextStep({ ...base, demandHigh: true, unitYield: 0.08 }).kind).toBe("keep");
  });
});

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    clear: () => m.clear(),
    _map: m,
  };
}

describe("owner storage (O1, O2, O3, O9)", () => {
  let s: ReturnType<typeof memoryStorage>;
  const home: Home = {
    id: homeId("tower-a", "1204"), building: "Tower A", slug: "tower-a", unitNumber: "1204", rooms: 1,
    sizeSqm: 80, claimedAt: "2026-11-21", verification: "pending", statusHistory: [],
  };
  beforeEach(() => { s = memoryStorage(); s.setItem("other.app", "keep"); });

  it("saves a home and reads it back (survives reload = same storage)", () => {
    saveHome(s, home);
    expect(getHomes(s)).toEqual([home]);
    saveHome(s, { ...home, rooms: 2 });
    expect(getHomes(s)).toHaveLength(1);
  });

  it("status changes keep a dated history; 'I let it' needs rent and lease end", () => {
    saveHome(s, home);
    expect(() => setStatus(s, home.id, "let", "2026-11-21")).toThrow();
    setStatus(s, home.id, "live", "2026-11-01");
    const h = setStatus(s, home.id, "let", "2026-11-21", { annualRent: 90_000, leaseEnd: "2027-11-20" });
    expect(h.statusHistory).toEqual([{ status: "live", at: "2026-11-01" }, { status: "let", at: "2026-11-21" }]);
    expect(h.occupancy).toBe("let");
    expect(h.annualRent).toBe(90_000);
  });

  it("lead cannot be sent without intent and contact; payload matches the schema", () => {
    expect(validateLead({})).toHaveLength(5);
    // Updated for sanity checks (spec 13): a plausible sale price, so only the contact error is left.
    expect(validateLead({ intent: "sell", askingPrice: 1_300_000, availableFrom: "2026-12-01", consent: true })).toEqual([
      "Choose how the agent contacts you",
    ]);
    const lead = buildLead(home, { intent: "rent_out", askingPrice: 95_000, availableFrom: "2027-01-01", contact: "whatsapp", consent: true },
      { low: 1, mid: 2, high: 3 }, "2026-11-21T10:00:00Z");
    expect(Object.keys(lead).sort()).toEqual([...LEAD_FIELDS].sort());
    expect(lead.verification).toBe("pending");
    expect(() => buildLead(home, { intent: "sell", askingPrice: 0, availableFrom: "x", contact: "call", consent: true }, lead.estimate, "t")).toThrow();
  });

  it("intent is stored on the home", () => {
    saveHome(s, home);
    setIntent(s, home.id, { kind: "open_to_offers", price: 1_500_000, setAt: "2026-11-21" });
    expect(getHomes(s)[0].intent?.price).toBe(1_500_000);
  });

  it("remove one home drops its leads; delete all leaves nothing of the owner", () => {
    saveHome(s, home);
    saveHome(s, { ...home, id: "b#1", unitNumber: "1" });
    addLead(s, { homeId: home.id } as never);
    removeHome(s, home.id);
    expect(getHomes(s).map((h) => h.id)).toEqual(["b#1"]);
    expect(getLeads(s)).toEqual([]);
    s.setItem("pf.events", "[]");
    deleteAllData(s);
    expect([...s._map.keys()]).toEqual(["other.app"]);
  });
});

describe("deep links and prefill (B2, C3)", () => {
  it("'I bought this' carries unit, size and price paid", () => {
    const q = boughtThisQuery({ unit: "1204", rooms: 1, sizeSqm: 80, pricePaid: 1_250_000.4 });
    const p = parseUnitQuery(Object.fromEntries(new URLSearchParams(q)))!;
    expect(p).toMatchObject({ unit: "1204", rooms: 1, sizeSqm: 80, pricePaid: 1_250_000, from: "buy" });
  });
  it("rejects missing or absurd unit params", () => {
    expect(parseUnitQuery({ rooms: "1" })).toBeNull();
    expect(parseUnitQuery({ rooms: "1", size: "5" })).toBeNull();
    expect(parseUnitQuery({ rooms: "x", size: "80" })).toBeNull();
  });
});

describe("events", () => {
  it("accepts known events with primitive props, rejects unknown", () => {
    const e = parseEvent({ name: "intent_set", props: { type: "rent_out", price: 90000 } });
    expect(typeof e).toBe("object");
    expect(parseEvent({ name: "hacked" })).toBe("unknown event");
    expect(parseEvent({ name: "intent_set", props: { x: { y: 1 } } })).toMatch(/primitive/);
    expect(parseEvent(null)).toMatch(/object/);
  });
});
