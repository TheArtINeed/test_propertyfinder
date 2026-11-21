"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSavedHomes } from "./use-homes";
import { aed, dateLabel, pct, roomsLabel, roundEstimate } from "@/lib/format";
import { addHomePath, getHomes, JUST_SAVED_KEY, STATUS_LABEL, type AddType, type Home } from "@/lib/owner";
import { combinedPricePaid, portfolioCount, sortByUrgency, unvaluedIds, urgency, type Portfolio, type PortfolioLine } from "@/lib/portfolio";
import { GoldenVisaLine } from "./golden-visa";
import { track } from "@/lib/track";
import { Icon } from "../icons";
import { homeUrl, Waitlist } from "./client";

/** Saved homes, kept fresh across tabs and back-navigation. */
export const useHomes = useSavedHomes;

const JUST_SAVED = JUST_SAVED_KEY;

/** P2: "PropWorth · N" in the top bar whenever the user has saved homes. */
export function PortfolioPill() {
  const homes = useHomes();
  if (!homes || !homes.length) return null;
  return (
    <Link className="pill-link" href="/propworth" aria-label={`PropWorth, ${homes.length} homes`}>
      PropWorth · {homes.length}
    </Link>
  );
}

/** First screen actions (D10): one link per destination. With saved homes the main button opens PropWorth. */
export function HeroCta() {
  const homes = useHomes();
  const n = homes?.length ?? 0;
  return (
    <div className="stack">
      {n ? (
        <Link className="btn" href="/propworth">
          Open my PropWorth ({n} {n === 1 ? "home" : "homes"})
        </Link>
      ) : (
        <Link className="btn" href="/own">
          Get your PropWorth estimate, free
        </Link>
      )}
      <Link className="btn secondary" href="/rent">
        I rent: is my rent fair?
      </Link>
      <Link className="linkbtn center" href="/buy">
        Buying a resale? Check the price
      </Link>
    </div>
  );
}

/** P10: confirmation on My Home right after saving. Shows once. */
export function JustSavedBanner({ homeId }: { homeId: string }) {
  const homes = useHomes();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(JUST_SAVED) === homeId) {
        sessionStorage.removeItem(JUST_SAVED);
        setShow(true);
      }
    } catch {
      /* storage blocked */
    }
  }, [homeId]);
  if (!show || !homes) return null;
  return <SavedBanner count={homes.length} />;
}

/** P10 + P11: the confirmation, with the natural next step: add another home. */
export function SavedBanner({ count }: { count: number }) {
  return (
    <div className="saved-banner stacked" role="status">
      <span>
        <b>Saved to your PropWorth</b> · {count} {count === 1 ? "home" : "homes"}
      </span>
      <span className="saved-actions">
        <Link href="/propworth">See all homes ›</Link>
        <AddHomeButton className="linkbtn" label="+ Add another home" />
      </span>
    </div>
  );
}

const TYPES: [AddType, string][] = [
  ["apartment", "Apartment"],
  ["villa", "Villa or townhouse"],
  ["office", "Office or shop"],
];

