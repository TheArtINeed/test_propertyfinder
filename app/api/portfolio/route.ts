import { loadSnapshot } from "@/lib/data";
import { parsePortfolioHomes, portfolioSummary } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/** W14: PropWorth summary for the homes saved on the device (sent by the client; nothing stored). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const homes = parsePortfolioHomes(body);
  if (typeof homes === "string") return Response.json({ ok: false, error: homes }, { status: 400 });
  const { resales, rents } = loadSnapshot();
  return Response.json({ ok: true, portfolio: portfolioSummary(resales, rents, homes) });
}
