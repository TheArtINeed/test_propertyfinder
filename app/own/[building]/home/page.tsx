import Link from "next/link";
import { loadSnapshot } from "@/lib/data";
import { estimateValue } from "@/lib/market";
import { monthlyPerSqm, valuationInsights } from "@/lib/insights";
import { areaNews, ILLUSTRATIVE_POSTS, marketMoves } from "@/lib/news";
import { ReadingCard } from "../../../components/insights";
import { PriceChart } from "../../../components/price-chart";
import { AreaNewsBlock, Community, MarketMoves, NewsList, WhatsAppPreview } from "../../../components/feed";
import { buildDigest, digestMessage, RELET_DAYS, type Digest } from "@/lib/digest";
import { findBuilding, pricePerSqm } from "@/lib/market";
import { homeId, parseUnitQuery, type Home } from "@/lib/owner";
import { filterRents, renewalCheck, rentStats, reraIndexProxy } from "@/lib/rent";
import { aed, dateLabel, monthLabel, pct, roomsLabel, roundEstimate } from "@/lib/format";
import { AS_OF, DIGEST_MONTH, type RentRow } from "@/lib/types";
import { Track } from "../../../components/client";
import { HomePanel } from "../../../components/home-panel";
import { BuildingNotFound, ComingSoon, FooterNote, MissingUnit, Source, TopBar } from "../../../ui";

