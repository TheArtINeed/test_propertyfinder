# Dev spec: PropWorth "My Home" prototype

Status: draft v15, 2026-11-21; version 2 (tag v2) builds sections 18-22 except the items listed as not built in README (v15 product hygiene: section 22; v14 design review: section 21; v13 Golden Visa, listings in my building, my dates: section 20; v12 trust and event alerts: section 19; v11 PropWorth portfolio: section 18; v10 as-built audit: section 17; v4 review changes: section 11; v5 demo prefill: section 12; v6 sanity checks: section 13; v7 return and lead loop, separate news: section 14; v8 review fixes: section 15; v9 update preview on the valuation: section 16). Scope = what we build in the timed task (~3 h). Business framing will live in `ONE-PAGER.md` (to be written). Support cases are detailed in `prep/support_cases_spec.md`; section 9 here is the single list of all cases with v2 priorities.

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

v7 adds `digest_subscribed` (channel, frequency), `renter_reminder_set`, `renter_lead_submitted` (unit, matched yes / no), `lead_status_viewed`, `mortgage_lead_submitted`, `buyer_lead_submitted`, `news_opened` (item, real / illustrative). **Funnel for the one number** (test on 1% of owners): `valuation_viewed` -> `digest_subscribed` -> `session_started` in month 2 -> `intent_set` -> `lead_submitted`.

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
| O7 | Notification settings | = digest settings: monthly / only big changes / off; channel email / WhatsApp; in-app inbox of what would be sent | P0 (v7, via V11) |
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
| R5 | Contact about an owner-confirmed listing | Call / WhatsApp / email, mocked, confirmation. v7: done by V15 | P0 (v7) |

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

**P2, README only:** X1 real title deed verification; X2 real lead delivery to agents; X3 real email / WhatsApp / push; X4 Arabic and RTL; X5 move-out and deposit return; X6 areas beyond JVC and other markets; X7 real PF demand data; X8 Rent in 12 monthly payments; X9 pay-per-deal matching with DLD / Ejari; X10 history before 2026 (Dubai Pulse key). X11 **Upgrade plan** for owner-occupiers who trade up: what I can afford next (equity after loan and ~2% agent fee + 80% mortgage), a target home and the monthly "gap to my next home" from DLD deals, sell-and-buy vs let-and-buy, three leads (seller, buyer, mortgage). Not built: lettings outnumber resales ~10:1 in JVC, a move comes every 7-10 years vs a lease every year, and target homes sit outside the JVC snapshot (needs community-wide DLD data; see ONE-PAGER).

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

## 14. v7: return and lead loop, separate news
Review after v6: the owner side has content worth coming back for and a working lead, but (1) nothing brings the user back: no channel is chosen, so the digest is a screen, not a monthly touch; (2) the renter and the buyer leave without becoming a lead; (3) the handoff to the agent is a black box; (4) on My Home, news and numbers are mixed, so the numbers are hard to read. Principle: **each of the three users gets a reason to come back and one action that becomes a lead with a visible recipient.** The user-facing pitch on `/` stays (it sells the product to the user; the brief rules out a pitch to the reviewers, which we do not have).

**Return**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| V11 | **Subscribe in the "Get this every month" sheet**: channel (WhatsApp / email / in-app only), frequency (monthly / only big changes), "Next update: 1 Dec 2026" | Save needs a channel; the choice shows on My Home and can be changed there (closes O7); `digest_subscribed` | P0 |
| V12 | **Digest as a WhatsApp message preview**: 3 lines + link to My Home, next to the screen preview | Same numbers as the digest; tested | P0 |
| V13 | **Renter: "Remind me before renewal"** (90 and 30 days) and "Watch rents in my building" (monthly) | Lease end saved on the device; `renter_reminder_set`; mocked delivery | P0 |

**Leads and handoff**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| V14 | **Renter match**: owner-confirmed units free within +-30 days of the renter's lease end go first, tagged "Free when your lease ends" | Pure function, tested at the window bounds | P0 |
| V15 | **Owner-confirmed card is clickable** -> "Request a viewing" sheet (channel, move-in date, consent) -> lead to the owner's agent | `renter_lead_submitted`; confirmation screen | P0 |
| V16 | **"Who gets your request"** in the owner lead sheet: top agent by deals in this building (illustrative: name, SuperAgent, response time); after sending, status in "My requests": Sent -> Accepted (2 h) -> Viewing | Labelled "Illustrative"; `lead_status_viewed` | P0 |
| V17 | **Buyer next step** under the bank gap: "Get mortgage pre-approval" (PF mortgages lead) and "Ask an agent about this unit" | `mortgage_lead_submitted`, `buyer_lead_submitted`; mocked | P1 |

