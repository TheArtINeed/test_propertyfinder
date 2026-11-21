"use client";

import Link from "next/link";
import { useState } from "react";
import type { EventName } from "@/lib/events";
import type { Matched } from "@/lib/renter";
import { reminderDates, validateContact, type ContactChannel } from "@/lib/renter";
import { aed, dateLabel, roomsLabel } from "@/lib/format";
import { DEMO } from "@/lib/demo";
import { AS_OF } from "@/lib/types";
import { track } from "@/lib/track";
import { FieldError } from "../ui";

const CHANNELS: [ContactChannel, string][] = [
  ["whatsapp", "WhatsApp"],
  ["call", "Call"],
  ["email", "Email"],
];

/** Generic mocked lead sheet: channel, optional date, consent -> confirmation (V15, V17). */
export function ContactSheet({
  title,
  summary,
  dateLabelText,
  defaultDate,
  event,
  props,
  recipient,
  onClose,
}: {
  title: string;
  summary: React.ReactNode;
  dateLabelText?: string;
  defaultDate?: string;
  event: EventName;
  props: Record<string, string | number | boolean | null>;
  recipient: string;
  onClose: () => void;
}) {
  const [channel, setChannel] = useState<ContactChannel | null>(DEMO.viewing.channel);
  const [date, setDate] = useState(defaultDate ?? "");
  const [consent, setConsent] = useState<boolean>(DEMO.viewing.consent);
  const [errors, setErrors] = useState<ReturnType<typeof validateContact>>({});
  const [sent, setSent] = useState(false);

  function send() {
    const e = validateContact({ channel, date, needsDate: !!dateLabelText, consent });
    setErrors(e);
    if (Object.keys(e).length) return;
    track(event, { ...props, channel });
    setSent(true);
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="empty">
            <div className="icon" aria-hidden>✓</div>
            <h2>Request sent</h2>
            <p className="meta">{recipient} will contact you by {CHANNELS.find(([c]) => c === channel)![1]} via PF.</p>
            <p className="tiny">Prototype: nothing was sent.</p>
            <button className="btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="between">
              <h2>{title}</h2>
              <button className="linkbtn" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="card tint">{summary}</div>
            <label>How should we contact you?</label>
            <div className="chips" role="group" aria-label="Channel">
              {CHANNELS.map(([c, l]) => (
                <button key={c} className="chip" aria-pressed={channel === c} onClick={() => setChannel(c)}>
                  {l}
                </button>
              ))}
            </div>
            <FieldError msg={errors.channel} />
            {dateLabelText ? (
              <>
                <label htmlFor="c-date">{dateLabelText}</label>
                <input id="c-date" type="date" value={date} aria-invalid={!!errors.date} onChange={(e) => setDate(e.target.value)} />
                <FieldError msg={errors.date} />
              </>
            ) : null}
            <label className="check" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{recipient} may contact me via PF about this request.</span>
            </label>
            <FieldError msg={errors.consent} />
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={send}>Send request</button>
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

/** V14 + V15: owner-confirmed units, matches to the lease end first; each card opens a viewing request. */
export function OwnerConfirmedList({ units, leaseEnd }: { units: Matched[]; leaseEnd: string | null }) {
  const [open, setOpen] = useState<Matched | null>(null);
  return (
    <>
      <ul className="list" style={{ display: "block" }}>
        {units.map((u) => (
          <li key={u.id} style={{ display: "block", border: 0, padding: 0 }}>
            <button className={`unit-card ${u.matched ? "match" : ""}`} onClick={() => setOpen(u)}>
              <span>
                <span className="badge ok">Owner-confirmed</span>{" "}
                {u.matched ? <span className="badge coral">Free when your lease ends</span> : null}
                <br />
                <b>{roomsLabel(u.bedrooms)}, {u.sizeSqm} m²</b>
                <span className="meta"> · free from {dateLabel(u.availableFrom)}</span>
              </span>
              <span>
                <b>{aed(u.annualRent, { compact: true })}</b>/yr
                <br />
                <span className="meta">Request ›</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open ? (
        <ContactSheet
          title="Request a viewing"
          summary={
            <p className="meta">
              {roomsLabel(open.bedrooms)}, {open.sizeSqm} m² · {aed(open.annualRent)} a year · free from {dateLabel(open.availableFrom)}
            </p>
          }
          dateLabelText="I want to move in from"
          defaultDate={leaseEnd && leaseEnd >= AS_OF ? leaseEnd : open.availableFrom >= AS_OF ? open.availableFrom : AS_OF}
          event="renter_lead_submitted"
          props={{ unit: open.id, matched: open.matched }}
          recipient="The owner's agent"
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

/** V13: reminders before renewal and a monthly rent watch (mocked delivery, saved on the device). */
export function RenterReminders({ leaseEnd, building }: { leaseEnd: string | null; building: string }) {
  const [remind, setRemind] = useState(false);
  const [watch, setWatch] = useState(false);
  const dates = leaseEnd ? reminderDates(leaseEnd, AS_OF) : [];
  function save(next: { remind: boolean; watch: boolean }) {
    try {
      localStorage.setItem("pf.renter", JSON.stringify({ leaseEnd, building, ...next }));
    } catch {
      /* storage blocked */
    }
    track("renter_reminder_set", { remind: next.remind, watch: next.watch, has_lease_end: !!leaseEnd });
  }
  return (
    <div className="card">
      <h3>Come back at the right time</h3>
      {leaseEnd ? (
        <label className="check">
          <input
            type="checkbox"
            checked={remind}
            onChange={(e) => {
              setRemind(e.target.checked);
              save({ remind: e.target.checked, watch });
            }}
          />
          <span>
            Remind me before renewal:{" "}
            {dates.map((d) => `${dateLabel(d.date)} (${d.daysBefore} days before${d.past ? ", passed" : ""})`).join(" and ")}
          </span>
        </label>
      ) : (
        <p className="meta">Add your lease end above to get renewal reminders.</p>
      )}
      <label className="check" style={{ marginTop: 8 }}>
        <input
          type="checkbox"
          checked={watch}
          onChange={(e) => {
            setWatch(e.target.checked);
            save({ remind, watch: e.target.checked });
          }}
        />
        <span>Watch rents in {building} every month</span>
      </label>
      {remind || watch ? <p className="pos" style={{ marginTop: 8 }}>Saved. We will message you on WhatsApp.</p> : null}
      <p className="tiny">Reminders are simulated in this prototype.</p>
    </div>
  );
}

/** V17: buyer next steps under the bank gap. */
export function BuyerNextSteps({ asking, building, rooms }: { asking: number; building: string; rooms: number }) {
  const [open, setOpen] = useState<null | "mortgage" | "agent">(null);
  return (
    <div className="card">
      <h3>Next step</h3>
      <div className="stack">
        <button className="btn dark" onClick={() => setOpen("mortgage")}>Get mortgage pre-approval</button>
        <button className="btn secondary" onClick={() => setOpen("agent")}>Ask an agent about this unit</button>
      </div>
      {open === "mortgage" ? (
        <ContactSheet
          title="Mortgage pre-approval"
          summary={<p className="meta">Price {aed(asking)} · 80% loan · {building}, {roomsLabel(rooms)}</p>}
          event="mortgage_lead_submitted"
          props={{ building, price: asking }}
          recipient="A PF mortgage adviser"
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open === "agent" ? (
        <ContactSheet
          title="Ask an agent"
          summary={<p className="meta">{building}, {roomsLabel(rooms)} at {aed(asking)}</p>}
          event="buyer_lead_submitted"
          props={{ building, price: asking }}
          recipient="The listing agent"
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