type Props = { params: Promise<{ building: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MyHome({ params, searchParams }: Props) {
  const { building: slug } = await params;
  const sp = await searchParams;
  const q = parseUnitQuery(sp);
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "update";
  const { buildings, resales, rents } = loadSnapshot();
  const b = findBuilding(buildings, slug);
  if (!b) return <BuildingNotFound />;
  if (!b.active) return <ComingSoon name={b.name} />;
  if (!q) return <MissingUnit slug={slug} />;

  const unit = { building: b.name, rooms: q.rooms, sizeSqm: q.sizeSqm };
  const details = { occupancy: q.occupancy, annualRent: q.annualRent, leaseEnd: q.leaseEnd, pricePaid: q.pricePaid, loan: q.loan };
  const d = buildDigest(resales, rents, unit, details);
  const valueUrl = `/own/${slug}/value?unit=${encodeURIComponent(q.unit)}&rooms=${q.rooms}&size=${q.sizeSqm}`;
  if (!d) {
    return <MissingUnit slug={slug} />;
  }

  // Fallback rent level when the building has no new leases of this size in M (C2).
  const jvcMonth = rentStats(filterRents(rents, { sizeSqm: q.sizeSqm, from: DIGEST_MONTH, to: DIGEST_MONTH, version: "New" }));
  const marketRent = d.rent.stats.count ? d.rent.stats.median : jvcMonth.count ? jvcMonth.median : null;
  const rera = d.rent.ownerRent ? renewalCheck(d.rent.ownerRent, reraIndexProxy(rents, q.sizeSqm).index, { leaseEnd: q.leaseEnd, today: AS_OF }) : null;

  const id = homeId(slug, q.unit || "unit");
  const fallback: Home = {
    id, building: b.name, slug, unitNumber: q.unit || "—", rooms: q.rooms, sizeSqm: q.sizeSqm, claimedAt: AS_OF,
    verification: "none", statusHistory: q.occupancy ? [{ status: q.occupancy, at: AS_OF }] : [], status: q.occupancy,
    ...details,
  };
  const est = { low: d.capital.low, mid: d.capital.value, high: d.capital.high };

  const blocks: Record<Digest["order"][number], React.ReactNode> = {
    rent: <RentBlock key="rent" d={d} jvc={jvcMonth} rera={rera} leaseEnd={q.leaseEnd} />,
    deals: <DealsBlock key="deals" d={d} rooms={q.rooms} />,
    demand: (
      <section key="demand">
        <h3>Demand</h3>
        <p>
          <b>{d.demand.searches.toLocaleString("en-US")}</b> people searched for a {roomsLabel(q.rooms)} in JVC up to{" "}
          {aed(d.demand.priceCap, { compact: true })} this month.
        </p>
        <Source kind="illustrative" />
      </section>
    ),
    capital: <CapitalBlock key="capital" d={d} />,
  };

  return (
    <main className="shell">
      <Track name="digest_opened" props={{ building: b.name, month: DIGEST_MONTH, occupancy: q.occupancy ?? null, next_step: d.nextStep.kind }} />
      <TopBar back={valueUrl} title="My Home" />
      <h1>
        {b.name} · {q.unit || "unit"}
      </h1>
      <p className="lead">
        {roomsLabel(q.rooms)} · {q.sizeSqm} m² · worth {aed(roundEstimate(d.capital.low), { compact: true })} –{" "}
        {aed(roundEstimate(d.capital.high), { compact: true })}
      </p>

      <nav className="tabs" aria-label="My Home sections">
        {TABS.map((t) => {
          const qs = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (k === "tab" || v == null ? [] : [[k, String(v)]])));
          if (t.id !== "update") qs.set("tab", t.id);
          return (
            <Link key={t.id} href={`/own/${slug}/home?${qs}`} aria-current={tab === t.id ? "page" : undefined}>
              {t.label}
            </Link>
          );
        })}
      </nav>

      {tab === "analysis" ? <Analysis resales={resales} rents={rents} unit={unit} d={d} /> : null}
      {tab === "news" ? (
        <>
          <div className="card" data-block="numbers">
            <h2>Market moves</h2>
            <p className="meta">Numbers from registered deals and leases in {b.name}.</p>
            <NewsList items={marketMoves(resales, rents, b.name, q.rooms)} />
          </div>
          <hr className="divider" />
          <AreaNewsBlock items={areaNews()} building={b.name} />
        </>
      ) : null}
      {tab === "community" ? <Community posts={ILLUSTRATIVE_POSTS} building={b.name} /> : null}

      {tab === "update" ? (
      <>
      {/* N1: all numbers in one block; news never sits between number cards. */}
      <div className="digest" aria-label="Monthly update preview" data-block="numbers">
        <div className="head">
          <p className="meta">Your monthly update · {monthLabel(d.month)}</p>
          <h2 style={{ margin: 0 }}>The numbers</h2>
        </div>
        {d.order.map((k) => blocks[k])}
        <section>
          <div className="between">
            <h3>Gross yield</h3>
            <span className="mid">{d.yield.unit != null ? pct(d.yield.unit, 1) : "–"}</span>
          </div>
          <p className="meta">
            {d.rent.ownerRent ? "Your rent" : "Typical new-lease rent here"} / estimated value. JVC flats: {pct(d.yield.jvcMedian, 1)}.
          </p>
          <Source kind="ejari" /> <Source kind="estimate" />
        </section>
        <MarketMoves items={marketMoves(resales, rents, b.name, q.rooms)} />
        <section className="step">
          <h3>Next step</h3>
          <p>{d.nextStep.title}</p>
          {d.nextStep.illustrative ? <Source kind="illustrative" /> : null}
          {d.nextStep.kind !== "keep" ? (
            <Link className="btn inline" href="#intent" style={{ marginTop: 8 }}>
              Set my plans
            </Link>
          ) : null}
        </section>
      </div>

      <WhatsAppPreview lines={digestMessage(d, b.name, q.unit || "unit", `pf.ae/my-home/${slug}`)} />

      <HomePanel id={id} fallback={fallback} estimate={est} marketRent={marketRent} />

      <hr className="divider" />
      <AreaNewsBlock items={areaNews()} building={b.name} />
      </>
      ) : null}
      <FooterNote />
    </main>
  );
}

function RentBlock({
  d,
  jvc,
  rera,
  leaseEnd,
}: {
  d: Digest;
  jvc: ReturnType<typeof rentStats>;
  rera: ReturnType<typeof renewalCheck> | null;
  leaseEnd: string | null;
}) {
  const s = d.rent.stats;
  const days = d.rent.daysToLeaseEnd;
  return (
    <section>
      <h3>Rent</h3>
      {s.count ? (
        <p>
          <b>{s.count}</b> new {s.count === 1 ? "lease" : "leases"} for your size in the building: median {aed(s.median, { compact: true })}
          {s.count > 1 ? ` (${aed(s.low, { compact: true })} – ${aed(s.high, { compact: true })})` : ""} a year.
        </p>
      ) : (
        <p>
          No new leases of your size in the building this month.
          {jvc.count ? ` JVC: ${jvc.count} new leases, median ${aed(jvc.median, { compact: true })} a year.` : ""}
        </p>
      )}
      {d.rent.ownerRent ? (
        <p className="meta">
          You get {aed(d.rent.ownerRent, { compact: true })}
          {d.rent.ownerGap != null ? `, ${pct(d.rent.ownerGap, 0, true)} vs new leases` : ""}.
          {rera ? ` At renewal the rent can go up by at most ${pct(rera.maxIncrease)} (RERA index proxy ${aed(rera.indexRent, { compact: true })}).` : ""}
        </p>
      ) : null}
      {days != null && leaseEnd ? (
        <p className="meta">
          Lease ends {dateLabel(leaseEnd)}:{" "}
          {days < 0 ? "already ended." : days <= RELET_DAYS ? `re-let window is open (${days} days left).` : `re-let window opens in ${days - RELET_DAYS} days.`}
        </p>
      ) : null}
      <Source kind="ejari" />
      {rera ? <> <Source kind="rera" /></> : null}
    </section>
  );
}

