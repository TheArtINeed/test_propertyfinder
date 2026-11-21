"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { aed, dateLabel, roundEstimate } from "@/lib/format";
import { addLead, buildLead, deleteAllData, getHome, getLeads, removeHome, saveHome, setIntent, setStatus, STATUS_LABEL, leadFieldErrors, validateIntent, type ContactMethod, type Home, type IntentKind, type Lead, type Status, updateHome } from "@/lib/owner";
import { AS_OF } from "@/lib/types";
import { track } from "@/lib/track";
import { checkLeaseEnd, checkRent } from "@/lib/sanity";
import { FieldError, Source } from "../ui";
import { ContactSheet } from "./leads";
import { checkFixedRateEnd, checkLoan, checkPercent, LIMITS } from "@/lib/sanity";
import { WhatsAppPreview } from "./feed";
import { ILLUSTRATIVE_AGENT } from "@/lib/agents";
import { CHANNEL_LABEL, FREQUENCY_LABEL, leadStatus, nextUpdateDate, type Channel, type Frequency } from "@/lib/owner";
import { DEMO } from "@/lib/demo";
import { homeUrl } from "./client";

interface Props {
  id: string;
  fallback: Home; // built from the URL when this browser has not saved the home (shared link)
  estimate: { low: number; mid: number; high: number };
  marketRent: number | null;
  /** D2: the month's next step, shown with the plans card at the top. */
  nextStep?: { kind?: string; title: string; illustrative: boolean } | null;
  /** D2: WhatsApp version of the update, shown in the update settings. */
  waLines?: string[];
  /** D2: the numbers and alerts, placed between the plans and the settings. */
  children?: React.ReactNode;
}

