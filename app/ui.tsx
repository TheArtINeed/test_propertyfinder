import Link from "next/link";
import type { ReactNode } from "react";
import { SOURCES } from "@/lib/types";
import { Icon } from "./icons";
import { PortfolioPill } from "./components/portfolio";
import { BackButton } from "./components/back";
import { ResetDemoLink } from "./components/reset";

export function TopBar({ back, title }: { back?: string; title?: string }) {
  return (
    <header className="topbar">
      {back ? <BackButton href={back} /> : null}
      {title ? <span className="title">{title}</span> : <span className="brand">Property Finder · My Home</span>}
      {title !== "PropWorth" ? <PortfolioPill /> : null}
      {title ? (
        <Link className="iconbtn" href="/" aria-label="Home">
          <Icon name="home" />
        </Link>
      ) : null}
    </header>
  );
}

type SourceKind = keyof typeof SOURCES;
export function Source({ kind, children }: { kind: SourceKind; children?: ReactNode }) {
  const cls = kind === "illustrative" ? "src illustrative" : kind === "owner" ? "src owner" : "src";
  return (
    <span className={cls}>
      {SOURCES[kind]}
      {children}
    </span>
  );
}

export function Empty({ icon, title, hint, action }: { icon: string; title: string; hint: string; action: ReactNode }) {
  return (
    <div className="card empty">
      <div className="icon" aria-hidden>
        {icon}
      </div>
      <h3>{title}</h3>
      <p className="meta">{hint}</p>
      {action}
    </div>
  );
}

export function FooterNote() {
  return (
    <p className="footer-note">
      Prototype. Prices and rents: Dubai Land Department open data (resales and Ejari contracts, JVC, 1 Jan – 20 Nov
      2026). Estimates are not advice. Demand numbers are illustrative. <ResetDemoLink />
    </p>
  );
}

export function BuildingNotFound() {
  return (
    <main className="shell">
      <TopBar back="/own" title="Not found" />
      <Empty
        icon="⌕"
        title="We can't find this building"
        hint="The link may be old. The pilot is open for Luma Park Views in JVC."
        action={
          <div className="stack">
            <Link className="btn" href="/own">Search again</Link>
          </div>
        }
      />
    </main>
  );
}

export function MissingUnit({ slug }: { slug: string }) {
  return (
    <main className="shell">
      <TopBar back={`/own/${slug}`} title="Your unit" />
      <Empty
        icon="?"
        title="We need your unit details"
        hint="Bedrooms and size are missing from this link."
        action={<Link className="btn" href={`/own/${slug}`}>Add unit details</Link>}
      />
    </main>
  );
}

export function BuildingSelect({
  buildings,
  value,
  allOpen,
}: {
  buildings: { name: string; slug: string; active: boolean }[];
  value?: string;
  allOpen?: boolean;
}) {
  if (allOpen) {
    const sorted = [...buildings].sort((a, c) => Number(c.active) - Number(a.active) || a.name.localeCompare(c.name, "en", { sensitivity: "base" }));
    return (
      <>
        <label htmlFor="b">Building</label>
        <select id="b" name="b" defaultValue={value || sorted[0]?.slug}>
          {sorted.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
        <p className="hint">Any JVC building: rents come from Ejari contracts across JVC.</p>
      </>
    );
  }
  const active = buildings.filter((b) => b.active);
  const soon = buildings.filter((b) => !b.active);
  return (
    <>
      <label htmlFor="b">Building</label>
      <select id="b" name="b" defaultValue={value || active[0]?.slug}>
        {active.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
        {soon.length ? (
          <option value="" disabled>
            Other JVC buildings: coming soon
          </option>
        ) : null}
      </select>
      <p className="hint">The pilot is open for {active.map((b) => b.name).join(", ")}. Other JVC buildings are coming soon.</p>
    </>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  return msg ? (
    <p className="error" role="alert">
      {msg}
    </p>
  ) : null;
}

export function RoomsSelect({ value }: { value?: number }) {
  return (
    <>
      <label htmlFor="rooms">Bedrooms</label>
      <select id="rooms" name="rooms" defaultValue={value != null ? String(value) : "1"}>
        <option value="0">Studio</option>
        <option value="1">1 bedroom</option>
        <option value="2">2 bedrooms</option>
        <option value="3">3 bedrooms</option>
      </select>
    </>
  );
}

export function ComingSoon({ name }: { name: string }) {
  return (
    <main className="shell">
      <TopBar back="/own" title={name} />
      <Empty
        icon="⏳"
        title={`${name} is coming soon`}
        hint="The pilot is open for Luma Park Views in JVC. We will open more buildings next."
        action={
          <div className="stack">
            <Link className="btn" href="/own/luma-park-views">Try Luma Park Views</Link>
            <Link className="btn secondary" href="/own">Back to search</Link>
          </div>
        }
      />
    </main>
  );
}