function DealsBlock({ d, rooms }: { d: Digest; rooms: number }) {
  const like = d.deals.likeYours;
  return (
    <section>
      <h3>Deals</h3>
      {d.deals.all.length === 0 ? (
        <p>No resales in the building this month. Your estimate uses the last 3 months.</p>
      ) : like.length ? (
        <p>
          <b>{like.length}</b> {roomsLabel(rooms)} {like.length === 1 ? "flat" : "flats"} like yours sold for{" "}
          {aed(Math.min(...like.map((r) => r.value_aed)), { compact: true })}
          {like.length > 1 ? ` – ${aed(Math.max(...like.map((r) => r.value_aed)), { compact: true })}` : ""}.
          {d.deals.all.length > like.length ? ` ${d.deals.all.length} resales in the building in total.` : ""}
        </p>
      ) : (
        <p>
          {d.deals.all.length} resales in the building, none with your number of bedrooms.
        </p>
      )}
      {d.deals.all.length ? (
        <ul className="list meta">
          {d.deals.all.slice(0, 5).map((r) => (
            <li key={r.id}>
              <span>
                {dateLabel(r.date)} · {r.rooms != null ? roomsLabel(r.rooms) : "–"}, {r.size_sqm} m²
              </span>
              <span>
                {aed(r.value_aed, { compact: true })} · {aed(pricePerSqm(r), { compact: true })}/m²
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="meta">3-month median for units like yours: {d.deals.rollingPerSqm ? aed(d.deals.rollingPerSqm) : "–"} / m².</p>
      <Source kind="dld" />
    </section>
  );
}

function CapitalBlock({ d }: { d: Digest }) {
  const c = d.capital;
  return (
    <section>
      <h3>Your capital</h3>
      <p>
        Value {aed(roundEstimate(c.low), { compact: true })} – {aed(roundEstimate(c.high), { compact: true })}
        {c.changeVsPrev != null ? (
          <>
            , <span className={c.changeVsPrev >= 0 ? "pos" : "neg"}>{pct(c.changeVsPrev, 1, true)}</span> vs last month
          </>
        ) : null}
        .
      </p>
      {c.equity != null ? <p className="meta">Equity after your loan: about {aed(roundEstimate(c.equity), { compact: true })}.</p> : null}
      {c.gain != null ? (
        <p className="meta">
          Vs what you paid, incl. the 4% DLD fee: <span className={c.gain >= 0 ? "pos" : "neg"}>{aed(roundEstimate(c.gain), { compact: true })}</span>.
        </p>
      ) : null}
      <Source kind="estimate" />
    </section>
  );
}

const TABS = [
  { id: "update", label: "Update" },
  { id: "analysis", label: "Analysis" },
  { id: "news", label: "News" },
  { id: "community", label: "Owners" },
] as const;

function Analysis({ resales, rents, unit, d }: { resales: Parameters<typeof monthlyPerSqm>[0]; rents: RentRow[]; unit: { building: string; rooms: number; sizeSqm: number }; d: Digest }) {
  const est = estimateValue(resales, unit)!;
  const reading = valuationInsights(resales, rents, unit, est);
  return (
    <>
      <ReadingCard reading={reading} />
      <div className="card">
        <PriceChart
          title="Median price per m², all flats, 2026"
          series={[
            { name: unit.building, color: "#6250d6", points: monthlyPerSqm(resales, (r) => r.project === unit.building) },
            { name: "JVC", color: "#eb6834", points: monthlyPerSqm(resales, (r) => r.sub_type === "Flat") },
          ]}
        />
        <Source kind="dld" />
      </div>
      <div className="card">
        <div className="between">
          <h3>Gross yield</h3>
          <span className="mid">{d.yield.unit != null ? pct(d.yield.unit, 1) : "–"}</span>
        </div>
        <p className="meta">JVC flats: {pct(d.yield.jvcMedian, 1)}.</p>
        <Source kind="ejari" /> <Source kind="estimate" />
      </div>
    </>
  );
}
