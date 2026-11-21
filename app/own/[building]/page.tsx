import { loadSnapshot } from "@/lib/data";
import { findBuilding, roomTypes } from "@/lib/market";
import { parseUnitQuery } from "@/lib/owner";
import { UnitForm } from "../../components/client";
import { BuildingNotFound, ComingSoon, FooterNote, TopBar } from "../../ui";

type Props = { params: Promise<{ building: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PickUnit({ params, searchParams }: Props) {
  const { building: slug } = await params;
  const sp = await searchParams;
  const q = parseUnitQuery(sp);
  const from = sp.from === "propworth" ? "propworth" : null;
  const { buildings, resales } = loadSnapshot();
  const b = findBuilding(buildings, slug);
  if (!b) return <BuildingNotFound />;
  if (!b.active) return <ComingSoon name={b.name} />;
  const rooms = roomTypes(resales, b.name);
  return (
    <main className="shell">
      <TopBar back="/own" title={b.name} />
      <h1>Your unit</h1>
      <p className="lead">
        {b.name} · {b.resales} resales in 2026. Takes 20 seconds.
      </p>
      <UnitForm slug={b.slug} roomOptions={rooms} initial={q ? { unit: q.unit, rooms: q.rooms, sizeSqm: q.sizeSqm } : undefined} from={from} />
      <FooterNote />
    </main>
  );
}
