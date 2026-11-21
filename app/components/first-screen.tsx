"use client";

import { aed, monthLabel, roomsLabel, roundEstimate } from "@/lib/format";
import { BENEFITS, TRUST_LINE, type Proof } from "@/lib/first-screen";
import { track } from "@/lib/track";
import { Icon } from "../icons";
import { MyHomes } from "./client";
import { HeroCta, useHomes } from "./portfolio";

/** F10b: real numbers for the pilot building, so the promise is backed by data on the first screen. */
export function ProofCard({ proof }: { proof: Proof }) {
  return (
    <div className="card tint" data-testid="proof-card">
      <span className="badge">Example</span>
      <h3 style={{ margin: "8px 0 0" }}>What PropWorth shows for a {roomsLabel(proof.rooms)} in {proof.building}</h3>
      <p className="meta">
        Real numbers for {monthLabel(proof.month)}, our pilot building in JVC
      </p>
      <ul className="list kv">
        <li>
          <span>{roomsLabel(proof.rooms)} worth</span>
          <b>
            {aed(roundEstimate(proof.low), { compact: true })} – {aed(roundEstimate(proof.high), { compact: true })}
          </b>
        </li>
        {proof.rentMedian != null ? (
          <li>
            <span>New leases, median</span>
            <b>{aed(proof.rentMedian, { compact: true })} / year</b>
          </li>
        ) : null}
        <li>
          <span>Resales in the building</span>
          <b>{proof.resales}</b>
        </li>
      </ul>
      <span className="src">DLD registered resales and Ejari contracts</span>
    </div>
  );
}

/** F10c: what you get after the first estimate, one line each. */
export function Benefits() {
  return (
    <ul className="benefits compact" data-testid="benefits">
      {BENEFITS.map((b) => (
        <li key={b.icon}>
          <span className="bicon">
            <Icon name={b.icon} />
          </span>
          <span>{b.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function TrustLine() {
  return (
    <p className="hint center" data-testid="trust-line">
      {TRUST_LINE}
    </p>
  );
}

/**
 * Spec section 24: a first-time user gets the actions, a trust line, real numbers and what they get;
 * a returning owner (F10e) sees their PropWorth first and the value blocks folded into one line.
 * The actions stay inside the hero section (W1: renter entry without scrolling).
 */
export function FirstScreen({ proof, children }: { proof: Proof | null; children: React.ReactNode }) {
  const homes = useHomes();
  const returning = !!homes && homes.length > 0;
  return (
    <>
      <section className="hero">
        {children}
        {returning ? <MyHomes /> : null}
        <HeroCta />
        {returning ? null : <TrustLine />}
      </section>
      {returning ? (
        <details
          className="card fold"
          onToggle={(e) => {
            if ((e.currentTarget as HTMLDetailsElement).open) track("first_screen_value_expanded", { homes: homes!.length });
          }}
        >
          <summary>What PropWorth tracks for you ›</summary>
          {proof ? <ProofCard proof={proof} /> : null}
          <Benefits />
        </details>
      ) : (
        <>
          {proof ? <ProofCard proof={proof} /> : null}
          <div className="card">
            <h2>After your first estimate</h2>
            <Benefits />
          </div>
        </>
      )}
    </>
  );
}
