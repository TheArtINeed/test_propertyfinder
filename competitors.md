# Competitors: Bayut, Dubizzle Property, Cian, Domclick, Avito

Researched 2026-11-21: live websites (home, search results, listing page) + public news. Summary in our own words.
Purpose: what competitors do better or differently, and ideas Property Finder could use.

## TL;DR
| | Property Finder | Bayut | Dubizzle Property | Cian (Russia) |
|---|---|---|---|---|
| Positioning | Leading MENA portal, data + SuperAgents | "Real homes, real data, real brokers" | General classifieds with a property vertical | "Cian helps you move in" (end-to-end) |
| AI | Scout (web beta, investor-heavy) | BayutGPT, AI conversational search (Aug 2026), app inside ChatGPT | Shares Bayut tech (TruEstimate) | Natural-language search in the main search box, CianGPT assistant |
| Listing trust | Verified, SuperAgent, licenses | **TruCheck** (agent physically visits, geotagged photos, expires after 30 days for rent), "Agent last visited on…" | Verified listings, verified users | "Only on Cian" listings, owner vs agent |
| Agent trust | SuperAgent (deals + rating) | **TruBroker** (Quality Lister, Responsive Broker), Claim Transactions | — | Agent ratings, "Сделка от Циана" |
| Valuation | Home valuation + 6-month forecast | **TruEstimate** (claims use in ~50% of ready-property deals in Dubai) | TruEstimate | Price estimate, "Мой дом" (owner hub) |
| Transactions data | DLD transactions, DataGuru | Dubai Transactions, Sales & Rental History | — | Price history, market analytics |
| Beyond the lead | Mortgage Finder, Rent in 12 | Upfront costs, Portfolio | Chats, holiday-home bookings | **Deal service, mortgage, insurance, paid early access for renters** |

## 1. Bayut (Dubizzle Group)
### Design
- Font **Lato**; primary **green `#28B16D`** (CTA "Search", selected tabs), light green tint `#E9F7F0` for selected states, dark teal text links `#006169`, text `#222222`, secondary `#515151`.
- Rectangular, **8px radius** buttons and inputs (less pill-shaped than PF). Big lifestyle hero photo ("Real homes live here").
- Search block: tabs Properties / New Projects / Transactions / TruEstimate / Agents; Buy/Rent toggle; All / Ready / Off-Plan; location, type, beds & baths, price. Under it: **"Want to find out more about UAE real estate using AI? Try BayutGPT"**.
- Floating **BayutGPT (BETA)** button on every results page.

### Use cases and features
- **Search results**: quick toggles "TruBroker listings first", "TruCheck listings first", "Properties with floor plans", Furnished / Unfurnished, **Save Search**, List / Map, popular buildings with counts.
- **TruBroker Stories**: short video stories by top agents per area (Instagram-like).
- **Listing card**: price, beds/baths/area, title, address, **"Agent last visited this property on <date>"** (freshness/availability signal), Email + Call.
- **Listing page**: **Request video**, Upfront Costs (NEW), Overview / **Trends & Indices**, TruCheck date, "Validated Information", Building information, Similar property transactions, Regulatory information, agent badges (Quality Lister, Responsive Broker).
- **TruEstimate** (AI valuation on DLD data), **Portfolio** (track your properties, NEW), **Dubai Transactions**, Sales & Rental History.
- **Sell My Property** -> connect with a trusted agent.
- New projects: launch price, handover, **Register Interest** (developer lead).
- Content: area comparisons ("Dubai Marina vs JLT: where should you live?"), budget guides ("investing with AED 1M").
- AI: BayutGPT (345K+ unique interactions reported), AI conversational search (Aug 2026), **Bayut app inside ChatGPT** (distribution through ChatGPT).

### Probable advantages over PF
1. **Availability proof**: TruCheck requires a physical visit + geotagged photos, and cards show when the agent last visited. Strong against fake listings, the #1 renter pain.
2. **AI distribution**: in ChatGPT, on every results page, under the main search. PF's Scout is a separate beta page and not in the app.
3. **Brand of trust products** ("Tru-" family) easy to remember and market.
4. **Video**: agent stories and "request video".
5. Valuation adoption claim (TruEstimate in half of ready-property deals).

## 2. Dubizzle Property (Dubizzle Group)
### Design
- Font **Proxima Nova**; primary **red `#E00000`** ("Place Your Ad"), blue `#0F5DC4` for selected chips and links, text `#2B2D2E`, light grey bg `#F6F7F8`, 6-8px radius.
- Classifieds header: Motors / Property / Jobs / Classifieds / Furniture… Top bar: Notifications, My Searches, Favorites, **Chats**, My Ads, **Bookings**, "Place Your Ad".
- Banner asking users to **get verified** ("building a safer community").

