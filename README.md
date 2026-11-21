# PropWorth "My Home" prototype (Property Finder)

After the PropWorth valuation, a unit becomes **My Home**: a monthly update on rents, deals and demand in the building, plus one next step. The owner's intent ("rent out from / open to offers from / not now") becomes a qualified lead for agents and an "owner-confirmed" signal for renters. Renters get Rent watch and a renewal check; buyers get a fair-price and bank-gap check that turns into My Home with one tap.

Business case: `ONE-PAGER.md`. Dev spec: `docs/SPEC.md`.

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Vitest: lib, real-data checks, route smoke tests, events API
```
Python data tests: `python3 -m unittest discover -s tests -t .`

## Click-through
- `/` is the pitch: what you get, how it works, why save your home, then owner / renter / buyer entries.
- **Owner:** search "Luma" → 1BR, 80 m² → valuation with "What this means" and a price chart → **Get this every month** → My Home with tabs: Update (October 2026 digest, plans, agent lead), Analysis, News, Owners.
- **Renter** (`/rent`): Rent watch and what to do, allowed increase, owner-confirmed units, rent vs buy → `/buy`.
- **Buyer** (`/buy`): fair price, negotiation advice, bank valuation gap → **I bought this** → valuation prefilled.
- `/entry-points`: where My Home would appear on other Property Finder screens, and why each hook is useful.
- **Pilot: one building (Luma Park Views).** Other JVC buildings are shown as "coming soon" and cannot be chosen.
- **Demo prefill:** every form opens with demo values (`lib/demo.ts`) so you can click straight through; all fields are editable. Consent boxes are pre-ticked only for the demo: a real product never pre-ticks consent.
- **Sanity checks:** inputs must be plausible for a JVC home (rent AED 10K–2M a year, prices AED 100K–50M, loan ≤ price paid, lease end not in the past, dates within 2–5 years); the message shows under the field. Out-of-range values in shared links are ignored.

## Data
Real public data: Dubai Land Department resales and Ejari contracts for JVC, 1 Jan – 20 Nov 2026 (`dataset/`).
- Resales only: ready units, procedure "Sale" (off-plan, Delayed Sell and lease-to-own excluded).
- "This month" = **October 2026**, the last full month.
- **Hero building Luma Park Views is newly handed over**: 414 of 415 Ejari contracts are first lettings, so there are no renewals in the building yet; renewal checks use JVC-level contracts.
- Ejari rarely has bedrooms, so rents are compared by size (±15%).
- Unit number is stored but not used: DLD open data has no unit numbers.

## Real vs mocked
| Real (DLD / Ejari) | Mocked |
|---|---|
| Estimate and range, deal lists, outlook, rents, Rent watch, RERA proxy, yield, bank gap, rent vs buy, "What this means" readings, price chart, deal / lease news items | Demand block (labelled "Illustrative"), editorial news (tower, school, road works, service charge) and owners' posts (labelled illustrative), waitlist, title deed verification, leads (stored in the browser, nothing sent), owner-confirmed units (synthetic listings), mortgage rate (example 4.5%, editable) |

## Calculation notes
- Estimate: median AED/m² of comps in the last 3 months × size, range P25–P75. Fallback: same building any rooms → JVC same rooms; confidence drops to low.
- Outlook: JVC trend Jan–Mar vs Aug–Oct, annualised; ±5 pp, low end −5 pp more for supply risk; clamped to −20% / +15%. The 2026 data shows prices per m² **down** about 9% over that period, so the outlook is negative.
- RERA index proxy: **median** of all JVC contracts of the size band (new + renewed). The mean is unusable: Ejari has outliers from AED 50 to AED 9M a year. The official calculator uses DLD's own index; ours is a proxy.

## Not built
- **P1** (no entry point yet): break / move / negotiate calculator (R6), notification settings (O7), "I think it's worth" (O4), contact about an owner-confirmed unit (R5), "Something wrong?" report (C4), mock sign-in (C5). "My homes" (O5) is a list on the first screen only.
- **P2**: real title deed verification, real lead delivery, real email / WhatsApp, Arabic and RTL, move-out and deposit, areas beyond JVC and other markets, real PF demand data, Rent in 12, pay-per-deal matching with DLD / Ejari, history before 2026 (needs a Dubai Pulse key).
- Optional LLM wording of the digest was skipped; everything is deterministic.
