"use client";

import { useEffect, useState } from "react";
import type { Alert } from "@/lib/alerts";
import { getHome } from "@/lib/owner";
import { track } from "@/lib/track";
import { Icon } from "../icons";

const date = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

/** A1: how the estimate is made, what it does not know, and the independence line. */
export function MethodSheet({
  comps,
  windowText,
  levelText,
  confidence,
  linkText = "How we estimate",
}: {
  comps: number;
  windowText: string;
  levelText: string;
  confidence: string;
  linkText?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="linkbtn"
        onClick={() => {
          setOpen(true);
          track("method_viewed", { comps, confidence });
        }}
      >
        {linkText}
      </button>
      {open ? (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="How we estimate" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="between">
              <h2>How we estimate</h2>
              <button className="linkbtn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="card tint">
              <b>The estimate comes only from registered deals.</b>
              <p className="meta" style={{ margin: "4px 0 0" }}>Agents, listings and whether you sell do not change it.</p>
            </div>
            <h3>What we use</h3>
            <ul className="method">
              <li>
                <b>{comps} resales</b> registered with DLD, {windowText}: {levelText}.
              </li>
              <li>Same bedrooms and a size within ±15% of yours. If there are fewer than 5, we widen to the whole building, then to JVC, and the confidence drops.</li>
              <li>Several identical units sold on the same day count as one deal.</li>
              <li>The estimate is the median price per m² × your size. The range is the middle half of those deals, and never narrower than ±4%.</li>
              <li>Confidence today: <b>{confidence}</b> (high = 10+ deals like yours, medium = 5–9, low = fewer or a wider area).</li>
            </ul>
            <h3>What it does not know</h3>
            <ul className="method">
              <li>Your floor, view and the condition of your flat. DLD open data has no unit numbers, so two flats of the same size get the same estimate.</li>
              <li>Asking prices: only registered deals count.</li>
            </ul>
            <p className="tiny">Source: Dubai Land Department open data, JVC, 1 Jan – 20 Nov 2026. Not financial advice.</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={() => setOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type Channel = "push" | "whatsapp" | "email";
const CHANNELS: [Channel, string][] = [
  ["push", "Push"],
  ["whatsapp", "WhatsApp"],
  ["email", "Email"],
];
const KIND_ICON = { deal: "chart", rent_move: "key", lease: "bell", refi: "bell", news: "news", monthly: "home" } as const;

/** A3: the alerts this home would have received, as they would look in the chosen channel. */
export function AlertsInbox({ alerts, homeId, limit }: { alerts: Alert[]; homeId: string; limit?: number }) {
  const [all, setAll] = useState(false);
  const shown = limit && !all ? alerts.slice(0, limit) : alerts;
  const [channel, setChannel] = useState<Channel>("push");
  useEffect(() => {
    try {
      const sub = getHome(localStorage, homeId)?.subscription?.channel;
      if (sub === "whatsapp" || sub === "email") setChannel(sub);
    } catch {
      /* storage blocked */
    }
  }, [homeId]);
  return (
    <div className="card" id="alerts" data-testid="alerts">
      <div className="between">
        <h2 style={{ margin: 0 }}>Your alerts</h2>
        <span className="tiny">{alerts.length}</span>
      </div>
      <div className="chips" role="group" aria-label="Preview channel">
        {CHANNELS.map(([c, l]) => (
          <button key={c} className="chip small" aria-pressed={channel === c} onClick={() => setChannel(c)}>
            {l}
          </button>
        ))}
      </div>
      <ul className="alerts">
        {shown.map((a) => (
          <li key={a.id} className={`alert ${channel}`}>
            <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("alert_opened", { kind: a.kind, channel })}>
              <summary>
                <span className="alert-head">
                  <span className="alert-icon"><Icon name={KIND_ICON[a.kind]} size={16} /></span>
                  <span className="tiny">{channel === "email" ? "Email · Property Finder" : channel === "whatsapp" ? "WhatsApp · Property Finder" : "Property Finder"}</span>
                  <span className="tiny" style={{ marginLeft: "auto" }}>{date(a.date)}</span>
                </span>
                {channel === "push" ? (
                  <>
                    <b>{a.push.title}</b>
                    <span>{a.push.body}</span>
                  </>
                ) : channel === "whatsapp" ? (
                  <span className="wa-bubble">
                    {a.whatsapp.map((l, i) => (
                      <span key={i} style={{ display: "block" }}>{l}</span>
                    ))}
                  </span>
                ) : (
                  <b>{a.email.subject}</b>
                )}
              </summary>
              <p className="meta"><b>Why you got this:</b> {a.why}</p>
            </details>
            <span className={a.illustrative ? "src illustrative" : "src"}>{a.source}</span>
          </li>
        ))}
      </ul>
      {limit && alerts.length > limit ? (
        <button type="button" className="linkbtn" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `See all ${alerts.length}`}
        </button>
      ) : null}
      <p className="tiny">Delivery is simulated in this prototype: this is what would have been sent.</p>
    </div>
  );
}