### Use cases and features
- Search: purpose, location, type, price, beds, filters; communities with counts (JVC 15K, Business Bay 8K…); All / Furnished / Unfurnished; **"Show Verified First"** toggle; Save Search.
- Card: Verified badge, photo carousel, price yearly, specs, title, address, **Call + WhatsApp**.
- Off-plan cards in feed: launch price, **down payment %**, developer.
- **TruEstimate** promo inside results ("What's your property worth today?").
- **In-platform chat**, **verified users**, **holiday-home direct booking**.
- Owners can **post their own ads** (classifieds DNA: more owner/direct listings).
- Same group as Bayut: shared data (Property Monitor acquisition), TruEstimate, verification.

### Probable advantages over PF
1. **Huge horizontal traffic** (cars, jobs, furniture): cheap cross-sell to people moving (furniture, cars).
2. **Owner-direct listings** and in-app chat: renters can avoid agent fees.
3. **Bookings** (holiday homes): first transaction, not just a lead.
4. User verification on both sides.

## 3. Cian (cian.ru, Russia's #1 property classifieds)
### Design
- Font **Lato**; primary **blue `#0068FF`-like** (`#2B87DB` links), dark text `#0D162E`, grey `#697797`, light bg `#F3F5FA`, rounded cards.
- Hero: "Cian helps you move in" + **one big natural-language search box** ("buy a flat with a big kitchen near the metro") + quick chips (buy flat, rent long-term, rent daily, buy house, buy land).
- Header: **Smart assistant**, compare, chats, favorites, notifications, "+ Post for 0 ₽". Menu: Rent, Sale, New builds, Houses & land, Commercial, **Mortgage, My home, Deal**, Services.

### Use cases and features
- **Natural-language search -> editable filters**: we typed "rent a 2-room flat near metro up to 70K, dog allowed" and got a normal results page with chips *Rent · Flat · 2-room · up to 70K · Pets allowed* (+ metro walking time in the URL). The user sees and edits what was understood.
- **"Early access" (paid for renters)**: the first hours of a fresh listing's contacts are paid, then free. Direct monetization of seekers in a hot rental market.
- **CianGPT / smart assistant**: search by text, answers support questions; plans: compare mortgage vs rent, advice on a specific flat.
- **New-build comparison**: "press plus, we'll build a table with conclusions" (AI-written comparison of residential complexes).
- Metro walking time on every card; "Might suit you" personalized feed.
- **Сделка от Циана** (deal service, 2025): Cian handles the transaction itself (600+ deals in 2025).
- **Mortgage** marketplace, **My home** (owner hub: valuation, selling), developer promos with discounts.
- Business: revenue 15.2B RUB in 2025 (+16.7%), profit 2.9B RUB; strong in Moscow / St Petersburg.

### Probable advantages / ideas
1. **AI inside the main search box**, not a separate assistant: zero learning curve, and output is transparent filters.
2. **Seeker monetization** (early access) proves renters will pay for speed in a tight market.
3. **Going down the funnel**: deal, mortgage, insurance: revenue per transaction, not only per lead.
4. **AI comparison tables** for new projects.

## 4. Domclick (domclick.ru, Sber)
Bank-owned ecosystem: search + mortgage + deal + home services. Strongest "end-to-end" example.

### Design
- Font **SB Sans** (Sber brand), primary **green `#009E36`** ("Log in", CTAs), text `#262626`, grey `#738295`, link blue `#1175DA`, light bg `#F0F1F4`.
- Calm, airy UI: **pill category chips** (bg `#E7EEF3`, radius 360px), **cards 12-20px radius**, soft pastel tiles with 3D illustrations.
- Home is a **personal dashboard "My property"** with segment tabs: For you / Mortgage / Buy / Build / Rent out / Sell / Rent. Tiles: mortgage potential, mortgage calculator, my mortgage & deals, loan against property, deal with own funds.
- **Market price widget** on home: price per m² for new builds and resale with monthly change (+10,755 ₽ / -1,915 ₽).
- Search history, save search, map; floating "Ask an expert" button.

### Use cases and features
- **Listing card**: price + **price per m²** + price trend arrow; **"Flat verified"** badge; **"Mortgage discount up to X%"**; **"Approved for mortgage"**; metro + walking minutes; Call / Message; agency or private seller label.
- **Mortgage potential via Sber ID**: one tap shows how much the user can borrow, then a **personal feed of listings within that potential**. Affordability first, then search.
- **"New flat without selling the old one"** (bridge / trade-in style product).
- **Deal online**: contract prep, lawyer consultations, e-registration, safe settlement in 1 visit; **escrow** for house construction with bank-checked stages.
- **Home services**: cleaning, handyman, design project (with Kandinsky AI), repair, moving.
- **ML valuation** used in ~90% of Sber mortgage deals (company claim); testing an **AI agent for home selection** instead of classic recommendations (June 2026).
- Rent: "mortgage discount for renting out your flat" (cross-sell owners).

