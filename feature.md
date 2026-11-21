# Features

Description of every feature developed in this project. Add an entry for each new feature.

<!-- Entry format:
## Feature name
- What it does
- Where it lives (main files)
- How it is tested
-->

## Synthetic listings dataset
- 150 toy Dubai listings (rent and sale, apartments and villas, 11 areas) for the prototype. Prices drawn around public area benchmarks; buildings, agents and agencies invented; approximate coordinates with nearest metro and distance. Marked `synthetic: true`; no photos (UI uses placeholders).
- Files: `dataset/generate_listings.py` (generator, fixed seed), `dataset/listings.json` (output). Regenerate: `python3 -m dataset.generate_listings`.
- Tests: `tests/test_listings.py` (determinism, required fields, price bands vs benchmarks, sizes, villa/off-plan rules, metro distance, JSON in sync).

## Task-day prep templates
- Fact sheet with sourced numbers for sizing, a measurement plan template (holdout design, sample-size lookup table) and a GTM / rollout template for the 5 markets.
- Open data catalogue: DLD / Dubai Pulse, RTA, KHDA, DSC, other PF markets, PF's own public reports, listing datasets, with access and license notes.
- Files: `prep/fact_sheet.md`, `prep/measurement_template.md`, `prep/gtm_template.md`, `prep/open_data.md`.
- Docs only, no code. The sample-size table uses the standard two-proportion formula (alpha 0.05, power 0.8).

## App skeleton and API health check
- Next.js app (App Router, TypeScript) for Vercel; landing page in Property Finder styles.
- `GET /api/health` reports whether the OpenAI key is set (never its value). `?live=1` checks the OpenAI key via a model-list call that uses no tokens.
- Files: `app/`, `lib/health.ts`, `app/api/health/route.ts`.
- Tests: `tests/app/health.test.ts` (Vitest, `npm test`).

## Real DLD data for JVC (1 Jan - 20 Nov 2026)
- Snapshot of public Dubai Land Department open data for Jumeirah Village Circle, 1 Jan - 20 Nov 2026 (the open-data endpoints only serve the current calendar year): sales transactions (community C-82, ready and off-plan) and Ejari rent contracts (land area 441, Al Barsha South Fourth = JVC). Rows slimmed to the fields the prototype needs; `synthetic: false`.
- Known gaps: in rent contracts the room count is almost always empty and the building is empty for ~27% of rows, so rents are compared by size and, where possible, by building.
- Files: `dataset/fetch_dld.py` (fetcher, re-run with `python3 -m dataset.fetch_dld`), `dataset/dld_jvc_sales.json`, `dataset/dld_jvc_rents.json`.
- Tests: `tests/test_fetch_dld.py` (date chunks, payloads, field mapping, pagination, sanity checks on the snapshot: every month of the period, counts, JVC price and rent bands).

## Calculations library
- Pure functions for the PropWorth "My Home" prototype, on the JVC DLD snapshot (no LLM): data loading and resale/rent filters (`lib/data.ts`, `lib/market.ts`, `lib/rent.ts`); comps with fallback chain, estimate with P25-P75 range and confidence, 12-month outlook clamped to -20% / +15% (`lib/market.ts`); monthly digest for October 2026 and next-step rules (`lib/digest.ts`); rent watch vs new leases, RERA index proxy (median of all contracts, robust to Ejari outliers) and allowed increase, gross yield (`lib/rent.ts`); capital, bank valuation gap, rent vs buy, deterministic mocked demand (`lib/finance.ts`); owner storage: homes, status history, intent, leads, delete (`lib/owner.ts`); URL form parsing (`lib/forms.ts`); events (`lib/events.ts`); shared types, stats, formatting.
- Spec: `docs/SPEC.md` sections 4 and 8.
- Tests: `tests/app/market.test.ts`, `rent_finance.test.ts`, `digest_owner.test.ts`, `forms_format.test.ts` (fixtures), `data.test.ts` (real snapshot: resale filter, hero building counts, October fully covered).