function store(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function HomePanel({ id, fallback, estimate, marketRent, nextStep, waLines, children }: Props) {
  const router = useRouter();
  const [home, setHome] = useState<Home>(fallback);
  const [saved, setSaved] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sheet, setSheet] = useState<null | "lead" | "status" | "delete">(null);
  const statusSeen = useRef(false);
  const [refiOpen, setRefiOpen] = useState(false);
  const refiLogged = useRef(false);
  useEffect(() => {
    if (nextStep?.kind === "refinance" && !refiLogged.current) {
      refiLogged.current = true;
      track("refi_step_shown", { building: fallback.building });
    }
  }, [nextStep?.kind, fallback.building]);
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const s = store();
    const h = s && getHome(s, id);
    if (h) {
      setHome(h);
      setSaved(true);
    }
    if (s) setLeads(getLeads(s).filter((l) => l.homeId === id));
  }, [id]);

  /** Merge onto what is stored now, so a stale copy never wipes plans, status or settings. */
  function persist(next: Home) {
    const s = store();
    const merged = s ? { ...(getHome(s, id) ?? {}), ...next } : next;
    if (s) saveHome(s, merged as Home);
    setHome(merged as Home);
    setSaved(true);
  }

  // Intent card (O6)
  const [kind, setKind] = useState<IntentKind>(fallback.intent?.kind ?? "rent_out");
  const [date, setDate] = useState<string>(fallback.intent?.date ?? DEMO.plans.rentOutFrom);
  const [price, setPrice] = useState<string>(
    fallback.intent?.price ? String(fallback.intent.price) : marketRent ? String(roundEstimate(marketRent)) : "",
  );
  useEffect(() => {
    if (home.intent) {
      setKind(home.intent.kind);
      setDate(home.intent.date ?? "");
      setPrice(home.intent.price ? String(home.intent.price) : "");
    }
  }, [home.intent]);

  function chooseKind(k: IntentKind) {
    if (k === kind) return;
    setKind(k);
    setIntentErrors({});
    // Each plan has its own demo default: a rent per year vs a sale price.
    if (home.intent?.kind === k && home.intent.price) setPrice(String(home.intent.price));
    else if (k === "rent_out") setPrice(marketRent ? String(roundEstimate(marketRent)) : "");
    else if (k === "open_to_offers") setPrice(String(roundEstimate(estimate.high)));
  }

  const [intentErrors, setIntentErrors] = useState<Partial<Record<"date" | "price", string>>>({});
  function saveIntent() {
    const errs = validateIntent({ kind, date, price });
    setIntentErrors(errs);
    if (Object.keys(errs).length) return;
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
        {nextStep ? (
          <div className="step-line" data-testid="next-step">
            <p className="meta">Next step</p>
            <h3>{nextStep.title}</h3>
            {nextStep.illustrative ? <Source kind="illustrative" /> : null}
            {nextStep.kind === "refinance" ? (
              <button className="btn dark inline" style={{ marginTop: 8 }} onClick={() => setRefiOpen(true)}>
                Compare mortgage offers
              </button>
            ) : null}
          </div>
        ) : null}
        <h2>What are your plans?</h2>
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
              <input id="i-date" type="date" value={date} aria-invalid={!!intentErrors.date} onChange={(e) => { setDate(e.target.value); setIntentErrors((x) => ({ ...x, date: undefined })); }} />
              <FieldError msg={intentErrors.date} />
            </div>
            <div>
              <label htmlFor="i-rent">Rent, AED / year</label>
              <input id="i-rent" inputMode="numeric" value={price} aria-invalid={!!intentErrors.price} onChange={(e) => { setPrice(e.target.value); setIntentErrors((x) => ({ ...x, price: undefined })); }} />
              <FieldError msg={intentErrors.price} />
            </div>
          </div>
        ) : null}
        {/* D2: the market rent is in the Rent block; not repeated here */}
        {kind === "open_to_offers" ? (
          <>
            <label htmlFor="i-price">Offers from, AED</label>
            <input id="i-price" inputMode="numeric" value={price} aria-invalid={!!intentErrors.price} onChange={(e) => { setPrice(e.target.value); setIntentErrors((x) => ({ ...x, price: undefined })); }} />
            <FieldError msg={intentErrors.price} />
            <p className="hint">PropWorth estimate {aed(roundEstimate(estimate.low), { compact: true })} – {aed(roundEstimate(estimate.high), { compact: true })}</p>
          </>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <button className="btn" type="button" onClick={saveIntent}>
            {kind === "not_now" ? "Save" : "Save and find an agent"}
          </button>
        </div>
        {home.intent ? (
          <p className="hint">Saved {dateLabel(home.intent.setAt)}: {intentText(home)}</p>
        ) : null}
      </div>

      {leads.length ? (
        <div className="card" ref={(el) => { if (el && !statusSeen.current) { statusSeen.current = true; track("lead_status_viewed", { requests: leads.length }); } }}>
          <h3>My requests</h3>
          <ul className="list">
            {leads.map((l) => (
              <li key={l.id} style={{ flexDirection: "column", gap: 6 }}>
                <span>
                  {l.intent === "sell" ? "Sell" : "Rent out"} · {aed(l.askingPrice, { compact: true })}
                  <span className="meta"> · from {dateLabel(l.availableFrom)}</span>
                </span>
                <LeadSteps status={leadStatus(l.createdAt, now)} />
              </li>
            ))}
          </ul>
          <p className="tiny">To {ILLUSTRATIVE_AGENT.name}, {ILLUSTRATIVE_AGENT.agency}. Agent and replies are illustrative.</p>
        </div>
      ) : null}

      {children}

      <div className="card settings" data-testid="settings">
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
        <SubscriptionCard home={home} waLines={waLines} onChange={(sub) => persist({ ...home, subscription: sub })} />
        <p className="meta" style={{ marginTop: 8 }}>
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
          rentDefault={marketRent ? roundEstimate(marketRent) : 0}
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
              setStatus(s, id, status, AS_OF, extra);
              next = updateHome(s, id, { loan: extra.loan ?? null, mortgageRate: extra.mortgageRate ?? null, fixedRateEnd: extra.fixedRateEnd ?? null })!;
            } else {
              next = { ...home, status, statusHistory: [...home.statusHistory, { status, at: AS_OF }], loan: extra.loan ?? null, mortgageRate: extra.mortgageRate ?? null, fixedRateEnd: extra.fixedRateEnd ?? null };
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

      {refiOpen ? (
        <ContactSheet
          title="Compare mortgage offers"
          summary={<p className="meta">{home.building} · {home.unitNumber}{home.loan ? ` · loan left ${aed(home.loan, { compact: true })}` : ""}</p>}
          event="mortgage_lead_submitted"
          props={{ source: "refi", building: home.building }}
          recipient="A PF mortgage adviser"
          onClose={() => setRefiOpen(false)}
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
  onSave: (s: Status, extra: { annualRent?: number | null; leaseEnd?: string | null; loan?: number | null; mortgageRate?: number | null; fixedRateEnd?: string | null }) => void;
}) {
  const [status, setS] = useState<Status>(home.status ?? "live");
  const [rent, setRent] = useState(String(home.annualRent ?? DEMO.owner.annualRent));
  const [leaseEnd, setLeaseEnd] = useState<string>(home.leaseEnd ?? DEMO.owner.leaseEnd);
  const rentErr = status === "let" ? (rent.trim() === "" ? "Enter the annual rent" : checkRent(rent)) : undefined;
  const endErr = status === "let" ? (leaseEnd === "" ? "Pick the lease end date" : checkLeaseEnd(leaseEnd)) : undefined;
  // H1: optional mortgage details (prefilled for the demo)
  const [loan, setLoan] = useState(String(home.loan ?? DEMO.owner.loan));
  const [rate, setRate] = useState(String(home.mortgageRate != null ? Math.round(home.mortgageRate * 10000) / 100 : DEMO.owner.mortgageRatePct));
  const [fixedEnd, setFixedEnd] = useState<string>(home.fixedRateEnd ?? DEMO.owner.fixedRateEnd);
  const loanErr = loan.trim() === "" ? undefined : checkLoan(loan, home.pricePaid ?? null);
  const rateErr = checkPercent(rate, LIMITS.rate, "a rate");
  const fixedErr = checkFixedRateEnd(fixedEnd);
  const invalid = !!(rentErr || endErr || loanErr || rateErr || fixedErr);
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
              <input id="s-rent" inputMode="numeric" value={rent} aria-invalid={!!rentErr} onChange={(e) => setRent(e.target.value)} />
              <FieldError msg={rentErr} />
            </div>
            <div>
              <label htmlFor="s-end">Lease ends</label>
              <input id="s-end" type="date" value={leaseEnd} aria-invalid={!!endErr} onChange={(e) => setLeaseEnd(e.target.value)} />
              <FieldError msg={endErr} />
            </div>
          </div>
        ) : null}
        {status === "for_sale" ? <p className="hint">Next you can ask PF to connect you with an agent.</p> : null}
        <label>Mortgage (optional)</label>
        <div className="grid2">
          <div>
            <label htmlFor="s-loan">Loan left, AED</label>
            <input id="s-loan" inputMode="numeric" value={loan} aria-invalid={!!loanErr} onChange={(e) => setLoan(e.target.value)} />
            <FieldError msg={loanErr} />
          </div>
          <div>
            <label htmlFor="s-rate">Rate, %</label>
            <input id="s-rate" inputMode="decimal" value={rate} aria-invalid={!!rateErr} onChange={(e) => setRate(e.target.value)} />
            <FieldError msg={rateErr} />
          </div>
        </div>
        <label htmlFor="s-fixed">Fixed rate ends</label>
        <input id="s-fixed" type="date" value={fixedEnd} aria-invalid={!!fixedErr} onChange={(e) => setFixedEnd(e.target.value)} />
        <FieldError msg={fixedErr} />
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={invalid} onClick={() =>
              onSave(status, {
                annualRent: Number(rent) || null,
                leaseEnd: leaseEnd || null,
                loan: Number(loan) > 0 ? Number(loan) : null,
                mortgageRate: Number(rate) > 0 ? Number(rate) / 100 : null,
                fixedRateEnd: fixedEnd || null,
              })
            }>
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
  rentDefault,
  onClose,
  onSent,
}: {
  home: Home;
  estimate: Lead["estimate"];
  defaultPrice: number;
  defaultIntent: Lead["intent"];
  defaultDate: string;
  rentDefault: number;
  onClose: () => void;
  onSent: (l: Lead) => void;
}) {
  const [intent, setIntentKind] = useState<Lead["intent"]>(defaultIntent);
  const [askingPrice, setAsking] = useState(String(Math.round(defaultPrice) || ""));
  const [availableFrom, setFrom] = useState<string>(defaultDate || DEMO.plans.rentOutFrom);
  const [contact, setContact] = useState<ContactMethod | null>(DEMO.lead.contact);
  const [consent, setConsent] = useState<boolean>(DEMO.lead.consent);
  const [sent, setSent] = useState<Lead | null>(null);
  // Each intent has its own demo price: a rent per year vs a sale price.
  function switchIntent(k: Lead["intent"]) {
    if (k === intent) return;
    setIntentKind(k);
    setAsking(String(Math.round(k === defaultIntent ? defaultPrice : k === "sell" ? roundEstimate(estimate.mid) : rentDefault)));
  }
  const draft = { intent, askingPrice: Number(askingPrice), availableFrom, contact, consent };
  const fieldErrors = leadFieldErrors(draft);
  const errors = Object.values(fieldErrors);

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
            <p className="meta">
              {ILLUSTRATIVE_AGENT.name} will contact you by {sent.contact === "whatsapp" ? "WhatsApp" : sent.contact} via PF. Track it in “My requests”: Sent → Accepted (within 2 hours) → Viewing.
            </p>
            <p className="tiny">Prototype: nothing was sent. The request is saved under “My requests”.</p>
            <button className="btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2>Find an agent</h2>
            <div className="chips">
              <button className="chip" aria-pressed={intent === "rent_out"} onClick={() => switchIntent("rent_out")}>Rent out</button>
              <button className="chip" aria-pressed={intent === "sell"} onClick={() => switchIntent("sell")}>Sell</button>
            </div>
            <div className="grid2">
              <div>
                <label htmlFor="l-price">{intent === "sell" ? "Asking price, AED" : "Rent, AED / year"}</label>
                <input id="l-price" inputMode="numeric" value={askingPrice} aria-invalid={!!fieldErrors.price} onChange={(e) => setAsking(e.target.value)} />
                <FieldError msg={fieldErrors.price} />
              </div>
              <div>
                <label htmlFor="l-date">Available from</label>
                <input id="l-date" type="date" value={availableFrom} aria-invalid={!!fieldErrors.date} onChange={(e) => setFrom(e.target.value)} />
                <FieldError msg={fieldErrors.date} />
              </div>
            </div>
            {intent === "sell" ? (
              <p className="hint">PropWorth estimate {aed(roundEstimate(estimate.low))} – {aed(roundEstimate(estimate.high))}</p>
            ) : null}
            <label>How should the agent contact you?</label>
            <div className="chips">
              {(["call", "whatsapp", "email"] as const).map((c) => (
                <button key={c} className="chip" aria-pressed={contact === c} onClick={() => setContact(c)}>
                  {c === "call" ? "Call" : c === "whatsapp" ? "WhatsApp" : "Email"}
                </button>
              ))}
            </div>
            <div className="card flat agent" style={{ marginTop: 16 }}>
              <p className="tiny">Who gets your request</p>
              <div className="row">
                <span className="avatar" aria-hidden>A</span>
                <div>
                  <b>{ILLUSTRATIVE_AGENT.name}</b>{" "}
                  {ILLUSTRATIVE_AGENT.superAgent ? <span className="badge">SuperAgent</span> : null}
                  <div className="meta">{ILLUSTRATIVE_AGENT.agency} · {ILLUSTRATIVE_AGENT.dealsHere}</div>
                  <div className="meta">{ILLUSTRATIVE_AGENT.responseTime}</div>
                </div>
              </div>
              <span className="src illustrative">Illustrative: PF would pick the top agent by deals in your building</span>
            </div>
            <div className="card tint" style={{ marginTop: 8 }}>
              <h3>The agent will receive</h3>
              <ul className="list meta">
                <li><span>Unit</span><span>{home.building} · {home.unitNumber}</span></li>
                <li><span>Size, bedrooms</span><span>{home.sizeSqm} m², {home.rooms === 0 ? "studio" : `${home.rooms}BR`}</span></li>
                <li><span>PropWorth estimate</span><span>{aed(roundEstimate(estimate.mid), { compact: true })} ({aed(roundEstimate(estimate.low), { compact: true })} – {aed(roundEstimate(estimate.high), { compact: true })})</span></li>
                <li><span>Ownership</span><span>{home.verification === "pending" ? "Verification pending" : "Not verified"}</span></li>
              </ul>
              <p className="tiny">Not shared: your name and number until you accept the agent.</p>
            </div>
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>An agent may contact me via PF about this request.</span>
            </label>
            <FieldError msg={fieldErrors.contact ?? fieldErrors.consent} />
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

const STEPS = ["Sent", "Accepted", "Viewing"] as const;

/** V16: Sent -> Accepted (2 h, mocked) -> Viewing (next). */
export function LeadSteps({ status }: { status: "sent" | "accepted" }) {
  const done = status === "sent" ? 1 : 2;
  return (
    <ol className="steps-inline" aria-label={`Status: ${status}`}>
      {STEPS.map((st, i) => (
        <li key={st} className={i < done ? "done" : i === done ? "next" : ""}>
          {i < done ? "✓ " : ""}
          {st}
          {st === "Accepted" && status === "sent" ? " · within 2 h" : ""}
        </li>
      ))}
    </ol>
  );
}

/** V11: channel and frequency of the monthly update, changeable here (closes O7). */
function SubscriptionCard({ home, onChange, waLines }: { home: Home; onChange: (s: NonNullable<Home["subscription"]>) => void; waLines?: string[] }) {
  const [edit, setEdit] = useState(false);
  const sub = home.subscription;
  return (
    <div className="settings-row" id="subscription">
      <div className="between">
        <h3>Your monthly update</h3>
        <button className="linkbtn" onClick={() => setEdit((e) => !e)}>{edit ? "Done" : sub ? "Change" : "Turn on"}</button>
      </div>
      {sub ? (
        <p className="meta">
          {CHANNEL_LABEL[sub.channel]} · {FREQUENCY_LABEL[sub.frequency]} · next update {dateLabel(nextUpdateDate())}
        </p>
      ) : (
        <p className="meta">Not on yet: choose how to get it.</p>
      )}
      {edit ? (
        <>
          <div className="chips" role="group" aria-label="Channel">
            {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
              <button key={c} className="chip" aria-pressed={sub?.channel === c} onClick={() => { onChange({ channel: c, frequency: sub?.frequency ?? "monthly", since: sub?.since ?? AS_OF }); track("digest_subscribed", { channel: c, frequency: sub?.frequency ?? "monthly" }); }}>
                {CHANNEL_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="chips" role="group" aria-label="Frequency" style={{ marginTop: 8 }}>
            {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
              <button key={f} className="chip" aria-pressed={sub?.frequency === f} onClick={() => { onChange({ channel: sub?.channel ?? "whatsapp", frequency: f, since: sub?.since ?? AS_OF }); track("digest_subscribed", { channel: sub?.channel ?? "whatsapp", frequency: f }); }}>
                {FREQUENCY_LABEL[f]}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {edit && waLines ? <WhatsAppPreview lines={waLines} /> : null}
      <p className="tiny">Delivery is simulated in this prototype.</p>
    </div>
  );
}
