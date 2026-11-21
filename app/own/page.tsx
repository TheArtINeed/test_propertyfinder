import { loadSnapshot } from "@/lib/data";
import { BuildingSearch } from "../components/client";
import { FooterNote, TopBar } from "../ui";

export default async function OwnSearch({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const from = (await searchParams).from === "propworth" ? "propworth" : null;
  const { buildings } = loadSnapshot();
  return (
    <main className="shell">
      <TopBar back="/" title="Find my home" />
      <h1>{from ? "Add a home to your PropWorth" : "Find your building"}</h1>
      <p className="lead">Jumeirah Village Circle. Pilot: Luma Park Views, {buildings.length - 1} more buildings coming soon.</p>
      <div className="card">
        <BuildingSearch buildings={buildings} from={from} />
      </div>
      <FooterNote />
    </main>
  );
}
