"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { aed, dateLabel, roundEstimate } from "@/lib/format";
import {
  addLead, buildLead, deleteAllData, getHome, getLeads, removeHome, saveHome, setIntent, setStatus,
  STATUS_LABEL, validateLead, type ContactMethod, type Home, type IntentKind, type Lead, type Status,
} from "@/lib/owner";
import { AS_OF } from "@/lib/types";
import { track } from "@/lib/track";
import { homeUrl } from "./client";

interface Props {
  id: string;
  fallback: Home; // built from the URL when this browser has not saved the home (shared link)
  estimate: { low: number; mid: number; high: number };
  marketRent: number | null;
}

function store(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function HomePanel({ id, fallback, estimate, marketRent }: Props) {
  const router = useRouter();
  const [home, setHome] = useState<Home>(fallback);
  const [saved, setSaved] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sheet, setSheet] = useState<null | "lead" | "status" | "delete">(null);

  useEffect(() => {
    const s = store();
    const h = s && getHome(s, id);
    if (h) {
      setHome(h);
      setSaved(true);
    }
    if (s) setLeads(getLeads(s).filter((l) => l.homeId === id));
  }, [id]);

  function persist(next: Home) {
    const s = store();
    if (s) saveHome(s, next);
    setHome(next);
    setSaved(true);
  }

  // Intent card (O6)
  const [kind, setKind] = useState<IntentKind>(fallback.intent?.kind ?? "not_now");
  const [date, setDate] = useState(fallback.intent?.date ?? "");
  const [price, setPrice] = useState<string>(fallback.intent?.price ? String(fallback.intent.price) : "");
  useEffect(() => {
    if (home.intent) {
      setKind(home.intent.kind);
      setDate(home.intent.date ?? "");
      setPrice(home.intent.price ? String(home.intent.price) : "");
    }
  }, [home.intent]);

  function chooseKind(k: IntentKind) {
    setKind(k);
    if (k === "rent_out" && !price && marketRent) setPrice(String(roundEstimate(marketRent)));
    if (k === "open_to_offers" && !price) setPrice(String(roundEstimate(estimate.high)));
  }

  function saveIntent() {
    const intent = { kind, date: kind === "rent_out" ? date || null : null, price: kind === "not_now" ? null : Number(price) || null, setAt: AS_OF };
    const s = store();
    const next = { ...home, intent };
    if (s && saved) setIntent(s, id, intent);
    persist(next);
    track("intent_set", { type: kind, date: intent.date, price: intent.price });
    if (kind !== "not_now") setSheet("lead");
  }

  return (
    <>
      <div className="card" id="intent">
        <h2>What are your plans?</h2>
        <p className="meta">Agents reach you only through PF and only within these terms.</p>
        <div className="chips" role="group" aria-label="Plans">
          {([
            ["not_now", "Not now"],
            ["rent_out", "Rent out"],
            ["open_to_offers", "Open to offers"],
          ] as const).map(([k, label]) => (
            <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => chooseKind(k)}>
              {label}
            </button>
          ))}
        </div>
        {kind === "rent_out" ? (
          <div className="grid2">
            <div>
              <label htmlFor="i-date">From</label>
              <input id="i-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="i-rent">Rent, AED / year</label>
              <input id="i-rent" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
        ) : null}
        {kind === "open_to_offers" ? (
          <>
            <label htmlFor="i-price">Offers from, AED</label>
            <input id="i-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
            <p className="hint">PF estimate {aed(roundEstimate(estimate.low), { compact: true })} – {aed(roundEstimate(estimate.high), { compact: true })}</p>
          </>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <button className="btn" type="button" onClick={saveIntent} disabled={kind === "rent_out" && (!date || !(Number(price) > 0))}>
            {kind === "not_now" ? "Save" : "Save and find an agent"}
          </button>
        </div>
        {home.intent ? (
          <p className="hint">Saved {dateLabel(home.intent.setAt)}: {intentText(home)}</p>
        ) : null}
      </div>

      <div className="card">
        <div className="between">
          <h3>Status</h3>
          <button className="linkbtn" onClick={() => setSheet("status")}>Change</button>
        </div>
        <p>
          {home.status ? STATUS_LABEL[home.status] : "Not set"}
          {home.status === "let" && home.annualRent ? (
            <span className="meta"> · {aed(home.annualRent)} / year, lease ends {home.leaseEnd ? dateLabel(home.leaseEnd) : "–"}</span>
          ) : null}
        </p>
        <p className="meta">
          Ownership: {home.verification === "pending" ? <span className="badge warn">Verification pending</span> : "not verified"}
        </p>
        {home.statusHistory.length > 1 ? (
          <details>
            <summary className="meta">History</summary>
            <ul className="list">
              {home.statusHistory.map((h, i) => (
                <li key={i}>
                  <span>{STATUS_LABEL[h.status]}</span>
                  <span className="meta">{dateLabel(h.at)}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      {leads.length ? (
        <div className="card">
          <h3>My requests</h3>
          <ul className="list">
            {leads.map((l) => (
              <li key={l.id}>
                <span>
                  {l.intent === "sell" ? "Sell" : "Rent out"} · {aed(l.askingPrice, { compact: true })}
                  <span className="meta"> · from {dateLabel(l.availableFrom)}</span>
                </span>
                <span className="badge">Sent to agent</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card">
        <p className="meta">
          {saved ? "Saved on this device." : "This home is not saved on this device yet."}{" "}
          <button className="linkbtn" onClick={() => setSheet("delete")}>Remove or delete data</button>
        </p>
      </div>

      {sheet === "lead" ? (
        <LeadSheet
          home={home}
          estimate={estimate}
          defaultPrice={Number(price) || (kind === "rent_out" ? marketRent ?? 0 : estimate.mid)}
          defaultIntent={kind === "rent_out" ? "rent_out" : "sell"}
          defaultDate={date}
          onClose={() => setSheet(null)}
          onSent={(lead) => {
            const s = store();
            if (s) {
              if (!saved) saveHome(s, home);
              addLead(s, lead);
            }
            setLeads((ls) => [...ls, lead]);
            setSaved(true);
          }}
        />
      ) : null}

      {sheet === "status" ? (
        <StatusSheet
          home={home}
          onClose={() => setSheet(null)}
          onSave={(status, extra) => {
            const s = store();
            let next: Home;
            if (s) {
              if (!saved) saveHome(s, home);
              next = setStatus(s, id, status, AS_OF, extra);
            } else {
              next = { ...home, status, statusHistory: [...home.statusHistory, { status, at: AS_OF }] };
            }
            setHome(next);
            setSaved(true);
            setSheet(null);
            router.replace(homeUrl(next));
            if (status === "for_sale") {
              setKind("open_to_offers");
              setSheet("lead");
            }
          }}
        />
      ) : null}

      {sheet === "delete" ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Delete data" onClick={() => setSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Remove or delete</h2>
            <p className="meta">
              <b>Remove this home</b> deletes {home.building} · {home.unitNumber}, its status, plans and requests from this device.
            </p>
            <button
              className="btn secondary"
              onClick={() => {
                const s = store();
                if (s) removeHome(s, id);
                router.push("/");
              }}
            >
              Remove this home
            </button>
            <p className="meta" style={{ marginTop: 16 }}>
              <b>Delete all my data</b> deletes every home, request, setting and event log this prototype saved on this device.
              This also withdraws your consent.
            </p>
            <button
              className="btn dark"
              onClick={() => {
                const s = store();
                if (s) deleteAllData(s);
                router.push("/");
              }}
            >
              Delete all my data
            </button>
            <div style={{ marginTop: 8 }}>
              <button className="btn secondary" onClick={() => setSheet(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function intentText(h: Home): string {
  const i = h.intent!;
  if (i.kind === "not_now") return "not now";
  if (i.kind === "rent_out") return `rent out from ${i.date ? dateLabel(i.date) : "–"} at ${i.price ? aed(i.price) : "–"} / year`;
  return `open to offers from ${i.price ? aed(i.price) : "–"}`;
}

function StatusSheet({
  home,
  onClose,
  onSave,
}: {
  home: Home;
  onClose: () => void;
  onSave: (s: Status, extra: { annualRent?: number | null; leaseEnd?: string | null }) => void;
}) {
  const [status, setS] = useState<Status>(home.status ?? "live");
  const [rent, setRent] = useState(home.annualRent ? String(home.annualRent) : "");
  const [leaseEnd, setLeaseEnd] = useState(home.leaseEnd ?? "");
  const invalid = status === "let" && (!(Number(rent) > 0) || !leaseEnd);
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Change status" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>What do you do with this home?</h2>
        <div className="chips">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <button key={s} className="chip" aria-pressed={status === s} onClick={() => setS(s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {status === "let" ? (
          <div className="grid2">
            <div>
              <label htmlFor="s-rent">Annual rent, AED</label>
              <input id="s-rent" inputMode="numeric" value={rent} onChange={(e) => setRent(e.target.value)} />
            </div>
            <div>
              <label htmlFor="s-end">Lease ends</label>
              <input id="s-end" type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} />
            </div>
          </div>
        ) : null}
        {status === "for_sale" ? <p className="hint">Next you can ask PF to connect you with an agent.</p> : null}
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={invalid} onClick={() => onSave(status, { annualRent: Number(rent) || null, leaseEnd: leaseEnd || null })}>
            Save status
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadSheet({
  home,
  estimate,
  defaultPrice,
  defaultIntent,
  defaultDate,
  onClose,
  onSent,
}: {
  home: Home;
  estimate: Lead["estimate"];
  defaultPrice: number;
  defaultIntent: Lead["intent"];
  defaultDate: string;
  onClose: () => void;
  onSent: (l: Lead) => void;
}) {
  const [intent, setIntentKind] = useState<Lead["intent"]>(defaultIntent);
  const [askingPrice, setAsking] = useState(String(Math.round(defaultPrice) || ""));
  const [availableFrom, setFrom] = useState(defaultDate || "");
  const [contact, setContact] = useState<ContactMethod | null>(null);
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState<Lead | null>(null);
  const draft = { intent, askingPrice: Number(askingPrice), availableFrom, contact, consent };
  const errors = validateLead(draft);

  function send() {
    if (errors.length) return;
    const lead = buildLead(home, draft as Required<typeof draft>, estimate, new Date().toISOString());
    onSent(lead);
    setSent(lead);
    track("lead_submitted", { intent, contact: contact!, price: draft.askingPrice, verification: home.verification });
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Find an agent" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="empty">
            <div className="icon" aria-hidden>✓</div>
            <h2>Request sent</h2>
            <p className="meta">A verified agent will contact you by {sent.contact === "whatsapp" ? "WhatsApp" : sent.contact} via PF.</p>
            <p className="tiny">Prototype: nothing was sent. The request is saved under “My requests”.</p>
            <button className="btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2>Find an agent</h2>
            <div className="chips">
              <button className="chip" aria-pressed={intent === "rent_out"} onClick={() => setIntentKind("rent_out")}>Rent out</button>
              <button className="chip" aria-pressed={intent === "sell"} onClick={() => setIntentKind("sell")}>Sell</button>
            </div>
            <div className="grid2">
              <div>
                <label htmlFor="l-price">{intent === "sell" ? "Asking price, AED" : "Rent, AED / year"}</label>
                <input id="l-price" inputMode="numeric" value={askingPrice} onChange={(e) => setAsking(e.target.value)} />
              </div>
              <div>
                <label htmlFor="l-date">Available from</label>
                <input id="l-date" type="date" value={availableFrom} onChange={(e) => setFrom(e.target.value)} />
              </div>
            </div>
            {intent === "sell" ? (
              <p className="hint">PF estimate {aed(roundEstimate(estimate.low))} – {aed(roundEstimate(estimate.high))}</p>
            ) : null}
            <label>How should the agent contact you?</label>
            <div className="chips">
              {(["call", "whatsapp", "email"] as const).map((c) => (
                <button key={c} className="chip" aria-pressed={contact === c} onClick={() => setContact(c)}>
                  {c === "call" ? "Call" : c === "whatsapp" ? "WhatsApp" : "Email"}
                </button>
              ))}
            </div>
            <div className="card tint" style={{ marginTop: 16 }}>
              <h3>The agent will receive</h3>
              <ul className="list meta">
                <li><span>Unit</span><span>{home.building} · {home.unitNumber}</span></li>
                <li><span>Size, bedrooms</span><span>{home.sizeSqm} m², {home.rooms === 0 ? "studio" : `${home.rooms}BR`}</span></li>
                <li><span>PF estimate</span><span>{aed(roundEstimate(estimate.mid), { compact: true })} ({aed(roundEstimate(estimate.low), { compact: true })} – {aed(roundEstimate(estimate.high), { compact: true })})</span></li>
                <li><span>Ownership</span><span>{home.verification === "pending" ? "Verification pending" : "Not verified"}</span></li>
              </ul>
              <p className="tiny">Not shared: your name and number until you accept the agent.</p>
            </div>
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>An agent may contact me via PF about this request.</span>
            </label>
            {errors.length && (contact || consent) ? <p className="error">{errors[0]}</p> : null}
            <div style={{ marginTop: 16 }}>
              <button className="btn" disabled={errors.length > 0} onClick={send}>Send request</button>
            </div>
            <p className="tiny" style={{ marginTop: 8 }}>
              <Link href="/privacy">How we use data</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
