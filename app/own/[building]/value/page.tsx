import Link from "next/link";
import { loadSnapshot } from "@/lib/data";
import { monthlyPerSqm, valuationInsights, windowLabel } from "@/lib/insights";
import { ReadingSummary } from "../../../components/insights";
import { PriceChart } from "../../../components/price-chart";
import { estimateValue, findBuilding, outlook, pricePerSqm, type CompLevel, COMP_LEVEL_TEXT } from "@/lib/market";
import { parseUnitQuery } from "@/lib/owner";
import { aed, bulkLabel, dateLabel, pct, roomsLabel, roundEstimate, sqm } from "@/lib/format";
import { DealList, GetMonthly, Track } from "../../../components/client";
import { MethodSheet } from "../../../components/alerts";
import { updatePreview, IMPACT_WORD } from "@/lib/news";
import { Icon } from "../../../icons";
import { BuildingNotFound, ComingSoon, Empty, FooterNote, MissingUnit, Source, TopBar } from "../../../ui";

type Props = { params: Promise<{ building: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const LEVEL_TEXT = COMP_LEVEL_TEXT;

export default async function Valuation({ params, searchParams }: Props) {
  const { building: slug } = await params;
  const sp = await searchParams;
  const q = parseUnitQuery(sp);
  const { buildings, resales, rents } = loadSnapshot();
  const b = findBuilding(buildings, slug);
  if (!b) return <BuildingNotFound />;
  if (!b.active) return <ComingSoon name={b.name} />;
  if (!q) return <MissingUnit slug={slug} />;

  const unit = { building: b.name, rooms: q.rooms, sizeSqm: q.sizeSqm };
  const est = estimateValue(resales, unit);
  const back = `/own/${slug}?unit=${encodeURIComponent(q.unit)}&rooms=${q.rooms}&size=${q.sizeSqm}`;
  if (!est) {
    return (
      <main className="shell">
        <TopBar back={back} title="Valuation" />
        <Empty
          icon="∅"
          title="Not enough deals to value this unit"
          hint="No resales of this size in the last 3 months, even across JVC. Check the size or bedrooms."
          action={<Link className="btn" href={back}>Edit unit</Link>}
        />
      </main>
    );
  }
  const o = outlook(resales);
  const reading = valuationInsights(resales, rents, unit, est);
  const series = priceSeries(resales, b.name, q.rooms);
  const deals = [...est.comps.rows].sort((a, c) => c.date.localeCompare(a.date));
  const fromBuy = q.from === "buy";

  return (
    <main className="shell">
      <Track name="valuation_viewed" props={{ building: b.name, rooms: q.rooms, confidence: est.confidence, level: est.comps.level, from: q.from }} />
      <TopBar back={fromBuy ? "/buy" : back} title={`${b.name} · ${q.unit || "unit"}`} />
      <p className="meta" style={{ marginTop: 8 }}>
        {roomsLabel(q.rooms)} · {q.sizeSqm} m² · {b.name}
      </p>
      {fromBuy && q.pricePaid ? (
        <div className="card info">
          <p className="meta">From your price check: you paid {aed(q.pricePaid)}.</p>
        </div>
      ) : null}

      <div className="card">
        <p className="meta">PropWorth estimate today</p>
        <div className="big">{aed(roundEstimate(est.mid))}</div>
        <p className="range">
          Range {aed(roundEstimate(est.low))} – {aed(roundEstimate(est.high))}
          <br />
          {aed(est.perSqm)} per m²
        </p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <span className={`badge ${est.confidence === "high" ? "ok" : est.confidence === "low" ? "warn" : ""}`}>
            {est.confidence === "high" ? "High" : est.confidence === "medium" ? "Medium" : "Low"} confidence
          </span>
          <Source kind="estimate" />
          <Source kind="dld" />
        </div>
        {est.confidence === "low" ? (
          <p className="hint">
            Few resales like yours in the last 3 months, so we used {LEVEL_TEXT[est.comps.level]}. The range is wider.
          </p>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <DealList summary={`Based on ${deals.length} deals: ${LEVEL_TEXT[est.comps.level]}, Aug – Oct 2026`}>
            <ul className="list">
              {deals.slice(0, 25).map((d) => (
                <li key={d.id} className="deal">
                  <span>
                    {dateLabel(d.date)}
                    <span className="meta">
                      {d.rooms != null ? roomsLabel(d.rooms) : "–"}, {sqm(d.size_sqm)}
                      {bulkLabel(d.bulkCount)}
                      {est.comps.level === "jvc_rooms" && d.project ? ` · ${d.project}` : ""}
                    </span>
                  </span>
                  <span className="price">
                    {aed(d.value_aed, { compact: true })}
                    <span className="meta">{aed(pricePerSqm(d), { compact: true })}/m²</span>
                  </span>
                </li>
              ))}
            </ul>
            {deals.length > 25 ? <p className="tiny">and {deals.length - 25} more</p> : null}
            <Source kind="dld" />
          </DealList>
          <p className="meta" style={{ marginTop: 8 }}>
            <MethodSheet comps={deals.length} windowText={`${windowLabel(est.comps.window)} 2026`} levelText={LEVEL_TEXT[est.comps.level]} confidence={est.confidence} />
          </p>
        </div>
      </div>

      <ReadingSummary reading={reading} />

      <div className="card">
        <PriceChart series={series.series} title={series.title} />
        <Source kind="dld" />
      </div>

      <div className="card">
        <h3>Next 12 months</h3>
        <div className="mid">
          {aed(roundEstimate(est.mid * (1 + o.low)), { compact: true })} – {aed(roundEstimate(est.mid * (1 + o.high)), { compact: true })}
        </div>
        <p className="meta">
          {pct(o.low, 0, true)} to {pct(o.high, 0, true)} a year. JVC resale prices per m² moved {pct(o.trend, 0, true)} a year
          ({windowLabel(o.from)} vs {windowLabel(o.to)} 2026). The low end also allows for new supply in 2026 – 27.
        </p>
        <Source kind="estimate">, not advice</Source>
      </div>

      <UpdatePreview preview={updatePreview(resales, rents, b.name, q.rooms)} />

      <GetMonthly
        ctx={{ slug, building: b.name, unitNumber: q.unit, rooms: q.rooms, sizeSqm: q.sizeSqm }}
        prefillPaid={q.pricePaid}
        from={q.from}
      />
      <FooterNote />
    </main>
  );
}

/** Building vs JVC, same bedrooms if the building has enough monthly deals, else all flats. */
function priceSeries(resales: Parameters<typeof monthlyPerSqm>[0], building: string, rooms: number) {
  const sameRooms = monthlyPerSqm(resales, (r) => r.project === building && r.rooms === rooms);
  const useRooms = sameRooms.filter((p) => p.value != null).length >= 5;
  const label = rooms === 0 ? "studios" : `${rooms}BR`;
  return {
    title: useRooms ? `Median price per m², ${label}, 2026` : "Median price per m², all flats, 2026",
    series: [
      { name: building, color: "#6250d6", points: useRooms ? sameRooms : monthlyPerSqm(resales, (r) => r.project === building) },
      {
        name: "JVC",
        color: "#eb6834",
        points: monthlyPerSqm(resales, (r) => r.sub_type === "Flat" && (useRooms ? r.rooms === rooms : true)),
      },
    ],
  };
}

const IMPACT_ICON = { up: "▲", down: "▼", neutral: "•" } as const;

/** V18: what the monthly update adds, shown right above "Get this every month". */
function UpdatePreview({ preview }: { preview: ReturnType<typeof updatePreview> }) {
  const { move, news } = preview;
  return (
    <div className="card preview" aria-label="Every month you'll also get">
      <h3>Every month you&apos;ll also get</h3>
      <ul className="preview-list">
        {move ? (
          <li>
            <span className="bicon"><Icon name="chart" /></span>
            <span>
              <b>{move.title}</b>
              <span className="meta">Deals and new leases in your building</span>
              <span className="src">{move.source}</span>
            </span>
          </li>
        ) : null}
        <li>
          <span className="bicon"><Icon name="news" /></span>
          <span>
            <b>{news.title}</b>
            <span className={`impact ${news.impact}`}>
              <span aria-hidden>{IMPACT_ICON[news.impact]}</span> {IMPACT_WORD[news.impact]}: {news.impactText}
            </span>
            <span className="src illustrative">{news.source}</span>
          </span>
        </li>
        <li>
          <span className="bicon"><Icon name="bell" /></span>
          <span>
            <b>A reminder 90 days before your lease ends</b>
            <span className="meta">With the rent new tenants pay and the legal renewal increase</span>
          </span>
        </li>
      </ul>
    </div>
  );
}