**Fixes and layout**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| F1 | **Next-step rule order**: lease already ended -> "Re-let now" wins over "consider a discount at renewal" | Tested: ended lease + rent above market -> re-let | P0 |
| F3 | **Building select**: the pilot building + one disabled line "Other JVC buildings: coming soon" instead of 90 options; search still lists them as unavailable | Select has at most 2 options; tested | P1 |
| N1 | **News is its own block, apart from the numbers.** The Update tab keeps the numbers in one block (value, rent, deals, demand, capital, yield, next step); building and area news sits below it in a separate block with its own heading ("Building and area news"), its own look (light tint, news icon) and a divider, never between number cards | No news item renders inside the numbers block; tested by block order |  P0 |
| N2 | **Two kinds of news, never mixed**: "Market moves" (from DLD / Ejari: top deal, new 2026 high, deal count, new leases) stay with the numbers, as numbers; "Building and area news" (project and editorial items: planned tower, school, road works, service charge budget) live only in the news block. Each item: date, source, impact tag on price (up / down / neutral, icon + word, not color alone); illustrative items labelled "Illustrative example, not a real event" | News tab has the same two sections with headings; tested that every item has date, source, impact and the right label | P0 |

- Not real (README): agents and their status, reminders and message delivery, mortgage and buyer leads, editorial news.
- Cut order if short of time: F1 -> V11, V12 -> N1, N2 -> V14, V15 -> V13 -> V16 -> V17, F3. Never cut V11 (return), V15 (renter -> owner link) and N1 (readable numbers).


## 15. v8: review fixes (first screen, consistent numbers, renter reach, PropWorth naming)
Review after v7. Build after v7 is done; do not mix with the v7 work in progress. Items 5 and 6 change calculation logic, so their tests are updated on purpose (say so in the commit).

**Brief compliance**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| W1 | **"I rent" on the first screen**: a second button next to "Check my home's value"; the "Not an owner?" block stays at the bottom (`app/page.tsx`) | Renter entry visible without scrolling at 375 x 812; tested | P0 |
| W2 | **No reviewer copy in the UI**: remove "Why it works" lines from `/entry-points` (screen sketches stay); move them to README "Where My Home would appear" | No "Why it works" text in the app; README has the list | P0 |

**Numbers that must not contradict each other**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| W5 | **Outlook on the same window as momentum**: JVC trend = May-Jul vs Aug-Oct (rolling 3-month medians), annualised, then the v3 range rules (+-5 pp, extra -5 pp supply risk, clamp -20% / +15%). Today's Jan-Mar base sits on a high January and pins the outlook at the lower clamp while the readings say "Good" (`lib/market.ts`, `outlook`) | Outlook and momentum readings use the same months; the range is not pinned to a clamp on the snapshot; tests updated (logic change) | P0 |
| W6 | **No month-on-month value change** in the digest (monthly noise, already ruled out above): show the change over 3 months or drop the line (`lib/digest.ts`, capital) | Digest has no "vs last month" value line; tested | P0 |
| W7 | **Collapse same-day bulk deals**: resales on the same day, same price and same size count as one comp; in deal lists they show once with "same-day bulk deal (N units)" (`lib/market.ts`). Today three identical 29 Oct deals at AED 1,319,425 push the estimate to the top of its range | Estimate sits inside its range on the snapshot; dedupe tested on fixtures | P0 |

**Renter flow**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| W8 | **Open all JVC buildings to renters**: Ejari data covers JVC and the JVC fallback already works; the one-building pilot stays for owners only (`app/rent/page.tsx`). Owner-confirmed units and matching (V14, V15) stay on the pilot building; other buildings show "No owner-confirmed units here yet" | Any JVC building gives a Rent watch result (building or JVC level, labelled); tested | P0 |
| W9 | **Demo lease end 31 Mar 2027** (was 15 Feb 2027, so the 90-day notice date had already passed) (`lib/demo.ts`) | Demo shows a notice date in the future; tested | P0 |

**Small fixes**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| W10 | Buyer advice: "about AED 1.29M", not "about AED 1290K" (`lib/insights.ts`) | One money formatter everywhere; tested | P1 |
| W11 | Demo asking price AED 1,500,000 to match the ONE-PAGER buyer example (`lib/demo.ts`) | App and ONE-PAGER show the same buyer numbers | P1 |
| W12 | Sizes in deal lists rounded: "78 m²", not "77.89 m²" | Tested in the formatter | P1 |

