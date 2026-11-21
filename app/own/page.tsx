import { loadSnapshot } from "@/lib/data";
import { BuildingSearch } from "../components/client";
import { FooterNote, TopBar } from "../ui";

export default function OwnSearch() {
  const { buildings } = loadSnapshot();
  return (
    <main className="shell">
      <TopBar back="/" title="Find my home" />
      <h1>Find your building</h1>
      <p className="lead">Jumeirah Village Circle. Pilot: Luma Park Views, {buildings.length - 1} more buildings coming soon.</p>
      <div className="card">
        <BuildingSearch buildings={buildings} />
      </div>
      <FooterNote />
    </main>
  );
}