## PropWorth "My Home" app (P0 of `docs/SPEC.md`)
- Owner: building search with partial match and "can't find" fallback to a JVC-level estimate (`/own`), unit picker (unit number, bedrooms, size in m² or ft²), PropWorth valuation with range, confidence, deal list and 12-month outlook, "Get this every month" sheet (let / live, rent + lease end, price paid + loan, title deed -> "Verification pending", consent) (`/own/[building]/value`), My Home with the October 2026 digest preview (rent, deals, demand (illustrative), capital, one next step), yield, intent card (not now / rent out from / open to offers), lead sheet with payload summary and consent, status with dated history, "My requests", remove home / delete all data (`/own/[building]/home`).
- Renter (`/rent`): Rent watch vs new leases (building, else JVC), allowed increase by RERA bands with 90-day notice and RDC link, owner-confirmed sample units, rent vs buy with editable rate, link to `/buy`.
- Buyer (`/buy`): fair price vs DLD resales, bank valuation gap at 80% LTV, "I bought this" -> valuation prefilled with price paid.
- Common: source label on every number, empty / low-data states with a next action, inputs in the URL (Back and deep links keep them), 375 px mobile layout, `/privacy`. Events: `POST /api/events` (validated, in-memory + console) and `localStorage`.
- State is mocked in `localStorage`; nothing is sent to agents.
- Files: `app/`, `app/components/`, `lib/`, `next.config.ts` (ships the dataset with the server functions).
- Tests: `tests/app/smoke.test.tsx` (every route renders for the hero building with a next action; digest block order; error states; events API).

## v4 after the click-through review (`docs/SPEC.md` section 11)
- Inline field errors under each field (`lib/forms.ts`: `validateUnitForm`, `validateClaim`, per-field errors on `/rent`, `/buy`).
- One pilot building: `ACTIVE_BUILDINGS` in `lib/types.ts`; others "coming soon" in search and selects; the pilot is prefilled with a "Continue" card on `/own` and preselected on `/rent`, `/buy`, coming-soon screen on direct links, mocked "Notify me" waitlist.
- Pitch first screen (`app/page.tsx`) and site entry points (`app/entry-points/page.tsx`).
- "What this means" readings with tone and action: price level, momentum, liquidity, yield, letting wave, market; renter and buyer advice (`lib/insights.ts`, `app/components/insights.tsx`).
- Price chart building vs JVC with tooltip and table view (`app/components/price-chart.tsx`).
- My Home tabs: Update / Analysis / News / Owners; news from real data plus labelled illustrative items; illustrative owners' community with reactions (`lib/news.ts`, `app/components/feed.tsx`).
- Tests: `tests/app/insights_news.test.ts`, new cases in `forms_format.test.ts` and `smoke.test.tsx`.

## Demo prefill (`docs/SPEC.md` section 12)
- Every field of every form opens with a demo value and stays editable: unit picker, "Get this every month" sheet, plans card, agent request, status sheet, `/rent`, `/buy`. After a submit the form shows exactly what the user sent, so empty-field errors still work. Switching rent out / sell / offers loads the matching default price.
- Files: `lib/demo.ts` (values + `prefill` helper), forms in `app/components/`, `app/rent/page.tsx`, `app/buy/page.tsx`.
- Tests: `tests/app/demo_prefill.test.tsx`.

## Sanity checks (`docs/SPEC.md` section 13)
- Plausible ranges for every money, date and code field: rent, prices, loan vs price paid, lease end, start dates, increase %, mortgage rate, unit number, title deed. Messages under the field in every form; a bad mortgage rate falls back to the example rate without hiding results; out-of-range deep-link values are ignored.
- Files: `lib/sanity.ts` (limits and checks), used by `lib/forms.ts`, `lib/owner.ts` (`leadFieldErrors`, `validateIntent`, `parseUnitQuery`) and the form components.
- Tests: `tests/app/sanity.test.ts` (each rule at both bounds, forms, deep links, `/rent` messages).

## Return and lead loop, separate news (`docs/SPEC.md` section 14)
- V11 channel + frequency in "Get this every month", changeable on My Home; V12 WhatsApp preview of the digest; V13 renter reminders (90 / 30 days) and rent watch; V14 owner-confirmed units matched to the lease end (+-30 days); V15 viewing request from each unit; V16 "Who gets your request" (illustrative agent) and status Sent -> Accepted -> Viewing; V17 buyer mortgage pre-approval and "ask an agent"; F1 ended lease -> "re-let now" first; F3 building select = pilot + one "coming soon" line; N1/N2 numbers in one block with "Market moves", building and area news in a separate block and News tab sections.
- Files: `lib/renter.ts`, `lib/agents.ts`, `lib/digest.ts` (`digestMessage`, F1), `lib/owner.ts` (subscription, `leadStatus`), `lib/news.ts` (`marketMoves`, `areaNews`), `app/components/leads.tsx`, `app/components/feed.tsx`, `app/components/home-panel.tsx`, `app/own/[building]/home/page.tsx`.
- Tests: `tests/app/v7.test.tsx` (rule order, WhatsApp text, news blocks and labels, match window bounds, reminders, contact validation, lead status, buyer steps, events).