**Naming and portfolio: PropWorth stays visible**
Added after the W1-W12 build. W13 and W14 are built (`lib/portfolio.ts`, `POST /api/portfolio`); W15 is not built yet.
PropWorth is the brand of the owner area and of the number; each unit inside it is a "My Home". The brief asks for a clear link to PropWorth, and today the word does not appear in the UI. An investor-landlord, our primary owner, often holds several units, so the owner area should sum them up.

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| W13 | **Names**: owner area = "PropWorth", each unit = "My Home"; every value number labelled "PropWorth estimate" (not "PF estimate"); first-screen CTA "Get your PropWorth estimate"; subscribe sheet "Get your PropWorth every month" | "PropWorth" shows on the valuation, the owner area and every value label; no "PF estimate" left; tested | P0 |
| W14 | **PropWorth summary** above the homes list: total value range, rent in per year, average gross yield, one "Needs attention" line (the most urgent next step across homes, same rules as the digest) | Correct sums for 1 and 2 homes on fixtures; with one home it shows that home; `portfolio_viewed` | P0 |
| W15 | **One monthly digest for all homes**: the summary first, then one line per home with its next step (WhatsApp preview too) | Numbers match each home's digest; tested | P1 |

Cut order: W1, W2 (brief) -> W13 (PropWorth link) -> W7, W5, W6 (numbers) -> W8, W9 -> W14 -> W10-W12, W15.

Build note (W9): the demo lease end is **28 Feb 2027**, not 31 Mar 2027. With 31 Mar no owner-confirmed unit falls in the +-30-day window (the latest frees up on 30 Jan 2027), so V14 "Free when your lease ends" would disappear from the demo. 28 Feb keeps the goal of W9 (90-day notice date 30 Nov 2026 is in the future) and one match (1BR, free from 30 Jan).

## 16. v9: monthly-update preview on the valuation
News and the monthly update live on My Home (N1), so on the valuation the user does not see them before deciding to subscribe. The valuation stays the PropWorth step "as today" (no full news block); one compact preview sits right above "Get this every month".

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| V18 | **"Every month you'll also get" card** above the CTA, 3 lines: (1) one market move from DLD / Ejari (the top deal of the digest month in the building, real), (2) one building and area news headline with its impact on price (icon + word), labelled "Illustrative", (3) the renewal reminder ("a reminder 90 days before your lease ends"). Each line keeps its source label | Card renders above the CTA; line 1 is real data from the same function as My Home's market moves; line 2 carries the Illustrative label; no full news block on the valuation; tested | P0 |

## 17. As built: changes not recorded above, and stale lines
Added after an audit of `done_log.md` and the code. Where this section and an earlier one disagree, this section wins.

**Built, missing from the spec**

| ID | Change (as built) | Where |
|---|---|---|
| T1 | Estimate range is at least +-4% around the estimate, so the estimate never sits on the edge of its range and the month's top deal falls inside it | `lib/market.ts` (`MIN_RANGE`) |
| T2 | Two yields, named: "on your rent" and "on today's new-lease rent" (plus JVC flats) | My Home, `lib/digest.ts` |
| T3 | Next-step rule: lease ends soon and the owner's rent is above new leases -> "plan the re-let at market rent" (adds to 4.4.5 and F1) | `lib/digest.ts` |
| T4 | Renter notice alert: 0-30 days left to the 90-day notice deadline -> urgent alert; deadline gone -> "already passed" | `lib/renter.ts` (`noticeUrgency`), `/rent` |
| T5 | RERA index proxy uses the **median** of all JVC contracts, not the average: Ejari has outliers (AED 50 to AED 9M a year) | `lib/rent.ts` |
| T6 | "Find my home" opens with the pilot building prefilled and a highlighted "Continue" card, other buildings below as "coming soon"; bedrooms default to 1BR on `/rent` and `/buy` | `/own`, `/rent`, `/buy` |
| T7 | Every submit is validated, including an empty form; after a successful check the page scrolls to the results | all forms |
| T8 | Design pass at 375 px: line icons, compact deal rows and news items, one primary button per screen | `app/` |
| T9 | `/privacy` "How we use data", linked from consent; "Remove this home" deletes the unit, status, plans and requests (O9 partly built) | `app/privacy`, `home-panel.tsx` |
| T10 | Entry points beyond the site, static mockups: monthly push / WhatsApp / email, "Did you buy?" on a quiet saved search, Scout answering with My Home, My Home app tab | `docs/mockups/`, README |

**Data findings that shaped the numbers**
- JVC resale AED/m² fell ~9% from Jan-Mar to Aug-Oct 2026 (same-building check agrees). After W5 the outlook is about -8% to +7%.

**Stale lines (superseded)**
- Header: `ONE-PAGER.md` is written; `PRODUCT-FEATURES.md` also exists.
- 3 "buildings with >= 10 resales; others JVC-level": owners -> V2 (one pilot building); renters -> W8 (all JVC).
- 4.2 range -> plus T1. 4.3 outlook window -> W5. 4.4.4 value change -> W6 (3 months). 4.8 "average" -> T5 (median).
- V10g renter lease end -> 2027-02-28 (W9 build note). V10h asking price -> AED 1,500,000 (W11).
- 7 LLM wording: skipped; everything is deterministic.

