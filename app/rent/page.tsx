import Link from "next/link";
import { loadSnapshot, ownerConfirmedUnits } from "@/lib/data";
import { activeOrDefault, estimateValue, findBuilding } from "@/lib/market";
import { hasErrors, parseRentQuery } from "@/lib/forms";
import { rentAdvice } from "@/lib/insights";
import { renewalCheck, rentWatch, reraIndexProxy } from "@/lib/rent";
import { EXAMPLE_RATE, rentVsBuy } from "@/lib/finance";
import { aed, dateLabel, pct, roomsLabel, roundEstimate } from "@/lib/format";
import { AS_OF, DIGEST_MONTH } from "@/lib/types";
import { DEMO, prefill } from "@/lib/demo";
import { Track } from "../components/client";
import { BuildingSelect, FieldError, FooterNote, RoomsSelect, Source, TopBar } from "../ui";
import { AdviceCard } from "../components/insights";
import { OwnerConfirmedList, RenterReminders } from "../components/leads";
import { matchOwnerConfirmed, MATCH_WINDOW_DAYS } from "@/lib/renter";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const VERDICT = { below: "Below market", around: "Around market", above: "Above market" } as const;
const RDC_URL = "https://rdc.gov.ae/en/";

export default async function Rent({ searchParams }: Props) {
  const q = parseRentQuery(await searchParams);
  const { buildings, resales, rents } = loadSnapshot();
  // W8: renters can pick any JVC building (Ejari covers all of JVC); the one-building pilot is for owners.
  const b = (q.building ? findBuilding(buildings, q.building) : undefined) ?? activeOrDefault(buildings, null);
  const pilot = b.active;
  // A bad mortgage rate must not hide the rent check: it falls back to the example rate (message by the rate field).
  const { rate: rateError, ...blocking } = q.errors;
  const ok = q.submitted && !hasErrors(blocking) && q.sizeSqm && q.annualRent;

  const watch = ok ? rentWatch(rents, { building: b.name, sizeSqm: q.sizeSqm!, annualRent: q.annualRent! }, DIGEST_MONTH) : null;
  const index = ok ? reraIndexProxy(rents, q.sizeSqm!) : null;
  const renewal = ok && index ? renewalCheck(q.annualRent!, index.index, { askedIncrease: q.askedIncrease, leaseEnd: q.leaseEnd, today: AS_OF }) : null;
  const est = ok ? estimateValue(resales, { building: b.name, rooms: q.rooms, sizeSqm: q.sizeSqm! }) : null;
  const rate = q.rate ?? EXAMPLE_RATE;
  const rvb = est && ok ? rentVsBuy(est.mid, q.annualRent!, rate) : null;
  const owners = ok && pilot ? ownerConfirmedUnits() : [];
  const matches = matchOwnerConfirmed(owners, q.errors.end ? null : q.leaseEnd);
  const buyHref = `/buy?b=${b.slug}&rooms=${q.rooms}&size=${q.sizeSqm ?? ""}`;

  return (
    <main className="shell">
      <TopBar back="/" title="I rent" />
      <h1>Is my rent fair?</h1>
      <p className="lead">Compare with new Ejari leases in JVC, Aug – Oct 2026. No account needed.</p>

      <form className="card" method="get" action="/rent#results">
        <input type="hidden" name="go" value="1" />
        <BuildingSelect buildings={buildings} value={b.slug} allOpen />
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
        <div className="grid2">
          <div>
            <label htmlFor="rent">Annual rent, AED</label>
            <input id="rent" name="rent" inputMode="numeric" defaultValue={prefill(q.submitted, q.raw.rent, DEMO.renter.annualRent)} placeholder="e.g. 85000" aria-invalid={!!q.errors.rent} />
            <FieldError msg={q.errors.rent} />
          </div>
          <div>
            <label htmlFor="end">Lease ends</label>
            <input id="end" name="end" type="date" defaultValue={prefill(q.submitted, q.raw.end, DEMO.renter.leaseEnd)} aria-invalid={!!q.errors.end} />
            <FieldError msg={q.errors.end} />
          </div>
        </div>
        <label htmlFor="ask">Landlord asks for an increase, % (optional)</label>
        <input id="ask" name="ask" aria-invalid={!!q.errors.ask} inputMode="decimal" defaultValue={prefill(q.submitted, q.raw.ask, DEMO.renter.askedIncreasePct)} placeholder="e.g. 10" />
        <FieldError msg={q.errors.ask} />
        <div style={{ marginTop: 16 }}>
          <button className="btn" type="submit">Check my rent</button>
        </div>
      </form>

      <div id="results" />

      {ok && !watch ? (
        <div className="card warn">
          <h3>No similar new leases found</h3>
          <p className="meta">Check the size: we compare units within ±15% of yours.</p>
        </div>
      ) : null}

      {watch ? (
        <div className="card">
          <Track name="rent_checked" props={{ building: b.name, level: watch.level, verdict: watch.verdict }} />
          <p className="meta">Rent watch</p>
          <div className="big">{VERDICT[watch.verdict]}</div>
          <p>
            Your rent is <b className={watch.gap > 0.05 ? "neg" : watch.gap < -0.05 ? "pos" : ""}>{pct(watch.gap, 0, true)}</b> vs the median new
            lease ({aed(watch.stats.median, { compact: true })}; typical {aed(watch.stats.low, { compact: true })} –{" "}
            {aed(watch.stats.high, { compact: true })}). You pay more than {Math.round(watch.percentile)}% of {watch.stats.count} new leases.
          </p>
          <p className="meta">
            {watch.level === "building"
              ? `New leases in ${b.name}, your size ±15%: what you would pay if you moved now.`
              : `Fewer than 10 new leases of your size in ${b.name}, so we compare with all of JVC.`}
          </p>
          <Source kind="ejari">, new leases</Source>
        </div>
      ) : null}

      {watch ? (
        <AdviceCard
          advice={rentAdvice({ verdict: watch.verdict, gap: watch.gap, annualRent: q.annualRent!, median: watch.stats.median, maxIncrease: renewal?.maxIncrease ?? null })}
        />
      ) : null}

      {renewal ? (
        <div className="card">
          <h3>At renewal</h3>
          <p>
            Max increase allowed: <b>{pct(renewal.maxIncrease)}</b>
            {renewal.maxIncrease > 0 ? ` (up to ${aed(renewal.maxNewRent)} a year)` : ""}.
          </p>
          <p className="meta">
            Your rent is {renewal.belowIndex > 0 ? `${pct(renewal.belowIndex)} below` : `${pct(-renewal.belowIndex)} above`} the RERA index proxy of{" "}
            {aed(renewal.indexRent, { compact: true })} (all JVC contracts of your size, new and renewed). Bands of Decree 43/2013: up to 10% below: 0%;
            11–20%: 5%; 21–30%: 10%; 31–40%: 15%; over 40%: 20%.
          </p>
          {renewal.allowed != null ? (
            <p className={renewal.allowed ? "pos" : "neg"}>
              {renewal.allowed
                ? `A ${pct(renewal.askedIncrease!)} increase is within the limit.`
                : `A ${pct(renewal.askedIncrease!)} increase is above the limit.`}
            </p>
          ) : null}
          {renewal.noticeDeadline ? (
            <p className="meta">
              Any change to the terms needs 90 days&apos; notice before the lease ends: by {dateLabel(renewal.noticeDeadline)}
              {renewal.daysToNotice != null && renewal.daysToNotice < 0 ? " (already passed)" : ""}.
            </p>
          ) : null}
          <p className="meta">
            Official numbers: the DLD rental index calculator. Disputes: <a href={RDC_URL} target="_blank" rel="noreferrer">Rental Dispute Center</a>.
          </p>
          <Source kind="rera" />
        </div>
      ) : null}

      {ok && watch ? <RenterReminders leaseEnd={q.errors.end ? null : q.leaseEnd} building={b.name} /> : null}

      {owners.length ? (
        <div className="card">
          <Track name="owner_confirmed_viewed" props={{ count: owners.length, matched: matches.filter((m) => m.matched).length }} />
          <h3>Owner-confirmed units nearby</h3>
          <p className="meta">The owner told PF the unit is free from this date. No stale listings.</p>
          <p className="meta">
            {matches.some((m) => m.matched)
              ? `Units that free up within ${MATCH_WINDOW_DAYS} days of your lease end come first.`
              : "Add your lease end to see units that free up when you move."}
          </p>
          <OwnerConfirmedList units={matches} leaseEnd={q.leaseEnd} />
          <p className="tiny" style={{ marginTop: 8 }}>Sample units (synthetic data). Tap a unit to request a viewing.</p>
        </div>
      ) : ok && !pilot ? (
        <div className="card">
          <h3>Owner-confirmed units</h3>
          <p className="meta">No owner-confirmed units in {b.name} yet. Owners of Luma Park Views can already confirm when their unit is free.</p>
        </div>
      ) : null}

      {rvb && est ? (
        <div className="card">
          <Track name="rent_vs_buy_viewed" props={{ rooms: q.rooms, level: est.comps.level }} />
          <h3>Rent vs buy</h3>
          <p>
            A similar {roomsLabel(q.rooms)} {est.comps.level !== "jvc_rooms" ? `in ${b.name}` : "in JVC"} is worth about{" "}
            <b>{aed(roundEstimate(est.mid), { compact: true })}</b>.
          </p>
          <ul className="list">
            <li><span>Mortgage, 80% over 25 years at {pct(rate, 1)}</span><span>{aed(rvb.monthlyMortgage)} / mo</span></li>
            <li><span>Your rent</span><span>{aed(rvb.monthlyRent)} / mo</span></li>
            <li><span>Upfront: 20% down + 4% DLD fee</span><span>{aed(roundEstimate(rvb.upfront), { compact: true })}</span></li>
            <li><span>Price to rent</span><span>{rvb.priceToRent.toFixed(1)} years</span></li>
          </ul>
          <form method="get" action="/rent" className="row" style={{ marginTop: 8 }}>
            {(["b", "rooms", "size", "rent", "end", "ask"] as const).map((k) => {
              const v = { b: q.building, rooms: q.rooms, size: q.sizeSqm, rent: q.annualRent, end: q.leaseEnd, ask: q.askedIncrease != null ? q.askedIncrease * 100 : null }[k];
              return v != null && v !== "" ? <input key={k} type="hidden" name={k} value={String(v)} /> : null;
            })}
            <input name="rate" aria-label="Mortgage rate, %" inputMode="decimal" aria-invalid={!!rateError} defaultValue={(rate * 100).toFixed(2)} style={{ width: 96 }} />
            <button className="btn secondary inline" type="submit">Update rate, %</button>
          </form>
          <FieldError msg={rateError ? `${rateError}. Using the example rate.` : undefined} />
          <p className="hint">Excludes service charges, agency and bank fees.</p>
          {q.rate ? <Source kind="estimate" /> : <Source kind="example" />} <Source kind="dld" />
          <div style={{ marginTop: 12 }}>
            <Link className="btn dark" href={buyHref}>Check a resale price</Link>
          </div>
        </div>
      ) : null}
      <FooterNote />
    </main>
  );
}
