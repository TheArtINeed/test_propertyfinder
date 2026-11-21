import { loadSnapshot } from "@/lib/data";
import { activeOrDefault, estimateValue } from "@/lib/market";
import { hasErrors, parseBuyQuery } from "@/lib/forms";
import { buyAdvice } from "@/lib/insights";
import { bankGap } from "@/lib/finance";
import { boughtThisQuery } from "@/lib/owner";
import { aed, pct, roomsLabel, roundEstimate } from "@/lib/format";
import { DEMO, prefill } from "@/lib/demo";
import { TrackLink } from "../components/client";
import { BuildingSelect, FieldError, FooterNote, RoomsSelect, Source, TopBar } from "../ui";
import { AdviceCard } from "../components/insights";
import { BuyerNextSteps } from "../components/leads";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Buy({ searchParams }: Props) {
  const q = parseBuyQuery(await searchParams);
  const { buildings, resales } = loadSnapshot();
  const b = activeOrDefault(buildings, q.building);
  const ok = q.submitted && !hasErrors(q.errors);
  const est = ok ? estimateValue(resales, { building: b.name, rooms: q.rooms, sizeSqm: q.sizeSqm! }) : null;
  const gap = est && q.asking ? bankGap(q.asking, est) : null;
  const slug = b.slug;
  const position = est && q.asking ? (q.asking > est.high ? "above" : q.asking < est.low ? "below" : "within") : null;

  return (
    <main className="shell">
      <TopBar back="/" title="Check a resale price" />
      <h1>Is the price fair?</h1>
      <p className="lead">Before you make an offer: compare with registered resales and see what the bank may lend.</p>

      <form className="card" method="get" action="/buy#results">
        <input type="hidden" name="go" value="1" />
        <BuildingSelect buildings={buildings} value={b.slug} />
        <div className="grid2">
          <div>
            <RoomsSelect value={q.rooms} />
          </div>
          <div>
            <label htmlFor="size">Size, m²</label>
            <input id="size" name="size" inputMode="decimal" defaultValue={prefill(q.submitted, q.raw.size, DEMO.sizeSqm)} placeholder="e.g. 80" aria-invalid={!!q.errors.size} />
            <FieldError msg={q.errors.size} />
          </div>
        </div>
        <label htmlFor="price">Asking price, AED</label>
        <input id="price" name="price" inputMode="numeric" defaultValue={prefill(q.submitted, q.raw.price, DEMO.buyer.asking)} placeholder="e.g. 1250000" aria-invalid={!!q.errors.price} />
        <FieldError msg={q.errors.price} />
        <div style={{ marginTop: 16 }}>
          <button className="btn" type="submit">Check the price</button>
        </div>
      </form>

      <div id="results" />

      {ok && !est ? (
        <div className="card warn">
          <h3>Not enough deals to judge this price</h3>
          <p className="meta">No resales of this size and bedrooms in JVC in the last 3 months. Check the size.</p>
        </div>
      ) : null}

      {est && gap && q.asking ? (
        <>
          <div className="card">
            <p className="meta">Fair price for a {roomsLabel(q.rooms)}, {q.sizeSqm} m²</p>
            <div className="big">
              {aed(roundEstimate(est.low), { compact: true })} – {aed(roundEstimate(est.high), { compact: true })}
            </div>
            <p>
              The asking price is <b className={position === "above" ? "neg" : position === "below" ? "pos" : ""}>{pct(gap.gapToEstimate / est.mid, 0, true)}</b>{" "}
              vs the estimate of {aed(roundEstimate(est.mid), { compact: true })}:{" "}
              {position === "above" ? "above the usual range." : position === "below" ? "below the usual range. Check why." : "within the usual range."}
            </p>
            <p className="meta">
              Based on {est.comps.rows.length} resales, Aug – Oct 2026
              {est.comps.level === "building_rooms" ? ` in ${b.name}` : est.comps.level === "building_any" ? ` in ${b.name}, all unit types` : " in JVC"}.
            </p>
            <Source kind="dld" /> <Source kind="estimate" />
          </div>

          <AdviceCard advice={buyAdvice(q.asking, est)} />

          <div className={`card ${gap.overP75 ? "warn" : ""}`}>
            <h3>Bank valuation</h3>
            {gap.overP75 ? (
              <p>
                The bank may value it below the price. Banks lend up to 80% of the <i>lower</i> of price and valuation, so the gap is paid in cash.
              </p>
            ) : (
              <p>The price is not above the usual range, so a low bank valuation is less likely.</p>
            )}
            <ul className="list">
              <li><span>Cash if valued at the price (20%)</span><span>{aed(roundEstimate(gap.cashIfValuedAtPrice), { compact: true })}</span></li>
              <li><span>Cash if valued at our estimate</span><span>{aed(roundEstimate(gap.cashNeeded), { compact: true })}</span></li>
              <li><span>Extra cash</span><span className={gap.extraCash > 0 ? "neg" : ""}>{aed(roundEstimate(gap.extraCash), { compact: true })}</span></li>
            </ul>
            <p className="hint">Example with 80% loan-to-value; plus 4% DLD fee and other costs. Your bank&apos;s valuation decides.</p>
            <Source kind="estimate" />
          </div>

          <BuyerNextSteps asking={q.asking} building={b.name} rooms={q.rooms} />

          <div className="card tint">
            <h3>Bought it?</h3>
            <p className="meta">Keep the same estimate as your home&apos;s value and get a monthly update on rents and deals.</p>
            <TrackLink
              className="btn"
              name="bought_this"
              props={{ building: b.name, rooms: q.rooms }}
              href={`/own/${slug}/value?${boughtThisQuery({ unit: q.unit || undefined, rooms: q.rooms, sizeSqm: q.sizeSqm!, pricePaid: q.asking })}`}
            >
              I bought this
            </TrackLink>
          </div>
        </>
      ) : null}
      <FooterNote />
    </main>
  );
}