**Not built (as of v1 hand-in):** R6 break / move / negotiate, O4 "I think it's worth", C4 "Something wrong?", C5 mock sign-in, W15 one digest for all homes, LLM wording. O5 is a list on the first screen only. O7 (channel and frequency on My Home) and R5 ("Request a viewing") are built; README corrected.

Live: https://test-propertyfinder.vercel.app

## 18. v11: PropWorth as a portfolio (all homes, add a home, other property types)
Review of O5 / W14 as built: the summary works, but an investor with several units cannot easily **find** it, **compare** homes or **add** one that is not in the pilot building.

**What is hard today**
1. The portfolio (W14 card) lives only on the first screen, below the hero, and appears only after the first save. From My Home there is no way to "all my homes" except the Home icon.
2. The homes list shows unit and size only: no value, rent, status or next step, so comparing means opening each home.
3. "+ Add a home" is a small grey link that starts the first-time valuation flow with no portfolio context and no confirmation that the home was added.
4. Only units in Luma Park Views can be added. A villa, a flat in another building or another emirate cannot be tracked, so the total is incomplete and the portfolio feels like a demo.

**Changes**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| P1 | **`/propworth` page = the portfolio**: W14 summary on top (total value range, rent in, gross yield, "Needs attention"), then one card per home: name, type, value range, status (let / live / for sale), rent and lease end if let, yield, next step chip; sorted by urgency (same rules as `urgency`). Each card opens that home's My Home | Page renders 1 and 3 homes from fixtures; order follows urgency; `portfolio_opened` | P0 |
| P2 | **Always one tap away**: owner pages (valuation, My Home and its tabs) show a "PropWorth · N homes" pill in the top bar when N >= 1, linking to `/propworth`. On the first screen, when the user has homes, the hero CTA becomes "Open my PropWorth (N homes)" and the W14 card shows the summary plus "See all homes" | Pill visible on My Home with 1+ homes, hidden with 0; first-screen CTA switches; tested | P0 |
| P3 | **"Add a home" is a clear action**: a full-width secondary button at the end of `/propworth` and in its header. It opens a short chooser: (a) property type: Apartment / Villa or townhouse / Office or shop; (b) where: Luma Park Views (pilot) / another building or area | Chooser renders; each path leads to P4 or P5; `home_add_started` (type, where) | P0 |
| P4 | **Pilot path**: apartment in Luma Park Views -> the existing unit picker and valuation, with context "Adding to your PropWorth"; after "Save" the user returns to `/propworth` with a confirmation "Added. 2 homes, total AED x – y" | Return lands on `/propworth`; new home in the list and the totals | P0 |
| P5 | **Any other home: "Track with my own value"**: building or area (free text, plus emirate), type, bedrooms, size, owner's value (O4), optional rent, lease end, price paid, loan. Saved as a manual home labelled "Owner's value · PropWorth estimate coming soon"; it counts in the totals with its own value; joins the waitlist for its building or area. Same sanity rules (section 13); demo prefill (section 12): "Villa, JVC, 3BR, 250 m², AED 3,200,000" | Manual home saved, listed, labelled; totals include it and say "includes owner's values for N homes"; `manual_home_saved`, `waitlist_joined`; tested | P1 |
| P6 | **Totals with mixed sources**: value total = PropWorth estimates + owner's values (shown separately on tap); rent and yield only over let homes; "Needs attention" can come from manual homes too (lease end, renewal) | Sums correct on a 2-pilot + 1-manual fixture; labels say which part is owner's value | P1 |
| P7 | **Empty state** on `/propworth` with 0 homes: what PropWorth is in one line + "Get your first PropWorth estimate" | No dead end; tested | P0 |
| P8 | **Manage**: remove a home from `/propworth` (reuses O9 with confirmation); "Delete all my data" stays on My Home and `/privacy` | Removed home leaves the list and the totals | P1 |

| P9 | **Visible from the start**: the first screen says in "What you get" that all your homes live in one PropWorth (value, rent, what needs attention), and shows an empty PropWorth card ("0 homes, add your first") instead of hiding it until the first save | Card and benefit line render with 0 homes; tested | P0 |
| P10 | **Visible along the way**: the save sheet says "This home goes into your PropWorth: all your homes in one place"; right after saving, My Home shows a banner "Saved to your PropWorth · N homes · See all homes"; adding from `/propworth` returns there (P4) | Banner shows once after save; links to `/propworth`; tested | P0 |

| P11 | **Ask for more homes after the save, not before**: the subscribe sheet keeps one decision (no extra step before "Get this every month", the conversion the 1% test measures) and only notes "Own more homes? You can add them next"; the post-save banner on My Home offers "+ Add another home", which opens the add chooser (P3) | No new step before saving; banner has both "See all homes" and "+ Add another home"; tested | P0 |

