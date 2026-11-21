import { loadSnapshot } from "@/lib/data";
import { buildingDealsInMonth, estimateValue } from "@/lib/market";
import { aed, roundEstimate, sqm } from "@/lib/format";
import { DIGEST_MONTH, HERO_BUILDING } from "@/lib/types";
import { TrackLink } from "../components/client";
import { FooterNote, TopBar } from "../ui";

const HOME = "/own/luma-park-views";

/**
 * Where My Home plugs into the rest of the site: mock fragments of existing surfaces,
 * each with the hook the user would see. Why each hook works is in the README (W2: no reviewer copy in the UI).
 */
export default function EntryPoints() {
  const { resales } = loadSnapshot();
  const est = estimateValue(resales, { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 })!;
  const deal = buildingDealsInMonth(resales, HERO_BUILDING, DIGEST_MONTH).find((r) => r.rooms === 1);

  const points: { src: string; surface: string; mock: React.ReactNode; hook: string; href: string }[] = [
    {
      src: "listing_page",
      surface: "Listing page, unit for sale in the building",
      mock: (
        <>
          <b>AED 1,350,000</b>
          <span className="meta">1 bed · 80 m² · Luma Park Views, JVC</span>
        </>
      ),
      hook: "Own a flat in Luma Park Views? See what yours is worth",
      href: HOME,
    },
    {
      src: "transactions",
      surface: "Transactions tab, recent deals",
      mock: deal ? (
        <>
          <b>{aed(deal.value_aed)}</b>
          <span className="meta">Sold · 1 bed · {sqm(deal.size_sqm)} · Luma Park Views</span>
        </>
      ) : (
        <b>Recent deals</b>
      ),
      hook: "Own one here? Get deals like this for your unit every month",
      href: HOME,
    },
    {
      src: "propworth_result",
      surface: "PropWorth result (today's valuation)",
      mock: <b>Your home is worth {aed(roundEstimate(est.low), { compact: true })} – {aed(roundEstimate(est.high), { compact: true })}</b>,
      hook: "Get this every month",
      href: `${HOME}/value?unit=1204&rooms=1&size=80`,
    },
    {
      src: "account_tab",
      surface: "Account tab in the app",
      mock: <b>Saved searches · Alerts · Settings</b>,
      hook: "My Home: add the home you own",
      href: "/own",
    },
    {
      src: "rent_results",
      surface: "Rent search results in JVC",
      mock: <b>1 bed apartments for rent in JVC · 1,240 results</b>,
      hook: "Already renting in JVC? Check if your rent is fair before renewal",
      href: "/rent",
    },
    {
      src: "mortgage_calculator",
      surface: "Mortgage calculator on a resale listing",
      mock: <b>Monthly payment AED 5,736</b>,
      hook: "Will the bank value it at the price? Check before you offer",
      href: "/buy?b=luma-park-views&rooms=1&size=80&price=1350000",
    },
  ];

  return (
    <main className="shell">
      <TopBar back="/" title="Entry points" />
      <h1>Where people find My Home</h1>
      <p className="lead">Sketches of existing Property Finder screens with a My Home hook. Tap a hook to enter the flow.</p>
      {points.map((p) => (
        <div className="card" key={p.src}>
          <p className="tiny">{p.surface}</p>
          <div className="mock">{p.mock}</div>
          <TrackLink className="hook" href={p.href} name="entry_point_clicked" props={{ src: p.src }}>
            <span>{p.hook}</span>
            <span aria-hidden>›</span>
          </TrackLink>
        </div>
      ))}
      <p className="tiny">Mock screens for the prototype; listing and calculator numbers are examples.</p>
      <FooterNote />
    </main>
  );
}
