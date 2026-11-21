# Dev spec: PropWorth "My Home" prototype

Status: draft v6, 2026-11-21 (v4 review changes: section 11; v5 demo prefill: section 12; v6 sanity checks: section 13). Scope = what we build in the timed task (~3 h). Business framing will live in `ONE-PAGER.md` (to be written). Support cases are detailed in `prep/support_cases_spec.md`; section 9 here is the single list of all cases with v2 priorities.

## 1. Idea in one line
A resale buyer's search does not end at the key handover: after the PropWorth valuation, the unit becomes **"My Home"**, and every month the owner gets a **digest** tied to money that moves anyway (rent in, mortgage out): rents and deals in the building, demand for a unit like theirs, and one next step. The owner sets an **intent** ("rent out from / open to offers from X / not now"), which becomes a qualified lead for agents and an **"owner-confirmed"** signal for renters.

**Primary user: investor-landlord** (JVC 2026: ~10 Ejari lettings for every resale). **Renter flow is mandatory** and visible from the first screen. Owner-occupier is a variant of the owner flow (same screens, capital first).

## 2. Users and flows
| Flow | User | Entry | Outcome |
|---|---|---|---|
| A. Owner (investor first) | Bought a ready unit from another owner | First screen: "I own a home" | PropWorth valuation (as today) -> "Get this every month" -> monthly digest -> intent -> agent lead |
| B. Buyer -> owner | Checking a resale unit before the offer | Link from first screen and from renter "rent vs buy" | Fair price, bank valuation gap, "I bought this" -> flow A, prefilled |
| C. Renter | Rents in JVC | First screen: "I rent" | Rent watch (my rent vs market), allowed increase, rent vs buy -> flow B |

The owner always reaches the digest **from the valuation**: the valuation screen is the existing PropWorth step, the digest is our idea on top of it. Flow B is the thesis entry ("the owner on PF starts as a buyer"), so it is P0.

Agents are not built. They appear only as the destination of a lead.

## 3. Data (public only)
- `dataset/dld_jvc_sales.json`: DLD transactions, JVC, 1 Jan - 20 Nov 2026. Owner-to-owner resales only: `off_plan=false` and `procedure == "Sale"` (~3.6K rows). `Delayed Sell` (~380, likely off-plan handovers) and lease-to-own are excluded.
- `dataset/dld_jvc_rents.json`: Ejari contracts, JVC, same period, 34.7K rows. Rooms almost always empty -> compare by size band (+-15%).
- **Hero building: Luma Park Views.** 90 resales (1-3BR) and 415 Ejari contracts over all 11 months. **It is a newly handed-over building:** 101 `Delayed Sell` registrations in 2026 and 414 of 415 contracts are first lettings (`New`). Rent volume is a first-letting wave (64 in Jun, 25 in Oct), not a steady monthly level; there are no renewals yet, so RERA renewal checks use JVC-level contracts. Say this in README and the demo copy where relevant ("keys just handed over: what next" fits the idea). **Fallback: Binghatti Apex** (222 resales, 279 contracts, data from May 2026, studios and 1BR only).
- **Digest month M = last full month in the snapshot: October 2026.** November is partial (data ends 20 Nov) and is not shown as "this month". All "this month" copy and tests use M = 2026-10, M-1 = 2026-09.
- Building search: buildings with >= 10 resales; others show "not enough deals, JVC-level estimate".
- RERA rent increase bands (Decree 43/2013) hard-coded from the public table.
- **Demand block is mocked** (PF search data is not public): deterministic numbers per unit type and price band, labelled "Illustrative: based on PF searches in production".
- No PF listings, no photos, no accounts. Synthetic listings (`dataset/listings.json`) only for "owner-confirmed" cards in the renter flow.