Build note (v11 build): P5 manual homes and P8 remove are not in this build; the chooser's non-pilot paths show "coming soon" with "Notify me" (existing waitlist) until P5 is built.

- Unchanged: W15 one monthly digest for all homes stays P1; real estimates for villas, other buildings and other emirates stay P2 (X6).
- Events: `portfolio_opened`, `home_add_started`, `manual_home_saved` (with the existing `waitlist_joined`).
- Not real (README): manual homes use the owner's own value, not a PropWorth estimate.
- Cut order: P1, P2, P7 -> P3, P4 -> P5, P6 -> P8.

## 19. v12: trust and event alerts (after an external product review)
An external Product Lead review rated vision 9/10 but retention 6/10 and flagged trust. Taken: trust in the estimate (method + independence), retention by events rather than the calendar, and a long-term vision line. Not taken: dropping the renter flow (the brief requires it from the first screen), a separate app (My Home lives inside PF and continues PropWorth), "top N% in your building" (needs floor / view data we do not have), narrowing the range (it is the honest spread of real deals).

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| A1 | **"How we estimate" sheet** from the valuation and from My Home: comparables (same building, same bedrooms, size +-15%, last 3 full months), fallbacks and confidence, same-day bulk deals counted once, range = middle half of deals (at least +-4%); **what it does not know**: floor, view, condition, unit number (DLD open data has none). **Independence line**: "The estimate comes only from registered deals. Agents, listings and whether you sell do not change it." | Sheet opens from both screens; lists the real comps count and window; independence line present; `method_viewed`; tested | P0 |
| A2 | **Event alerts, the monthly update is the fallback** (`lib/alerts.ts`, pure, tested). Triggers from the data and the owner's details: (1) new resale in the building in the month (top deal), (2) new-lease median for the size band moved more than 5% vs the previous 3 months, (3) lease milestones: 90 days, 30 days, ended, (4) building and area news with a price impact (illustrative), (5) monthly update on the 1st. Each alert has a channel preview: push (title + 1 line), WhatsApp (2 lines + link), email (subject) and "Why you got this". | Triggers fire at their thresholds on fixtures; each alert has all three previews; illustrative ones labelled | P0 |
| A3 | **"Your alerts" on My Home (Update tab, after the plans card)**: the alerts this home would have received, newest first, shown as phone notifications in the chosen channel; frequency labels become "Monthly update + important events" / "Only important events" (O7) | Renders the triggered alerts for the demo home; the channel switch changes the preview; `alert_opened` | P0 |
| A4 | **Vision line** in `ONE-PAGER.md`: long term, PropWorth can be for homes what a market terminal is for financial assets (value, yield, risk and options of one asset in one place); this task builds its first owner habit | One sentence, no new claims or numbers | P1 |

- Not real (README): alert delivery (push, WhatsApp, email) is simulated; the alerts list shows what would have been sent.
- Existing mockup `docs/mockups/entry-1-monthly-push.png` stays the static lock-screen picture; A3 makes the same alerts clickable inside the prototype.

## 20. v13: Golden Visa threshold, listings in my building, my dates
Retention review: the strongest new reasons to open PF are (a) the AED 2M Golden Visa threshold, which turns the value into a personal goal, and (b) PF's own listings in my building, which change every week and no competitor or open source has. A "money calendar" mostly repeats what the digest already shows (lease end, renewal, capital), so only the missing dates are added, as optional fields.

