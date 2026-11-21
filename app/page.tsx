import Link from "next/link";
import { loadSnapshot } from "@/lib/data";
import { estimateValue } from "@/lib/market";
import { buildDigest } from "@/lib/digest";
import { aed, roundEstimate } from "@/lib/format";
import { HERO_BUILDING } from "@/lib/types";
import { FooterNote, TopBar } from "./ui";
import { MyHomes } from "./components/client";
import { Icon } from "./icons";

/** Pitch screen: why come, what you get, why save the home, then the three entries. */
export default function Home() {
  const { resales, rents } = loadSnapshot();
  const sample = { building: HERO_BUILDING, rooms: 1, sizeSqm: 80 };
  const est = estimateValue(resales, sample)!;
  const d = buildDigest(resales, rents, sample, { occupancy: "let", annualRent: 85_000, leaseEnd: "2027-01-31" })!;

  return (
    <main className="shell">
      <TopBar />
      <section className="hero">
        <span className="badge coral">New · Pilot in JVC</span>
        <h1>Your home is your biggest asset. Track it like one.</h1>
        <p className="lead">
          What your flat is worth today, what it rents for, what is being built next door. Every month, from real Dubai
          Land Department deals, not asking prices.
        </p>
        <div className="stack">
          <Link className="btn" href="/own">
            Get your PropWorth estimate, free
          </Link>
          <Link className="btn secondary" href="/rent">
            I rent: is my rent fair?
          </Link>
        </div>
        <p className="hint" style={{ textAlign: "center" }}>No sign-up to see the value. 20 seconds.</p>
      </section>

      <MyHomes />

      <div className="card">
        <h2>What you get</h2>
        <ul className="benefits">
          <li>
            <span className="bicon"><Icon name="chart" /></span>
            <div>
              <h3>Your value, every month</h3>
              <p className="meta">A range from registered resales in your building, and how it moves vs JVC.</p>
            </div>
          </li>
          <li>
            <span className="bicon"><Icon name="key" /></span>
            <div>
              <h3>Rent it right</h3>
              <p className="meta">New leases in your building, the legal renewal increase, a reminder 90 days before the lease ends.</p>
            </div>
          </li>
          <li>
            <span className="bicon"><Icon name="news" /></span>
            <div>
              <h3>News that moves your price</h3>
              <p className="meta">Deals, a new tower that may block the view, a new school: each with its likely effect on value.</p>
            </div>
          </li>
          <li>
            <span className="bicon"><Icon name="phone" /></span>
            <div>
              <h3>Agents only on your terms</h3>
              <p className="meta">Say “not now”, “rent out from March” or “offers from AED 1.4M”. No cold calls; a verified agent only when you ask.</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="card tint">
        <p className="meta">What a monthly update looks like · Luma Park Views, 1BR</p>
        <ul className="list kv">
          <li><span>Worth</span><b>{aed(roundEstimate(est.low), { compact: true })} – {aed(roundEstimate(est.high), { compact: true })}</b></li>
          <li><span>New leases, Oct</span><b>{d.rent.stats.count}, median {aed(d.rent.stats.median, { compact: true })}</b></li>
          <li><span>1BR resales, Oct</span><b>{d.deals.likeYours.length}</b></li>
          <li><span>Next step</span><b>{d.nextStep.title}</b></li>
        </ul>
        <span className="src">DLD registered resales and Ejari contracts, 2026</span>
      </div>

      <div className="card">
        <h2>How it works</h2>
        <ol className="steps">
          <li><b>Find your unit.</b> Building, bedrooms, size.</li>
          <li><b>See the value.</b> Range, the deals behind it, what it means.</li>
          <li><b>Save your home.</b> Get the update every month by email or WhatsApp and join the owners of your building.</li>
        </ol>
        <p className="meta">
          Why save it? The valuation is free without an account. Saving keeps your home, sends the monthly update, and lets
          you set your plans so agents call only when you want.
        </p>
      </div>

      <h2 style={{ marginTop: 24 }}>Not an owner?</h2>
      <Link className="entry" href="/rent">
        <span className="icon"><Icon name="key" size={22} /></span>
        <h2>I rent</h2>
        <p className="meta">Is my rent fair? How much can it go up at renewal? What would buying cost?</p>
      </Link>
      <Link className="entry" href="/buy">
        <span className="icon"><Icon name="tag" size={22} /></span>
        <h2>I&apos;m buying a resale</h2>
        <p className="meta">Is the price fair? Will the bank value it lower? Then track it as your home.</p>
      </Link>

      <p className="meta" style={{ textAlign: "center", marginTop: 16 }}>
        <Link href="/entry-points">Where people find My Home on Property Finder ›</Link>
      </p>
      <FooterNote />
    </main>
  );
}
