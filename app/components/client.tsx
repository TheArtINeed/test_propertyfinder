"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EventName } from "@/lib/events";
import { searchBuildings, type Building } from "@/lib/market";
import { aed, pct, roomsLabel, roundEstimate } from "@/lib/format";
import type { Portfolio } from "@/lib/portfolio";
import { CHANNEL_LABEL, FREQUENCY_LABEL, getHomes, homeId, nextUpdateDate, saveHome, type Channel, type Frequency, type Home } from "@/lib/owner";
import { dateLabel } from "@/lib/format";
import { AS_OF, SQFT_PER_SQM } from "@/lib/types";
import { hasErrors, validateClaim, validateUnitForm, type ClaimErrors, type FieldErrors } from "@/lib/forms";
import { track } from "@/lib/track";
import { DEMO } from "@/lib/demo";

/** Fires one event when the screen is shown. */
export function Track({ name, props }: { name: EventName; props?: Record<string, string | number | boolean | null> }) {
  const key = JSON.stringify(props ?? {});
  const sent = useRef("");
  useEffect(() => {
    // Guard: React StrictMode runs effects twice in dev; log each screen view once.
    if (sent.current === name + key) return;
    sent.current = name + key;
    track(name, props ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);
  return null;
}

/** session_started once per browser session, with months since the first claim (month-2 retention base). */
export function SessionStart() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("pf.session")) return;
      sessionStorage.setItem("pf.session", "1");
      const homes = getHomes(localStorage);
      const first = homes.map((h) => h.claimedAt).sort()[0];
      const months = first ? Math.floor((Date.now() - Date.parse(first)) / (30.44 * 86_400_000)) : null;
      track("session_started", { homes: homes.length, months_since_claim: months });
    } catch {
      /* storage blocked */
    }
  }, []);
  return null;
}