/** P3: "Add a home" chooser: type, then where. Pilot apartment -> valuation; anything else -> coming soon. */
export function AddHomeButton({ className = "btn secondary", label = "+ Add a home" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AddType>("apartment");
  const [where, setWhere] = useState<"pilot" | "other">("pilot");
  const path = addHomePath(type, where);
  return (
    <>
      <button className={className} type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Add a home" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="between">
              <h2>Add a home to your PropWorth</h2>
              <button className="linkbtn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <label>What is it?</label>
            <div className="chips" role="group" aria-label="Property type">
              {TYPES.map(([t, l]) => (
                <button key={t} className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
                  {l}
                </button>
              ))}
            </div>
            <label>Where?</label>
            <div className="chips" role="group" aria-label="Location">
              <button className="chip" aria-pressed={where === "pilot"} onClick={() => setWhere("pilot")}>
                Luma Park Views, JVC
              </button>
              <button className="chip" aria-pressed={where === "other"} onClick={() => setWhere("other")}>
                Another building or area
              </button>
            </div>
            <div style={{ marginTop: 16 }}>
              {path.kind === "valuation" ? (
                <Link className="btn" href={path.href} onClick={() => track("home_add_started", { type, where })}>
                  Continue
                </Link>
              ) : (
                <div onClick={() => track("home_add_started", { type, where })}>
                  <Waitlist name={`${TYPES.find(([t]) => t === type)![1]}${where === "pilot" ? " in Luma Park Views" : " in another building"}`} />
                </div>
              )}
            </div>
            <p className="hint">PropWorth estimates are open for apartments in Luma Park Views first. Other homes follow.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** P1 + P7: the portfolio page. */
export function PortfolioView() {
  const homes = useHomes();
  const [summary, setSummary] = useState<Portfolio | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const openedLogged = useRef(false);

  useEffect(() => {
    try {
      setAdded(new URLSearchParams(window.location.search).get("added"));
    } catch {
      /* no window */
    }
  }, []);

  useEffect(() => {
    if (!homes) return;
    if (!openedLogged.current) {
      openedLogged.current = true; // once per visit
      track("portfolio_opened", { homes: homes.length });
    }
    if (!homes.length) return;
    fetch("/api/portfolio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ homes }) })
      .then((r) => r.json())
      .then((j: { ok: boolean; portfolio?: Portfolio }) => setSummary(j.ok && j.portfolio ? j.portfolio : null))
      .catch(() => setSummary(null));
  }, [homes]);

  if (!homes) return <p className="meta">Loading your homes…</p>;

  if (!homes.length)
    return (
      <div className="card empty" data-testid="portfolio-empty">
        <div className="icon"><Icon name="home" size={32} /></div>
        <h3>No homes yet</h3>
        <p className="meta">PropWorth keeps all your homes in one place: what each is worth, what it rents for and what needs attention.</p>
        <Link className="btn" href="/own?from=propworth">Get your first PropWorth estimate</Link>
      </div>
    );

  const byId = new Map(homes.map((h) => [h.id, h]));
  const lines = summary ? sortByUrgency(summary.lines) : [];
  const addedHome = added ? byId.get(added) : undefined;

  return (
    <>
      {addedHome && summary ? (
        <p className="saved-banner static" role="status">
          <span>
            <b>Added {addedHome.building} · {addedHome.unitNumber}.</b> {portfolioCount(homes.length, summary.count).label}, total{" "}
            {aed(roundEstimate(summary.low), { compact: true })} – {aed(roundEstimate(summary.high), { compact: true })}
          </span>
        </p>
      ) : null}

      <div className="card">
        <p className="meta">
          Your PropWorth · {portfolioCount(homes.length, summary?.count ?? homes.length).label}
        </p>
        {summary ? (
          <>
            <div className="big total">
              {aed(roundEstimate(summary.low), { compact: true })} – {aed(roundEstimate(summary.high), { compact: true })}
            </div>
            <p className="meta">
              {summary.rentIn != null && summary.yield != null
                ? `Rent in ${aed(summary.rentIn, { compact: true })} a year · gross yield ${pct(summary.yield, 1)}`
                : "No let homes yet"}
            </p>
            {portfolioCount(homes.length, summary.count).valueNote ? (
              <p className="hint">{portfolioCount(homes.length, summary.count).valueNote}.</p>
            ) : null}
            <GoldenVisaLine estimate={summary.mid} pricePaid={combinedPricePaid(homes)} scope="portfolio" />
            <span className="src">PropWorth estimate · DLD registered resales, 2026</span>
          </>
        ) : (
          <p className="meta">Counting…</p>
        )}
      </div>

      <div className="between" style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>Your homes</h2>
        <AddHomeButton className="linkbtn" label="+ Add" />
      </div>
      <ul className="homes">
        {(summary ? lines : homes.map((h) => ({ id: h.id }) as PortfolioLine)).map((l) => {
          const h = byId.get(l.id);
          if (!h) return null;
          const rentYield = h.occupancy === "let" && h.annualRent && l.mid ? h.annualRent / l.mid : null;
          const urgent = summary ? urgency(l) != null : false;
          return (
            <li key={h.id}>
              <Link className={`home-card ${urgent ? "urgent" : ""}`} href={homeUrl(h)}>
                <span className="between">
                  <b>{h.building} · {h.unitNumber}</b>
                  <span className="badge">{h.status ? STATUS_LABEL[h.status] : "Not set"}</span>
                </span>
                <span className="meta">{roomsLabel(h.rooms)} · {h.sizeSqm} m²</span>
                {l.low ? (
                  <span className="mid">
                    {aed(roundEstimate(l.low), { compact: true })} – {aed(roundEstimate(l.high), { compact: true })}
                  </span>
                ) : null}
                {h.occupancy === "let" && h.annualRent ? (
                  <span className="meta">
                    Rent {aed(h.annualRent, { compact: true })} a year{h.leaseEnd ? ` · lease ends ${dateLabel(h.leaseEnd)}` : ""}
                    {rentYield ? ` · yield ${pct(rentYield, 1)}` : ""}
                  </span>
                ) : null}
                {l.nextStep ? (
                  <span className={`next ${urgent ? "urgent" : ""}`}>
                    {urgent ? "Needs attention: " : ""}
                    {l.nextStep.title}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
        {unvaluedIds(homes.map((h) => h.id), summary).map((id) => {
          const h = byId.get(id)!;
          return (
            <li key={id}>
              <div className="home-card unvalued">
                <span className="between">
                  <b>{h.building} · {h.unitNumber}</b>
                  <span className="badge">{h.status ? STATUS_LABEL[h.status] : "Not set"}</span>
                </span>
                <span className="meta">{roomsLabel(h.rooms)} · {h.sizeSqm} m²</span>
                <span className="next">PropWorth estimate coming soon for this building.</span>
              </div>
            </li>
          );
        })}
      </ul>
      <AddHomeButton />
    </>
  );
}