## 4. Calculations (pure functions in `lib/`, no LLM)
1. **Comps**: resales in the same building, same rooms, size +-15%. Fallback: building any rooms (AED/sqm) -> JVC same rooms. Return the level used.
2. **Estimate and range**: median AED/sqm of comps over the **last 3 months rolling** x unit size; range P25-P75. Confidence: high (>= 10 comps), medium (5-9), low (< 5 or fallback). Never show a single number without the range.
3. **Outlook (12 months)**: JVC trend = rolling 3-month median AED/sqm of resales, first 3 months (Jan-Mar) vs last 3 full months (Aug-Oct), annualised. Range: trend +-5 pp, with the lower bound moved down a further 5 pp for 2026-27 supply risk; whole range clamped to -20% / +15% a year. Labelled "estimate, not advice". No regression on one building.
4. **Monthly digest** for month M, in this order:
   1. **Rent**: new Ejari leases in the building for the owner's size band in M (count, median, range) vs the owner's rent if entered; lease end countdown ("re-let window opens in N days").
   2. **Deals**: list of resales in the building in M ("3 flats like yours sold for X-Y"), price on a rolling 3 months.
   3. **Demand (mocked)**: "N people searched for a 1BR in JVC up to AED X this month".
   4. **Capital**: value range change; with optional price paid and loan: value - loan - 4% DLD fee. Owner-occupier variant shows this first.
   5. **One next step** from rules: lease ends in <= 90 days -> "re-let: set intent"; owner rent > market +10% -> "renewal risk: consider a discount"; demand high and yield < JVC median -> "open to offers?". The last rule runs on mocked demand, so its card carries the "Illustrative" label.
   Months with no deals still show rents and demand (no empty digest).
