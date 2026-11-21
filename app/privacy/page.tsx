import { FooterNote, TopBar } from "../ui";

export default function Privacy() {
  return (
    <main className="shell">
      <TopBar back="/" title="How we use data" />
      <div className="card stack">
        <h2>Your home data</h2>
        <p>We store your unit, its status, your plans and requests to send your monthly update and to pass your request to an agent when you ask.</p>
        <p>Agents can contact you only through PF and only within the plans you set. We do not sell or share your number.</p>
        <p>You can remove a home or delete all your data at any time from the My Home page. This also withdraws your consent.</p>
        <p className="meta">In this prototype everything stays in your browser (local storage). Nothing is sent to agents, and the title deed is not checked.</p>
      </div>
      <FooterNote />
    </main>
  );
}