### Probable advantages / ideas for PF
1. **Affordability-first search**: show listings the user can actually finance (PF has Mortgage Finder: connect pre-approval to search results and cards).
2. **Badges that answer decision questions on the card**: verified, mortgage-approved, price per m², trend.
3. **Dashboard home** for returning users (my searches, my mortgage, my property) instead of a generic hero.
4. Monetize **after the lead**: deal services, home services, moving.

## 5. Avito Real Estate (avito.ru)
Could not inspect live: the site blocked the automated browser with a bot check. Notes from public sources.

### Use cases and features
- Largest Russian classifieds; real estate is a big vertical (owners + agents + developers).
- **Paid early access for renters** (Aug 2025, all Russia): first **4 hours** after publication, contacts of owner listings are available only for a fee; free for owners. Same idea as Cian's.
- Short-term rentals: **online booking**, host reviews of guests.
- **Number protection** for private sellers (masked phone).
- AI assistants for buyers and pro sellers in staged tests; ~1B RUB planned for assistants in 2026 (platform-wide).
- Developer and agent tools, shared profile access for teams.

### Product practices worth copying
- **A/B test is a mandatory step**: only positive changes are rolled out; in-house experiment platform (Trisigma) automates tests. Matches PF's "holdouts, not before/after".
- **UX research embedded in product teams** (80+ researchers in 2024), Double Diamond for discovery.
- Mature **design system treated as a product**.

## 6. Where PF can win (ideas)
1. **AI in the main search bar (web + app)**: natural language -> visible, editable filter chips (Cian pattern) + "ask Scout" for deeper questions. Measure: search-to-lead conversion, holdout by user.
2. **Availability / freshness signal**: "Confirmed available X days ago" from agent check-ins or tenant reports; rank fresher listings higher. PF has "Verified", Bayut shows visit dates.
3. **Post-contact follow-up**: after Call/WhatsApp ask "Did the agent reply? Is it still available?" -> feeds agent ranking (SuperAgent) and listing quality. Neither competitor closes this loop visibly.
4. **Scout in the app and in ChatGPT** (distribution parity with Bayut).
5. **Total cost & payment**: Rent in 12 + upfront costs + rent-vs-buy in one decision view; PF already owns these pieces.
6. **Comparison** of 2-3 listings or projects with an AI summary (Cian pattern).
7. **Qualified lead handoff** to agents (budget, move-in date, must-haves) = more value for paying agencies.
8. **Seeker premium** (Cian and Avito early access) as a test: alerts first / priority viewing, careful with marketplace balance.
9. **Affordability-first search** (Domclick): Mortgage Finder pre-approval -> "homes you can afford" feed and "mortgage-ready" badge on cards.
10. **Decision badges on cards** (Domclick): price per sqft vs area average, price trend, verified, mortgage-ready.

## Sources
- [Bayut AI search, BayutGPT, ChatGPT app (The National)](https://www.thenationalnews.com/advertorial/2026/09/28/bayut-expands-conversational-property-discovery-with-new-ai-search/)
- [Bayut AI search launch (Gulf Business)](https://gulfbusiness.com/en/2026/artificial-intelligence/bayut-launches-ai-powered-property-search-in-uae/)
- [TruEstimate adoption (Entrepreneur ME)](https://mena.entrepreneur.com/news-and-trends/50-of-dubais-property-buyers-currently-use-bayuts/493729)
- [Bayut Sales & Rental History](https://mena.entrepreneur.com/business-news/bayut-strengthens-market-intelligence-offering-with-new-sales-and-rental-history-features)
- [Bayut Claim Transactions](https://www.onlinemarketplaces.com/articles/bayuts-claim-transactions-crosses-55000-deals-in-agent-trust-push/)
- [Dubizzle verified properties](https://www.dubizzle.com/blog/property/dubizzle-verified-properties/)
- [Dubizzle holiday home bookings](https://www.zawya.com/en/press-release/companies-news/dubizzle-launches-direct-holiday-home-bookingsbringing-seamless-reservations-to-millions-on-its-platform-1039347)
- [CianGPT (Kod)](https://kod.ru/tsiangpt-announce)
- [Cian 2025 results (AKM)](https://www.akm.ru/news/pribyl_tsian_za_2025_god_uvelichilas_na_16_2/)
- [Сделка от Циана (Gazeta)](https://www.gazeta.ru/business/news/2026/03/19/28088071.shtml)
- [Domclick tests an AI agent for home selection](https://finance.mail.ru/article/domklik-testiruet-ii-agenta-dlya-podbora-zhilya-69214998/)
- [Avito early access for renters](https://msk1.ru/text/realty/2025/08/29/76006143/)
- [Avito AI assistants](https://new-retail.ru/novosti/retail/avito_testiruet_ii_assistentov_dlya_pokupateley_i_professionalnykh_prodavtsov/)
- [Avito A/B platform Trisigma (Habr)](https://habr.com/ru/articles/854110)