5. **Rent level and yield**: median annual rent for the size band in the building -> gross yield = rent / estimate.
6. **Bank valuation gap** (flow B): asking price vs estimate; if asking > P75: "the bank may value below the price; the gap is paid in cash", 80% LTV example.
7. **Rent watch** (flow C): user's rent vs median **new-lease** rent for the size band (building, else JVC) -> % gap and percentile. Answers "what would I pay if I moved now".
8. **Allowed increase**: RERA index proxy = average of **all** Ejari contracts (new + renewed) for the size band in JVC, since the official index reflects the whole market, not only new leases. The UI labels the two numbers differently ("new leases now" vs "RERA index proxy") so they do not look contradictory. RERA bands by how far rent is below the average (<=10%: 0; 11-20%: 5%; 21-30%: 10%; 31-40%: 15%; >40%: 20%).
9. **Break / move at renewal / negotiate**: monthly saving = (my rent - market rent) / 12. Costs: break penalty (input, default 2 months' rent), agent fee 5% of new rent, moving (default AED 2,000). Months to pay back for each option vs months left on the lease. Copy: "terms depend on your contract".
10. **Rent vs buy**: same-size unit estimate, 20% down + 4% DLD fee, 25-year mortgage at an editable rate (default from a cited public source; if none is found, labelled "example rate"), monthly payment vs monthly rent.

## 5. Screens (mobile first, 375 px, `design.md` styles)
| Route | Content |
|---|---|
| `/` | Two big cards: "I own a home" / "I rent". Clear third link: "Buying a resale? Check the price". |
| `/own` | Building search (autocomplete), hero building suggested. |
| `/own/[building]` | Pick the unit. **Required only:** unit number (stored, not in DLD; explained in README), rooms, size (sqm / sqft). Everything else is asked later, after the valuation. |
| `/own/[building]/value` | **PropWorth step (as today):** estimate + range + confidence, "based on N deals" (deal list), 12-month outlook. CTA: **"Get this every month"** -> optional details ("I let it / I live in it", rent + lease end, price paid + loan) -> My Home. |
| `/own/[building]/home` | **My Home:** digest preview (as the monthly email / WhatsApp would look) for October 2026, yield, capital. **Intent card**: not now / rent out from [date] at [rent] / open to offers from [price] -> lead sheet. |
| `/rent` | Building + size + current rent + lease end -> Rent watch, allowed increase, **owner-confirmed** units in the building (static card), rent vs buy -> `/buy`. |
| `/buy` | Building + size + asking price -> fair price vs DLD deals, bank valuation gap risk, **"I bought this"** -> `/own/[building]/value` prefilled (unit, size, price paid). |
| Lead sheet (modal) | Intent, date, price / rent, consent ("an agent may contact me via PF"); "A verified agent will contact you" (mocked, logged). |

Units saved in `localStorage` (no login). Plain English, no pitch text or instructions in the UI. Every number has a source label (DLD / Ejari / estimate / illustrative).

## 6. Events (for the test and the data section)
`POST /api/events` (console + in-memory) and `localStorage`: `unit_claimed`, `valuation_viewed`, `get_monthly_clicked` (valuation -> digest conversion), `digest_opened`, `session_started` (with months since claim: the base of month-2 retention), `deal_list_opened`, `owner_estimate_entered`, `intent_set` (type, date, price), `lead_submitted`, `rent_checked`, `break_calc_viewed`, `owner_confirmed_viewed`, `rent_vs_buy_viewed`, `bought_this`. No real storage.

## 7. LLM (optional, last)
One OpenAI call phrases the digest in 2 sentences from computed numbers only (numbers passed in, never generated). Deterministic template fallback when the key is missing or the call fails. Skip if time is short.

## 8. Tests (Vitest, `npm test`)
- `lib/`: comps filter and fallback chain; estimate and range on fixtures; rolling 3 months; outlook trend, supply-risk widening and clamp at -20% / +15%; digest for M = 2026-10 (order, counts vs raw rows, the no-deals month); next-step rules at each threshold; yield; capital incl. 4% fee; bank gap; Rent watch gap vs new leases; RERA proxy uses all contracts; RERA bands at each boundary; rent vs buy payment formula; "I bought this" prefill payload; mocked demand is deterministic and labelled; break / renew / negotiate payback (if R6 is built).
- Data: resale filter excludes `Delayed Sell`; hero building has >= 50 resales and >= 200 contracts; every building in search has >= 10 resales; October 2026 (M) is fully covered: sales and rent rows up to 31 Oct, no week without rows (DLD does not register every day, e.g. some weekend days).
- API: `/api/events` accepts known events, rejects unknown.
- Smoke: each route renders for the hero building.

## 9. All use cases and scope cut
One list of every case: core flows from this spec plus support cases from `prep/support_cases_spec.md` (details, acceptance criteria and edge cases live there). Priorities below replace the ones in that file.
- **P0**: works in the click-through, built first.
- **P1**: built if time allows; otherwise a visible entry point to a simple stub screen.
- **P2**: not built; listed in README as known missing work.

**Owner (investor first)**

| ID | Case | v2 change | Priority |
|---|---|---|---|
| O1 | Find my home and claim the unit | + **unit number**; only unit number, rooms, size required before the valuation; title deed number -> "Verification pending" (mocked) | P0 |
| O0 | **PropWorth valuation -> "Get this every month"** (new) | Existing valuation step as the start of the owner flow; the CTA is the bridge to the digest | P0 |
| O2 | Change property status | Statuses: I let it / I live in it / For sale / Not available; "I let it" asks rent + lease end | P0 |
| O3 | Rent out or sell through an agent (lead) | Triggered by the intent card; payload + consent; stored in "My requests" | P0 |
| O6 | Contact preferences -> **owner intent** | Promoted to core: not now / rent out from date at rent / open to offers from price | P0 |
| O8 | Lease renewal for a let unit | Promoted: lease end countdown and allowed increase feed the digest's first block | P0 |
| O10 | **Monthly digest preview** (new) | Rents, deals, demand (mocked), capital, one next step; empty months still show rents | P0 |
| O4 | "I think it's worth" (owner's own value) | Unchanged; also data for the model | P1 |
| O5 | Add another property ("My homes") | Investors often own several units | P1 |
| O7 | Notification settings | = digest settings: monthly / only big changes / off; channel email / WhatsApp; in-app inbox of what would be sent | P1 |
| O9 | Remove a property, delete my data | Unchanged | P1 |

**Renter (mandatory)**

| ID | Case | v2 change | Priority |
|---|---|---|---|
| R1 | Renter entry from the first screen | One of two big cards | P0 |
| R2 | Is my rent fair -> **Rent watch** | My rent vs new leases like mine (building, else JVC), % gap, below / around / above | P0 |
| R3 | Renewal check: is the increase allowed | Promoted: same RERA function as O8, 90-day notice, link to the Rental Dispute Center | P0 |
| R7 | **Owner-confirmed units in my building** (new) | Static card: units whose owner set "rent out from date" (synthetic listings), badge + date | P0 |
| R4 | Renter to owner: rent vs buy | Monthly payment vs rent for the same size, link to `/buy` (the renter -> owner link the brief asks for) | P0 |
| R6 | **Break / move at renewal / negotiate** (new) | Payback calculator, "terms depend on your contract" | P1 |
| R5 | Contact about an owner-confirmed listing | Call / WhatsApp / email, mocked, confirmation | P1 |

**Buyer -> owner (thesis entry)**

| ID | Case | Priority |
|---|---|---|
| B1 | Fair price and bank valuation gap before the offer | P0 |
| B2 | "I bought this" -> unit goes to the PropWorth valuation step, prefilled, then My Home | P0 |

**Common**

| ID | Case | v2 change | Priority |
|---|---|---|---|
| C1 | Source and estimate labels | + "Illustrative" label for mocked demand | P0 |
| C2 | Empty, low-data and error states | + month with no deals; building with < 10 resales (JVC fallback) | P0 |
| C3 | Mobile navigation and deep links | Back keeps input; unit page has its own URL | P0 |
| C6 | Consent for owner data | Promoted: one checkbox in claim and lead sheet; contact only via PF | P0 |
| C4 | Report wrong data / contact support | "Something wrong?" on unit and rent pages | P1 |
| C5 | Sign in, sign out (mock profile) | Unchanged | P1 |

**P2, README only:** X1 real title deed verification; X2 real lead delivery to agents; X3 real email / WhatsApp / push; X4 Arabic and RTL; X5 move-out and deposit return; X6 areas beyond JVC and other markets; X7 real PF demand data; X8 Rent in 12 monthly payments; X9 pay-per-deal matching with DLD / Ejari; X10 history before 2026 (Dubai Pulse key).

**Time check:** P0 is 18 cases, many are one screen or one function (O8 and R3 share the RERA function; O2, O3, O6 share the intent card; B2 reuses the O0 valuation screen). If P0 runs over the budget, cut in this order: R7 -> static text, O10 demand block -> static text, C2 error states -> one generic state, O2 status history -> current status only. Never cut O0, O10, B1, B2, R2, R4: they are the brief's links (valuation -> idea, buyer -> owner, renter -> owner).

## 10. Build order (time-boxed)
1. Data loader + `lib/` calculations + tests (~45 min)
2. Owner P0: O1, O0 valuation + "Get this every month", O10 digest preview, O6 + O3 intent card and lead sheet (consent C6), O2, O8 (~60 min)
3. Buyer P0: B1 fair price + gap, B2 "I bought this" -> O0 prefilled (~20 min)
4. Renter P0: R1, R2 Rent watch, R3, R4 rent vs buy -> `/buy`, R7 static card (~30 min)
5. Common P0: C1 labels, C2 states, C3 navigation (~15 min, alongside steps 2-4)
6. Events API, README (incl. P1 / P2 lists, new-building note), deploy to Vercel (after approval) (~25 min)
7. P1 if time: R6, O7, O4, O5, O9, R5, C4, C5.
8. Optional LLM digest wording.

## 11. v4: changes after the click-through review
Review findings: the product is not "sold" to the user (why come, why sign up, what I get), the numbers come without meaning, and there is no reason to come back between digests. Changes, all P0 unless marked:

| ID | Change | Acceptance |
|---|---|---|
| V1 | **Inline form errors**: each error shows under its own field and clears when the field is edited. Validation in `lib/forms.ts` (`validateUnitForm`, `validateClaim`, per-field errors for `/rent` and `/buy`). | No error text next to the submit button; tested per field. |
| V2 | **One pilot building**: only Luma Park Views is open. Other buildings stay visible but cannot be chosen: "Coming soon" in search and in selects (`ACTIVE_BUILDINGS`). Direct links to them show a "coming soon" screen with a way back. No-match search: "Notify me when it opens" (mocked, `waitlist_joined`). The JVC-level "other building" path is removed from the UI. | Inactive buildings are disabled everywhere; tested. |
| V3 | **Pitch screen** (`/`): what My Home is, what you get (value every month from real deals, rent right, news that moves your price, agents only on your terms), how it works in 3 steps, sample of the update, why save the home (free valuation needs no sign-up; saving gives the monthly update and the owners' space), then the owner / renter / buyer entries. | A first-time user can answer "why should I do this" from the first screen. |
| V4 | **Entry points from the rest of the site** (`/entry-points`): mock PF surfaces with a My Home hook and a one-line "why it is useful to me": listing page in the building, Transactions list, PropWorth result, Account tab, rent search results, mortgage calculator. Each click logs `entry_point_clicked` with its source. | Each entry leads into the right flow with context. |
| V5 | **"What this means" analysis** (`lib/insights.ts`), each reading with a tone (good / watch / neutral, icon + label, never color alone) and one action: price level vs JVC for the same bedrooms; building momentum vs JVC (previous vs last 3 months); liquidity rank by resales; yield vs JVC; new-building letting wave; JVC market direction. One headline (e.g. "A strong building in a softening market"). Renter: verdict + what to do at renewal. Buyer: what the asking price means + negotiation step. | On the valuation, My Home, `/rent` and `/buy`; real data; tested on fixtures and the snapshot. |
| V6 | **Price chart** like a stock app: median AED/m² by month, building vs JVC flats, Jan–Oct 2026; one axis, hover tooltip, table view; months with < 3 deals shown as gaps. Palette validated (`#6250d6` / `#eb6834`). | On the valuation and in the My Home "Analysis" tab. |
| V7 | **News feed** (stock-app news tab) on My Home: items generated from real data (top deal / new 2026 high, deal count vs average, new leases) plus illustrative editorial items (planned tower and view risk, new school, road works, service charge budget), each with an impact tag (▲ / ▼ / •) on the price. Illustrative items are labelled "Illustrative example, not a real event". | Real and illustrative items are never mixed up; tested. |
| V8 | **Owners' community** (P1, illustrative): verified-owner posts by topic (renewals, building, selling, letting), "Helpful" reactions (local), posting disabled until verification. | Clearly labelled illustrative; `post_reacted` event. |
| V9 | **My Home tabs**: Update (digest + plans) / Analysis / News / Community, in the URL (`?tab=`) so each tab has a deep link. | Back and shared links keep the tab. |

New events: `waitlist_joined`, `entry_point_clicked`, `feed_opened`, `post_reacted`, `insight_opened`.
Not real (README): editorial news, community posts, demand, waitlist. The analysis readings use real DLD / Ejari data only.

## 12. v5: demo prefill
So reviewers can click through without typing, **every field of every form is prefilled with a demo value and stays editable**. One source of demo values: `lib/demo.ts` (a 1BR, 80 m² unit in Luma Park Views, let at AED 95K until 31 Jan 2027).

| ID | Form | Prefill |
|---|---|---|
| V10a | Find my home | Luma Park Views (done in v4) |
| V10b | Unit picker | unit 1204, 1BR, 80 m² |
| V10c | "Get this every month" sheet | I let it, rent AED 95,000, lease ends 2027-01-31, price paid AED 1,100,000, loan AED 600,000, title deed DEMO-0001, consent ticked |
| V10d | Plans card | Rent out from 2027-02-01 at the market rent (new leases median); "Open to offers" switches to the top of the estimate range |
| V10e | Agent request sheet | intent and price from the plans card, available from 2027-02-01, contact WhatsApp, consent ticked |
| V10f | Status sheet | current status; for "I let it" the saved rent and lease end, else the demo ones |
| V10g | `/rent` | Luma Park Views, 1BR, 80 m², rent AED 90,000, lease ends 2027-02-15, landlord asks 10% |
| V10h | `/buy` | Luma Park Views, 1BR, 80 m², asking AED 1,450,000 |

Rules:
- Prefill only on first open. After a submit the form shows what the user sent, including empty fields, so the V1 errors still appear.
- Results are not shown until the user presses the button: prefill saves typing, it does not skip the step.
- Consent is ticked only because this is a demo: a real product never pre-ticks consent (README says so).
- Acceptance: every input, select and checkbox renders with a value; editing works; an empty submit still shows errors; tested.

## 13. v6: sanity checks
Inputs must be plausible for a JVC home, not only "a positive number". One set of limits in `lib/sanity.ts`; the error shows under the field (V1). Today = 2026-11-21 (the prototype's fixed date).

| Field | Rule | Message (example) |
|---|---|---|
| Annual rent (owner, renter, status, plans, lead) | AED 10,000 – 2,000,000 | "Enter a yearly rent between AED 10,000 and 2,000,000" |
| Price paid, asking price, offers from, sale price | AED 100,000 – 50,000,000 | "Enter a price between AED 100,000 and 50,000,000" |
| Loan left | AED 0 – 50,000,000 and not more than the price paid | "The loan can't be more than the price paid" |
| Lease end (owner, status, renter) | not in the past, at most 5 years ahead | "The lease end is in the past: enter the current lease" |
| Rent out from, available from | today to 2 years ahead | "Pick a date from today to 2 years ahead" |
| Landlord asks for an increase | 0 – 100% | "Enter 0 to 100%" |
| Mortgage rate | 0 – 20% | "Enter a rate from 0 to 20%" |
| Title deed (optional) | 3 – 30 letters, digits or dashes | "Use letters, digits and dashes" |
| Unit number | 1 – 12 letters, digits or dashes | "Use letters, digits and dashes" |
| Size | 15 – 1,500 m² (as in V1) | unchanged |

- Deep links: out-of-range URL values (e.g. `paid=10000000000`) are ignored, as if not given, so My Home never shows absurd equity or gains.
- Acceptance: every rule tested at both bounds; every form shows the message under its field; demo values pass all rules.