## Review fixes v8 (`docs/SPEC.md` section 15) and design review
- W1 "I rent" in the first-screen hero; W2 "why it works" moved from `/entry-points` to README; W5 outlook on May–Jul vs Aug–Oct (same as momentum and market readings); W6 value change over 3 months; W7 same-day bulk deals collapsed (`collapseBulkDeals`); W8 renters can pick any JVC building, owner-confirmed units only in the pilot; W9 demo lease end 28 Feb 2027 (see spec note); W10 one money formatter in advice; W11 demo asking AED 1.5M; W12 rounded sizes and bulk labels.
- Design review: thin line SVG icons (`app/icons.tsx`) instead of Unicode symbols; deal rows with price on the right and AED/m² below; news items with impact on its own line and lighter titles; shorter sample-update labels; one primary button on `/buy`; price per m² on its own line on the valuation.
- Tests: `tests/app/v8.test.tsx`; spec-driven updates in `market.test.ts`, `insights_news.test.ts`, `demo_prefill.test.tsx`, `smoke.test.tsx`.

## Monthly-update preview on the valuation (`docs/SPEC.md` section 16, V18)
- "Every month you'll also get" card right above "Get this every month": the real top deal of the month (same function as My Home's market moves), one building and area news item with its price impact (labelled illustrative), and the 90-day lease reminder. No full news block on the valuation.
- Files: `lib/news.ts` (`updatePreview`), `app/own/[building]/value/page.tsx`. Tests: `tests/app/v8.test.tsx` (V18).

## PropWorth naming and portfolio summary (`docs/SPEC.md` W13-W14)
- W13: PropWorth is named in the UI: first-screen CTA "Get your PropWorth estimate", valuation "PropWorth estimate today", every value labelled "PropWorth estimate", subscribe sheet "Get your PropWorth every month in My Home". Each saved unit is listed as "My Home".
- W14: PropWorth summary on the first screen above the saved homes: total value range, rent in per year and weighted gross yield (let homes only), and one "Needs attention" link to the most urgent home (ended lease > lease ending soon (nearest first) > renewal risk > open to offers). Homes stay on the device; the client sends them to `POST /api/portfolio`, which computes the summary from the DLD snapshot and stores nothing. Event `portfolio_viewed`.
- Files: `lib/portfolio.ts`, `app/api/portfolio/route.ts`, `app/components/client.tsx` (`MyHomes`).
- Tests: `tests/app/portfolio.test.tsx` (one home equals its digest, sums for two homes, rent and yield only for let homes, urgency order and ties, unknown building skipped, body validation, API, labels; no "PF estimate" left in sources).

## Product features overview (doc)
- Short list of the main product features for owners, renters and buyers, each with a one-line reason why it exists. Mirrored as the Drive doc "PF Challenge - Product Features".
- Files: `PRODUCT-FEATURES.md`. Docs only, no code.

## User walk-through fixes (U1-U4)
- U1: the estimate range is at least ±4% around the PropWorth estimate (`MIN_RANGE`), so a skewed P25-P75 never puts the estimate on the range edge and the month's top deal falls inside it.
- U2: two named yields: the valuation reading says it uses the median new-lease rent in the building; My Home shows the yield on the owner's rent plus "on today's new-lease rent", so the 6.2% and 7.4% no longer look like a contradiction.
- U3: renewal risk for owners whose rent is more than 10% above new leases: red warning in the Rent block (`renewalRiskNote`), next step "Lease ends soon and your rent is above new leases: plan the re-let at market rent", and a hint under the re-let rent ("New leases here: median ... You get ... now").
- U4: renters see an alert card on top of the results when 0-30 days are left before the 90-day notice deadline (`noticeUrgency`).
- Files: `lib/market.ts`, `lib/digest.ts`, `lib/insights.ts`, `lib/renter.ts`, `app/own/[building]/home/page.tsx`, `app/components/home-panel.tsx`, `app/rent/page.tsx`.
- Tests: `tests/app/v10.test.tsx`.

## Data and measurement doc
- `docs/DATA.md`: metric tree (one number, owner / renter / buyer funnels mapped to the prototype's events, valuation quality, revenue), guardrails, data from other PF teams, data handling and infrastructure. Linked from `ONE-PAGER.md`.
- Tests: `tests/app/data_doc.test.ts` (every event named in the doc exists in `lib/events.ts` and is sent by the app).
