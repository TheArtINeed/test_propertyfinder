# PropWorth "My Home": the search doesn't end at the keys

**In one line:** the owner on Property Finder starts as a buyer. We catch them at the deal ("I bought this"), give them a monthly reason to open PF tied to money that moves anyway (rent in, mortgage out), and earn when they act: re-let, sell, refinance. Renters see the same building from the other side.

Detailed pitch, competitor review and financial model: in the Google Drive folder of this submission. Prototype scope: [`docs/SPEC.md`](docs/SPEC.md).

## The market
- **Who owns:** Dubai has ~900-935K homes ([C&W](https://www.khaleejtimes.com/business/property/will-dubai-housing-market-see-an-oversupply-in-2026)); ~66-71K resales a year ([fäm](https://famproperties.com/real-estate-reports/2025)). ~90% of residents are expats; many owners are investors living abroad. In JVC, our area, 2026 had 34.7K Ejari lettings vs ~3.6K owner-to-owner resales ([DLD open data](https://dubailand.gov.ae/en/open-data/real-estate-data/)): owners act as landlords ~10x more often than as sellers.
- **What they deal with and who they pay:** monthly mortgage, rent in, DEWA; yearly service charges, Ejari renewal (RERA-capped increase, 90-day notice), fixed-rate reset; once DLD 4% fee, NOC. They pay agents (2% on a sale, 5% of rent on a let) and banks, and talk to tenants, building management and DLD.
- **Problem behind the brief (our hypothesis):** owners don't come back because PF has no role between two deals. When they re-let or sell, PF sees the unit only after an agent lists it; DLD even had to ban agents' cold calls to owners ([Gulf News](https://gulfnews.com/business/property/cold-calling-costs-nine-property-brokers-in-dubai-with-3-month-suspension-dh50000-fine-for-firm-1.1651229004619)).
- **Competitors:** Zoopla keeps owners with a monthly email ([40% check monthly](https://www.zoopla.co.uk/press/releases/over-4-million-homeowners-are-now-using-zooplas-myhome-to-track-their)); realestate.com.au turns tracked homes into listings. Bayut has a valuation and a watchlist. Nobody links **verified owner + exact unit + intent + demand + the renter in the same building**.

## Who it helps (Luma Park Views, JVC, real 2026 DLD / Ejari data)
- **Owner (investor, primary):** 1BR let at AED 96K since January. The digest shows new leases for flats like theirs at AED 80-85K and the re-let window opening in October. One tap: "rent out from 19 Jan at AED 85K"; a verified agent gets the lead.
- **Renter:** pays AED 96K; new leases for the same size in the building were ~AED 80K in Aug-Oct (median of 86), ~17% lower. Breaking the lease doesn't pay (2 months' penalty + agent fee + moving ≈ 16 months of savings); renegotiating or moving at renewal does. Sees units confirmed available by their owner.
- **Buyer:** asked AED 1.5M for an 80 m² 1BR; the 11 similar resales in Aug-Oct (a same-day bulk deal counted once) sold for AED 1.09-1.32M (estimate ~AED 1.29M), so the bank will likely value lower and ~AED 168K more cash is needed at 80% LTV. "I bought this" turns the estimate into their owner page.
- **Seller:** sets "open to offers from AED 1.4M" next to the 11 similar 1BR resales of Aug-Oct (AED 1.09-1.32M); the agent gets a seller with a price, not a cold list.

## Which metrics it moves
Portal big numbers: **supply** (listings), **engagement** (returning users), **leads**, **revenue per lead / deal**. Year 3, Dubai, base case; inputs are assumptions to check with PF data.
- **Engagement:** owner month-2 retention, +2 pp to prove in the test.
- **Supply and leads:** ~8K owner leads a year (5.8K landlord, 2.2K seller) from ~80K tracked owners (~9% of stock; ~10K a year join at the deal: resales x PF reach x claim rate, the rest from current valuation users).
- **Trust:** owner-confirmed listings for renters (matched by Trakheesi permit).
- **Revenue:** ~$3.1M a year (bear $0.5M, bull $11M), ~2% of PF UAE revenue.
- **Next segment: owner-occupiers who trade up.** Each move is three leads (sell, buy, mortgage), and end users are a rising share of buyers (43% of 2025 deals, [Betterhomes](https://www.bhomes.com/en/blog/market-reports/what-really-drove-dubais-property-market-in-2025)). Rough size: if 20-30% of ~80K tracked owners live in their home and 10-15% of them move a year, that is ~5-11K leads a year, the same order as the landlord loop (assumptions, no official owner-occupier split). Not in this prototype: in JVC lettings outnumber resales ~10:1, a move comes every 7-10 years vs a lease every year, and the next home usually sits outside our JVC data, so a "gap to my next home" would rest on invented prices. Landlords first, then an upgrade plan on community-wide DLD data.
- **The bigger bet:** an owner lead with an exact unit is the easiest to match to a registered DLD / Ejari deal, so it is the cheapest place to prove **pay per closed deal**. Agent commissions in Dubai resale and rent are ~$1.6-2.8B a year; each 1% of deals closed through PF at a 15% fee is ~$2.4-4.2M a year. I ran this model before at Cian (Russia): qualified leads sold as a transaction, paid as a share of the broker's commission, and it worked for both the platform and the agents.

## What the data makes possible
Owners get a better estimate from their own corrections; renters get owner-confirmed listings; buyers get a likely bank valuation; agents get intent leads and supply forecasts by building; developers get aggregated demand vs supply. **Never:** sell or show an owner's identity or own estimate, or let agents reach an owner without the owner's action. **Infrastructure:** monthly DLD + Ejari load, unit registry, consent store, personal data apart from analytics, lead-to-deal matching.

## One number and the 1% test
**Owner month-2 retention:** share of owners with a PF session in their second month after the valuation. Test on 1% of owners with a valuation; **both arms get a monthly email** (treatment: digest + intent; control: valuation only), so we test what brings owners back, not the email itself. Baseline assumed 4%; +2 pp needs ~1.9K owners per arm (1% is enough from ~190K owners), 3 cycles. Guardrails: unsubscribes, agent complaints. Stop if it doesn't move in 2 cycles. Full metric tree, guardrails and the PF data we read: [`docs/DATA.md`](docs/DATA.md).

**Honest view:** retention alone is a modest bet, and the bear case loses money. We back it for supply before listing and the cheapest proof of pay per deal. Main risk: valuation accuracy (DLD has no floor, view or condition), so we always show a range and the deals behind it.