**Facts used (check before quoting numbers; rules change):** a property worth AED 2M or more can qualify for the 10-year Golden Visa; several guides say the current DLD valuation counts, not only the price on the title deed, with an official valuation certificate if the deed is below 2M ([Property Finder](https://www.propertyfinder.ae/blog/golden-visa-properties/), [The National](https://www.thenationalnews.com/business/money/2024/01/24/golden-visa-dubai-property/)); several properties can be combined; mortgage terms are reported differently (older rule: AED 1M or 50% paid; 2026 reports: minimum down payment dropped, bank NOC needed: [Khaleej Times](https://www.khaleejtimes.com/business/uae-golden-visa-dubai-drops-minimum-down-payment-required-for-property-owners)). So the UI never says "you qualify": it says "may qualify" and links to DLD.

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| G1 | **Golden Visa line** in My Home (Capital block) and in the PropWorth summary: at or above AED 2M (estimate mid, or the sum of homes in the summary): "Worth AED 2M or more: you may qualify for a 10-year Golden Visa"; below: "AED X to the AED 2M Golden Visa threshold" shown only when the gap is under 25%; link to the DLD Golden Visa service; note "Check current rules with DLD; mortgage terms vary". Pure function `goldenVisa(value)` in `lib/finance.ts` | Thresholds tested at 1.49M / 1.5M / 1.99M / 2M; summary uses the sum of homes; demo 2BR (AED 1.84-1.97M) shows the gap; 1204 + 1707 together show "may qualify"; `golden_visa_viewed` | P0 |
| G2 | **Threshold crossing as an alert** (A2 trigger 6): the 3-month value change (W6) crosses AED 2M up or down -> "Your PropWorth crossed AED 2M" with the same caveat | Fires once per crossing on fixtures; never on month-on-month noise | P1 |
| L1 | **"Your building this week"** on My Home (numbers block, after Deals): PF listings in the building like mine: new listing, price cut, days on market, asking price vs my estimate ("listed at AED 1.40M, your estimate AED 1.22-1.29M"). In the prototype from synthetic listings (`dataset/listings.json`), labelled "Illustrative: PF listings in production"; in production PF's own listings data. Also an A2 trigger (7): new listing or price cut in my building | Block renders for the demo home, labelled illustrative; never mixed with DLD deals; trigger tested; `building_listings_viewed` | P1 |
| D1 | **"Your dates this month"** in the digest: tenant cheque dates, end of a fixed mortgage rate, service charge invoice; all optional fields in the "Get this every month" sheet and Status sheet; empty fields hide the line | Hidden when no dates; dates within 30 days listed; tested | P2 |

- ONE-PAGER: one line each for the Golden Visa threshold (owner-occupiers too) and PF listings in the building as the production retention hook; building-management messages (Mollak, developers) and a verified building chat are later, via partners (P2: X12 building management messages, X13 verified owners' chat).
- Events: `golden_visa_viewed`, `building_listings_viewed`.
- Not real (README): listings in the building are synthetic; Golden Visa rules are summarised from public guides, not legal advice.
- Cut order: G1 -> L1 -> G2 -> D1.


## 21. v14: design review at 375 px (priorities, length, controls, navigation)
Click-through of every screen at 375 px against the use-case priorities (section 1: investor-landlord first; funnel `valuation_viewed` -> `digest_subscribed` -> `intent_set` -> `lead_submitted`), `design.md` and the brief's "no pitch text or instructions inside the UI". The cross-tab event loop found in the same review is already fixed (homes hook listens to the homes key only).

**P0: the main flow and navigation**

| ID | Problem (as found) | Change | Acceptance |
|---|---|---|---|
| D1 | Valuation: "Get this every month" sits at ~2,100 of 2,370 px, below 4 readings, chart, outlook and preview. It is the conversion the 1% test measures | Sticky bottom CTA "Get this every month" on the valuation (hidden while the sheet is open). "What this means" shows the headline reading + one line per reading; full readings behind "See the analysis" (same content as the My Home Analysis tab). Chart stays, below the readings | CTA visible on first load at 375x812 without scrolling; page height on the demo unit at most ~2 screens before the preview card; tested |
| D2 | My Home "Update" is ~5,500 px (~7 screens). The month's deals and rents appear 4 times (Deals list, Market moves, WhatsApp preview, alerts); building news appears in Update and in News; "21 new leases for your size" sits next to "24 new leases signed" (all sizes); "Next step" and plans start on screen 4 | Update order: value header -> **Next step + "What are your plans?"** -> Rent -> Deals (top 3 + "Show all N") -> Capital and yield -> Demand -> "Your alerts" (latest 2 + "See all") -> Status and update settings. Removed from Update: Market moves and building news (they live in the News tab only), WhatsApp preview (moves into the update settings "Change" sheet). Market moves "new leases" line names its scope ("all sizes") or uses the owner's size band | Next step in the first screen after the header; Update tab at most ~3 screens for the demo home; no number repeated within the tab; tested |
| D3 | Back is a fixed link: My Home always goes to the valuation, even when opened from `/propworth` or "Needs attention"; `/buy` goes to `/` when opened from `/rent`; Back + browser back loop; every My Home tab adds a history entry | TopBar Back = `router.back()` when the previous page is in this app, else the fixed `href` (deep link fallback). My Home tabs switch with `replace` (no history entry per tab). `/buy` opened from `/rent` returns to the renter results | From `/propworth` -> My Home -> Back lands on `/propworth`; `/rent` results -> `/buy` -> Back lands on the results; tab switches do not grow history; tested |

**P1: control states and design guide**

| ID | Problem | Change | Acceptance |
|---|---|---|---|
| D4 | Advice lines "→ …" use the link colour `#3A307F` but are not clickable | Advice in `text-primary` with a small line icon, not link colour; only real links and buttons use indigo | No non-interactive element uses the link colour; tested on the readings component |
| D5 | Source labels are tinted pills next to "High confidence" / "Good" badges and read as chips or filters | Sources as plain 12 px meta text (`text-secondary`), no pill; badges stay pills | Source labels have no background or pill radius |
| D6 | Home cards on `/propworth` and the "Needs attention" row are links without a visible affordance | Chevron on every tappable card / row; pressed state | Every link card has a chevron |
| D7 | Renewal-risk note in Rent is a long bold paragraph in the error colour | Warning callout (`#FFF6EA` bg, warning icon), one sentence: "New tenants pay ~AED 15K less. Plan the re-let near AED 80K." Error red only for errors | Callout uses warning tokens; tested text |
| D8 | "At renewal the rent can go up by at most 0%" | 0% -> "No increase allowed at renewal"; other values unchanged | Wording at 0% tested |
| D9 | Top bar: Back and Home both go to `/` on `/own`, `/propworth`, `/rent`, `/buy`; owner pill "PropWorth · N" shows in the renter and buyer flows; aria-label "1 homes" | Hide Home when Back already leads to `/`; show the PropWorth pill on owner screens and the first screen only; correct singular / plural | Tested per route |

**P1: no pitch text or instructions in the UI (brief)**

| ID | Problem | Change | Acceptance |
|---|---|---|---|
| D10 | First screen is ~3 screens: "What you get" (5 points), sample update, "How it works", "Why save it?", "Not an owner?" (repeats "I rent"), link to `/entry-points` (a pitch page); two buttons lead to `/own`, two to `/rent` | First screen = hero + "Get your PropWorth estimate" + "I rent" + "Buying a resale? Check the price" + PropWorth card **only when homes exist**. Remove "What you get", sample update, "How it works", "Why save it?", "Not an owner?" and the `/entry-points` link from the UI (entry points stay in README and `docs/mockups/`). Update P9 (section 18): the empty PropWorth card and benefit line are dropped | First screen fits ~1.5 screens; one link per destination; no `/entry-points` link in the app; tested |
| D11 | Instruction copy: "Tap a unit to request a viewing", "Takes 20 seconds", "Optional details make the update more useful. You can change them later", "Own more homes? You can add them next" | Remove; affordance comes from the controls (chevrons, buttons). P11 keeps "+ Add another home" on the post-save banner only | Strings absent; tested |
| D12 | Save sheet: 4 meta paragraphs before the fields; "Save and get my update" below the fold (sheet ~1,000 px in a 747 px viewport) | Sticky save button at the bottom of the sheet; one meta line ("Delivery is simulated in this prototype") kept; consent stays next to the button | Save visible without scrolling at 375x812; tested |

**P2 (not in this pass)**: renter "Above market" and "You pay ~AED 10K more" say the same thing (merge); owner-confirmed units show other sizes to a 1BR renter (filter or label); "DLD rental index calculator" is plain text (make it a link).

- Supersedes: section 18 P9 (empty PropWorth card and benefit line on the first screen) and P10 / P11 copy on the save sheet; section 14 N2 placement of building news inside Update; section 16 stays (the preview card on the valuation remains, above the sticky CTA).
- Events unchanged; `analysis_opened` when "See the analysis" is tapped on the valuation.
- Cut order: D1 -> D2 -> D3 -> D10 -> D12 -> D4–D9 -> D11.

Build note (batch A: D1, D2, D3, D10; also D7 and part of D11 to reach the D2 length):
- D2: the Update tab shows alerts of the owner's own events only (lease, deals, rents, monthly); news-type alerts stay with the news in the News tab. Alert previews quote the message as it would be sent, so they may repeat a number from the blocks above; that is the one allowed repeat. The next step is the first line of the plans card; status, update settings (with the WhatsApp preview under "Change") and remove / delete are one Settings card. Trimmed further on review (overrides D2 detail): Deals shows its one-line summary with every row behind "Show all N" (was top 3); "Your alerts" shows the latest 1 with "See all" (was 2); the plans card drops the "Agents reach you only through PF" line (it stays in the lead sheet with the consent). Measured on the demo home at 375 x 812: see done log (was about 7 screens).
- D3: Back uses the browser history when the previous page is in this app (in-app page count in sessionStorage), else the fixed parent screen; no router needed. My Home tabs use `replace`.

## 22. v15: product hygiene: offer at the right moment, taken units, support
Audit of cases a real product would have and the prototype lost. Rule: build what a reviewer meets on the main click path and what closes a brief link; show the rest as a design mockup (`docs/mockups/`) and a line in README.

**Build**

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| H1 | **Refinance as a next step for owners with a loan.** Optional fields in the Status sheet: loan balance (exists), current rate, end of the fixed-rate period (shares the D1 field). Rule in `lib/digest.ts`: fixed period ends within 6 months, or current rate is at least 0.5 pp above the example market rate (4.5%, editable, labelled) -> next step "Your fixed rate ends in N months: you could save about AED X a month" (annuity on the balance, remaining term default 20 years). CTA "Compare mortgage offers" -> mortgage lead sheet (reuses V17), mocked. Order in next-step rules: a lease ending or an ended lease (F1, T3) wins; refinance comes next. Also an A2 trigger at 6 and 3 months before the end of the fixed rate | Savings and trigger bounds tested (6 months, +0.5 pp); no line without loan details; `refi_step_shown`, `mortgage_lead_submitted` (source: refi); rate labelled "Example rate" | P0 |
| H2 | **Taken units.** When the owner of an owner-confirmed unit sets "I let it", "Not now" or "For sale", the renter card turns into "Let agreed · date" (or "No longer for rent"), greyed, with no viewing button, and shows units free around the renter's lease end (V14) instead. A renter who already requested a viewing sees on `/rent`: "This unit is now let. 2 similar units are free around your lease end." Same rule for synthetic listings marked taken in the demo data | Pure function `listingState(unit, ownerStatus)` tested for each status; no viewing request possible on a taken unit; `taken_unit_viewed` | P0 |
| H3 | **"Something wrong?" (C4) and help.** Link on the valuation, My Home and Rent watch: reasons (wrong size or bedrooms, wrong building, not my unit, numbers look off, other) + free text; stored on the device; confirmation "Thanks, we'll check it". Footer link "Help" to a short static page: how the estimate works (A1), how to delete data (`/privacy`), contact support (mocked email) | Report saved and confirmed; reasons tested; `data_issue_reported` (reason, page); report count feeds "What the data makes possible" in ONE-PAGER (owner corrections improve the estimate) | P1 |

Cut order: H3 -> H1 -> H2. Never cut H2: it is the visible owner -> renter loop.

Build note (batch B: G1, H2, H1):
- G1 wording changed after checking the source: DLD's own service page (https://dubailand.gov.ae/en/eservices/request-for-golden-visa-investor/) states the **purchase value** must be AED 2M or more (mortgaged: a bank letter that 2M is paid). So "may qualify" is shown only when the price paid is AED 2M or more (portfolio: combined price paid, when every home has one); an estimate of 2M+ alone says "worth AED 2M or more today; DLD's service looks at the purchase value, so check whether today's value counts"; the gap line shows when the estimate is less than 25% below 2M (exactly 25% is not shown). Link to the DLD service above.
- H2: owner statuses of the owner-confirmed units are demo data (`DEMO_OWNER_STATUS`: one "let agreed", one "no longer for rent"); viewing requests are stored on the device, and the "this unit is now let" notice appears when a requested unit becomes taken (tested; in the click-through the demo statuses do not change, so the notice is not reached by tapping).
- H1: mortgage details (loan, rate, fixed-rate end) in the Status sheet and the URL; rule order lease > refinance > renewal risk > offers; portfolio urgency: refinance 3, offers 4. Alerts at 6 and 3 months before the fixed rate ends. Demo values: 5.25%, fixed until 30 Apr 2027.
- Not in this batch: H3 ("Something wrong?" and Help), G2, L1, D1 dates, D11 remaining instruction strings ("Tap a unit to request a viewing").

**Design only (mockups, not built)**
- **M5 Sold -> search again**: status "Sold" archives the home in PropWorth with the sale price vs the last estimate, and offers the next step: "Looking for your next home?" with a search prefilled from the sale (budget, area). Closes the loop: the search does not end at the purchase, and a sale starts the next search. `docs/mockups/entry-5-sold.png`.
- **M6 Home services in My Home**: offers tied to the owner's dates and status: mortgage refinance (H1), home insurance at renewal, property management for landlords, Ejari renewal, movers and maintenance at a lease change. Partner offers with revenue share; one at a time, only when relevant. `docs/mockups/entry-6-services.png`.
- Scout answering with My Home: already T10 (`entry-3-scout.png`); no LLM in the prototype.

**README only (known gaps)**: two people claim the same unit (resolved by title deed verification, X1); real sign-in (C5 stays mocked); Arabic and RTL (X4); real partner offers and revenue share.

## 23. v16: reset the demo
Testers on one device inherit each other's saved homes (data lives in the browser). A time-based reset was rejected: it would break the product's promise that your home stays and brings you back. Instead:

| ID | Change | Acceptance | Priority |
|---|---|---|---|
| R1 | **"Reset demo" link** in the footer of every page and a clean link `/?reset=1`: deletes everything the prototype saved on this device (homes, plans, requests, alerts state, event log; same as "Delete all my data") and opens the first screen | After reset: 0 homes, no PropWorth pill, first-screen main button "Get your PropWorth estimate"; tested | P0 |

Not in this step: silent saves from My Home actions (plans, agent request, status) stay as built; an explicit save there is a later change.