export function MyHomes() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [summary, setSummary] = useState<Portfolio | null>(null);
  useEffect(() => {
    let list: Home[] = [];
    try {
      list = getHomes(localStorage);
    } catch {
      list = [];
    }
    setHomes(list);
    if (!list.length) return;
    fetch("/api/portfolio", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ homes: list }),
    })
      .then((r) => r.json())
      .then((j: { ok: boolean; portfolio?: Portfolio }) => {
        if (!j.ok || !j.portfolio) return;
        setSummary(j.portfolio);
        track("portfolio_viewed", { homes: j.portfolio.count, attention: j.portfolio.attention?.nextStep.kind ?? null });
      })
      .catch(() => setSummary(null));
  }, []);
  if (!homes.length) return null;
  const attentionHome = summary?.attention ? homes.find((h) => h.id === summary.attention!.id) : undefined;
  return (
    <div className="card" id="propworth">
      <h2>PropWorth</h2>
      {summary && summary.count ? (
        <div className="stack" data-testid="portfolio-summary">
          <p className="meta">
            Your PropWorth · {summary.count} {summary.count === 1 ? "home" : "homes"}
          </p>
          <div className="mid">
            {aed(roundEstimate(summary.low), { compact: true })} – {aed(roundEstimate(summary.high), { compact: true })}
          </div>
          {summary.rentIn != null && summary.yield != null ? (
            <p className="meta">
              Rent in: {aed(summary.rentIn, { compact: true })} / year · gross yield {pct(summary.yield, 1)}
            </p>
          ) : null}
          {summary.attention && attentionHome ? (
            <Link className="item" href={homeUrl(attentionHome)}>
              <span>
                <b>Needs attention:</b> {summary.attention.unitNumber} · {summary.attention.nextStep.title}
              </span>
              <span aria-hidden>›</span>
            </Link>
          ) : (
            <p className="meta">Nothing urgent this month.</p>
          )}
          <p className="hint">PropWorth estimate · DLD registered resales, 2026</p>
        </div>
      ) : null}
      <ul className="list">
        {homes.map((h) => (
          <li key={h.id}>
            <Link className="item" href={homeUrl(h)}>
              <span>
                My Home · {h.building} · {h.unitNumber}
                <span className="meta"> · {roomsLabel(h.rooms)}, {h.sizeSqm} m²</span>
              </span>
              <span aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/own" className="meta">
        + Add a home
      </Link>
    </div>
  );
}

export function homeQuery(h: Pick<Home, "unitNumber" | "rooms" | "sizeSqm" | "occupancy" | "annualRent" | "leaseEnd" | "pricePaid" | "loan">) {
  const q = new URLSearchParams({ unit: h.unitNumber, rooms: String(h.rooms), size: String(h.sizeSqm) });
  if (h.occupancy) q.set("occ", h.occupancy);
  if (h.occupancy === "let" && h.annualRent) q.set("rent", String(h.annualRent));
  if (h.occupancy === "let" && h.leaseEnd) q.set("leaseEnd", h.leaseEnd);
  if (h.pricePaid) q.set("paid", String(h.pricePaid));
  if (h.loan) q.set("loan", String(h.loan));
  return q.toString();
}
export const homeUrl = (h: Home) => `/own/${h.slug}/home?${homeQuery(h)}`;

export function BuildingSearch({ buildings }: { buildings: Building[] }) {
  const pilot = buildings.find((b) => b.active)!;
  const [q, setQ] = useState(pilot.name);
  const isPilot = q.trim().toLowerCase() === pilot.name.toLowerCase();
  const hits = useMemo(() => searchBuildings(buildings, q, 8), [buildings, q]);
  const soon = isPilot ? buildings.filter((b) => !b.active).slice(0, 5) : hits.filter((b) => !b.active);
  const open = isPilot ? [pilot] : hits.filter((b) => b.active);
  return (
    <div>
      <label htmlFor="bsearch">Building</label>
      <input
        id="bsearch"
        autoComplete="off"
        placeholder="Start typing, e.g. Luma"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
      />
      {open.map((b) => (
        <Link key={b.slug} className="pick" href={`/own/${b.slug}`}>
          <span>
            <b>{b.name}</b>
            <span className="meta"> · JVC · {b.resales} resales in 2026</span>
            <br />
            <span className="badge ok">Open in the pilot</span>
          </span>
          <span className="pick-cta">Continue ›</span>
        </Link>
      ))}
      {q && hits.length === 0 ? <Waitlist name={q} /> : null}
      {soon.length ? (
        <>
          <p className="tiny" style={{ marginTop: 12 }}>Other JVC buildings · coming soon</p>
          <ul className="suggest">
            {soon.map((b) => (
              <li key={b.slug} aria-disabled="true" className="soon">
                <span>{b.name}</span>
                <span className="badge">Coming soon</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** "Coming soon" building: leave a request (mocked, stored locally). */
export function Waitlist({ name }: { name: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="card warn">
      <h3>Your building is coming soon</h3>
      <p className="meta">We start with Luma Park Views in JVC. Tell us your building and we will open it next.</p>
      {done ? (
        <p className="pos">Thanks. We will let you know when “{name}” opens.</p>
      ) : (
        <button
          className="btn secondary"
          type="button"
          onClick={() => {
            try {
              const list = JSON.parse(localStorage.getItem("pf.waitlist") ?? "[]");
              localStorage.setItem("pf.waitlist", JSON.stringify([...list, name]));
            } catch {
              /* storage blocked */
            }
            track("waitlist_joined", { building: name.slice(0, 60) });
            setDone(true);
          }}
        >
          Notify me when it opens
        </button>
      )}
    </div>
  );
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p className="error" id={id} role="alert">
      {msg}
    </p>
  ) : null;
}

export function UnitForm({
  slug,
  roomOptions,
  initial,
}: {
  slug: string;
  roomOptions: { rooms: number; medianSize: number; count: number }[];
  initial?: { unit?: string; rooms?: number; sizeSqm?: number };
}) {
  const router = useRouter();
  const options = roomOptions.length ? roomOptions : [0, 1, 2, 3].map((r) => ({ rooms: r, medianSize: [38, 75, 115, 160][r], count: 0 }));
  const [unit, setUnit] = useState(initial?.unit || DEMO.unit);
  const [rooms, setRooms] = useState<number>(
    initial?.rooms ?? (options.some((o) => o.rooms === DEMO.rooms) ? DEMO.rooms : options[0].rooms),
  );
  const [unitSys, setUnitSys] = useState<"sqm" | "sqft">("sqm");
  const [size, setSize] = useState<string>(String(initial?.sizeSqm ?? DEMO.sizeSqm));
  const [errors, setErrors] = useState<FieldErrors<"unit" | "size">>({});

  const typical = options.find((o) => o.rooms === rooms)?.medianSize;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateUnitForm({ unit, size, system: unitSys });
    setErrors(v.errors);
    if (hasErrors(v.errors)) return;
    const q = new URLSearchParams({ unit: unit.trim().toUpperCase(), rooms: String(rooms), size: String(v.sizeSqm) });
    router.push(`/own/${slug}/value?${q}`);
  }
  return (
    <form onSubmit={submit} className="card" noValidate>
      <label htmlFor="unit">Unit number</label>
      <input
        id="unit"
        value={unit}
        onChange={(e) => {
          setUnit(e.target.value);
          setErrors((x) => ({ ...x, unit: undefined }));
        }}
        placeholder="e.g. 1204"
        maxLength={12}
        aria-invalid={!!errors.unit}
        aria-describedby="unit-err"
      />
      <FieldError id="unit-err" msg={errors.unit} />
      <p className="hint">Saved with your home. DLD open data has no unit numbers, so it is not used in the estimate.</p>
      <label>Bedrooms</label>
      <div className="chips">
        {options.map((o) => (
          <button type="button" key={o.rooms} className="chip" aria-pressed={rooms === o.rooms} onClick={() => setRooms(o.rooms)}>
            {roomsLabel(o.rooms)}
          </button>
        ))}
      </div>
      <label htmlFor="size">Size</label>
      <div className="row">
        <input
          id="size"
          inputMode="decimal"
          value={size}
          onChange={(e) => {
            setSize(e.target.value);
            setErrors((x) => ({ ...x, size: undefined }));
          }}
          aria-invalid={!!errors.size}
          aria-describedby="size-err"
          placeholder={typical ? String(Math.round(unitSys === "sqm" ? typical : typical * SQFT_PER_SQM)) : ""}
        />
        <div className="chips" style={{ flexWrap: "nowrap" }}>
          {(["sqm", "sqft"] as const).map((u) => (
            <button type="button" key={u} className="chip" aria-pressed={unitSys === u} onClick={() => setUnitSys(u)}>
              {u === "sqm" ? "m²" : "ft²"}
            </button>
          ))}
        </div>
      </div>
      <FieldError id="size-err" msg={errors.size} />
      {typical ? <p className="hint">Typical {roomsLabel(rooms)} here: {Math.round(typical)} m²</p> : null}
      <div style={{ marginTop: 16 }}>
        <button className="btn" type="submit">See my home&apos;s value</button>
      </div>
    </form>
  );
}

interface UnitCtx {
  slug: string;
  building: string;
  unitNumber: string;
  rooms: number;
  sizeSqm: number;
}

/** O0 -> O10 bridge: "Get this every month" + optional details + claim (O1) with consent (C6). */
export function GetMonthly({ ctx, prefillPaid }: { ctx: UnitCtx; prefillPaid?: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [occ, setOcc] = useState<"let" | "live">(DEMO.owner.occupancy);
  const [rent, setRent] = useState(String(DEMO.owner.annualRent));
  const [leaseEnd, setLeaseEnd] = useState<string>(DEMO.owner.leaseEnd);
  const [paid, setPaid] = useState(String(prefillPaid ?? DEMO.owner.pricePaid));
  const [loan, setLoan] = useState(String(DEMO.owner.loan));
  const [deed, setDeed] = useState<string>(DEMO.owner.titleDeed);
  const [consent, setConsent] = useState<boolean>(DEMO.owner.consent);
  const [unitNo, setUnitNo] = useState(ctx.unitNumber || DEMO.unit);
  const [channel, setChannel] = useState<Channel>(DEMO.subscription.channel);
  const [frequency, setFrequency] = useState<Frequency>(DEMO.subscription.frequency);
  const [errors, setErrors] = useState<ClaimErrors>({});
  const clear = (k: keyof ClaimErrors) => setErrors((x) => ({ ...x, [k]: undefined }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateClaim({ unit: unitNo, occupancy: occ, rent, leaseEnd, consent, paid, loan, deed });
    setErrors(errs);
    if (hasErrors(errs)) return;
    const num = (s: string) => (Number(s) > 0 ? Number(s) : null);
    const unitNumber = unitNo.trim().toUpperCase();
    const id = homeId(ctx.slug, unitNumber);
    const home: Home = {
      id,
      building: ctx.building,
      slug: ctx.slug,
      unitNumber,
      rooms: ctx.rooms,
      sizeSqm: ctx.sizeSqm,
      claimedAt: AS_OF,
      titleDeed: deed.trim() || null,
      verification: deed.trim() ? "pending" : "none",
      occupancy: occ,
      status: occ,
      statusHistory: [{ status: occ, at: AS_OF }],
      annualRent: occ === "let" ? num(rent) : null,
      leaseEnd: occ === "let" ? leaseEnd : null,
      pricePaid: num(paid),
      loan: num(loan),
      subscription: { channel, frequency, since: AS_OF },
    };
    try {
      saveHome(localStorage, home);
    } catch {
      /* storage blocked: the URL still carries the unit */
    }
    track("digest_subscribed", { channel, frequency, building: ctx.building });
    track("unit_claimed", { building: ctx.building, rooms: ctx.rooms, verification: home.verification, occupancy: occ });
    router.push(homeUrl(home));
  }

  return (
    <>
      <button
        className="btn"
        onClick={() => {
          track("get_monthly_clicked", { building: ctx.building, rooms: ctx.rooms });
          setOpen(true);
        }}
      >
        Get this every month
      </button>
      <p className="hint" style={{ textAlign: "center" }}>
        A monthly update on your home: rents, deals, demand and one next step.
      </p>
      {open ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Save my home" onClick={() => setOpen(false)}>
          <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={save} noValidate>
            <div className="between">
              <h2>Save {ctx.building}{ctx.unitNumber ? ` · ${ctx.unitNumber}` : ""}</h2>
              <button type="button" className="linkbtn" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <p className="meta">Get your PropWorth every month in My Home.</p>
            <label>Send my update by</label>
            <div className="chips" role="group" aria-label="Channel">
              {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
                <button key={c} type="button" className="chip" aria-pressed={channel === c} onClick={() => setChannel(c)}>
                  {CHANNEL_LABEL[c]}
                </button>
              ))}
            </div>
            <label>How often</label>
            <div className="chips" role="group" aria-label="Frequency">
              {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                <button key={f} type="button" className="chip" aria-pressed={frequency === f} onClick={() => setFrequency(f)}>
                  {FREQUENCY_LABEL[f]}
                </button>
              ))}
            </div>
            <p className="hint">Next update: {dateLabel(nextUpdateDate())}. Delivery is simulated in this prototype.</p>
            <p className="meta" style={{ marginTop: 12 }}>Optional details make the update more useful. You can change them later.</p>
            {!ctx.unitNumber ? (
              <>
                <label htmlFor="unitNo">Unit number</label>
                <input id="unitNo" value={unitNo} onChange={(e) => { setUnitNo(e.target.value); clear("unit"); }} placeholder="e.g. 1204" maxLength={12} aria-invalid={!!errors.unit} />
                <FieldError id="unitNo-err" msg={errors.unit} />
              </>
            ) : null}
            <label>This home</label>
            <div className="chips">
              <button type="button" className="chip" aria-pressed={occ === "let"} onClick={() => setOcc("let")}>I let it</button>
              <button type="button" className="chip" aria-pressed={occ === "live"} onClick={() => setOcc("live")}>I live in it</button>
            </div>
            {occ === "let" ? (
              <div className="grid2">
                <div>
                  <label htmlFor="rent">Annual rent, AED</label>
                  <input id="rent" inputMode="numeric" value={rent} onChange={(e) => { setRent(e.target.value); clear("rent"); }} placeholder="80000" aria-invalid={!!errors.rent} />
                  <FieldError id="rent-err" msg={errors.rent} />
                </div>
                <div>
                  <label htmlFor="leaseEnd">Lease ends</label>
                  <input id="leaseEnd" type="date" value={leaseEnd} onChange={(e) => { setLeaseEnd(e.target.value); clear("leaseEnd"); }} aria-invalid={!!errors.leaseEnd} />
                  <FieldError id="leaseEnd-err" msg={errors.leaseEnd} />
                </div>
              </div>
            ) : null}
            <div className="grid2">
              <div>
                <label htmlFor="paid">Price paid, AED</label>
                <input id="paid" inputMode="numeric" value={paid} aria-invalid={!!errors.paid} onChange={(e) => { setPaid(e.target.value); clear("paid"); clear("loan"); }} placeholder="optional" />
                <FieldError id="paid-err" msg={errors.paid} />
              </div>
              <div>
                <label htmlFor="loan">Loan left, AED</label>
                <input id="loan" inputMode="numeric" value={loan} aria-invalid={!!errors.loan} onChange={(e) => { setLoan(e.target.value); clear("loan"); }} placeholder="optional" />
                <FieldError id="loan-err" msg={errors.loan} />
              </div>
            </div>
            <label htmlFor="deed">Title deed number</label>
            <input id="deed" value={deed} aria-invalid={!!errors.deed} onChange={(e) => { setDeed(e.target.value); clear("deed"); }} placeholder="optional, to verify you own it" maxLength={30} />
            <FieldError id="deed-err" msg={errors.deed} />
            <p className="hint">Verification is simulated in this prototype: nothing is checked or sent.</p>
            <label className="check" style={{ marginTop: 16 }}>
              <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); clear("consent"); }} aria-invalid={!!errors.consent} />
              <span>
                PF stores these details to send my monthly update. Agents can reach me only via PF and only if I ask. I can
                delete my data any time. <Link href="/privacy">How we use data</Link>
              </span>
            </label>
            <FieldError id="consent-err" msg={errors.consent} />
            <div style={{ marginTop: 16 }}>
              <button className="btn" type="submit">Save and get my update</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}


/** "Based on N deals" list; logs deal_list_opened when expanded. */
export function DealList({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("deal_list_opened", {})}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}

/** Link that logs an event on click. */
export function TrackLink({
  href,
  name,
  props,
  className,
  children,
}: {
  href: string;
  name: EventName;
  props?: Record<string, string | number | boolean | null>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track(name, props ?? {})}>
      {children}
    </Link>
  );
}
