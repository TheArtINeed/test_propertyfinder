# Competitors: Bayut, Dubizzle Property, Cian, Domclick, Avito, Dubai REST, Huspy, Zillow + short-term rentals

Researched 2026-11-21: live websites (home, search results, listing page) + public news. Summary in our own words.
Purpose: what competitors do better or differently, and ideas Property Finder could use.

## TL;DR
| | Property Finder | Bayut | Dubizzle Property | Cian (Russia) |
|---|---|---|---|---|
| Positioning | Leading MENA portal, data + SuperAgents | "Real homes, real data, real brokers" | General classifieds with a property vertical | "Cian helps you move in" (end-to-end) |
| AI | Scout (web beta, investor-heavy) | BayutGPT, AI conversational search (Aug 2026), app inside ChatGPT | Shares Bayut tech (TruEstimate) | Natural-language search in the main search box, CianGPT assistant |
| Listing trust | Verified, SuperAgent, licenses | **TruCheck** (agent physically visits, geotagged photos, expires after 30 days for rent), "Agent last visited on…" | Verified listings, verified users | "Only on Cian" listings, owner vs agent |
| Agent trust | SuperAgent (deals + rating) | **TruBroker** (Quality Lister, Responsive Broker), Claim Transactions | — | Agent ratings, "Cian Deal" |
| Valuation | Home valuation + 6-month forecast | **TruEstimate** (claims use in ~50% of ready-property deals in Dubai) | TruEstimate | Price estimate, "My Home" (owner hub) |
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
- **Cian Deal** (deal service, 2025): Cian handles the transaction itself (600+ deals in 2025).
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

## 6. Dubai REST (Dubai Land Department, government app)
- Official app of DLD; won a 7-star rating in the International Best Practice Competition 2026.
- Features: **title-deed verification**, ownership checks, **project status** (registered off-plan projects, completion), **licensed broker directory**, "my listings" portfolio tool, official **Rental Index, Sales Index, service-charge indicators**, Ejari and other government services.
- Not a marketplace (no confirmed public listings feed), but it is the **source of truth** that portals reference.
- **Threat / opportunity for PF**: users verify outside PF. PF can embed official checks in the listing ("title deed verified", "rent within DLD Rental Index") and become the place where verification happens.

## 7. Huspy (mortgage + real estate, UAE and Spain)
- Proptech that started as a **digital mortgage broker** and moved into agency services. ~$96M raised (Series B $59M in July 2025, Balderton). Broker portal connects brokers to 25+ banks; acquired Just Mortgages and Finance Lab. Claims (unverified) to process >25% of residential home financing in Dubai.
- Seen as the agent on Bayut listings ("Contact Huspy to arrange a viewing").
- **Threat for PF**: owns the money step of the buyer journey (where PF's Mortgage Finder plays) and builds agent supply on top of it.
- **Lesson**: financing is the strongest wedge into the transaction; affordability drives search.

## 8. Zillow (USA, global benchmark)
- Strategy: **"housing super app"**: search, agent collaboration, touring, financing and closing connected in one flow; **AI-native** platform.
- **AI Mode** (Mar 2026): conversational search; users share more needs than in filters. Beta, expanding during 2026.
- **Rentals** as a growth engine: ~30% YoY growth expected in 2026, target $1B revenue; rentals cover search, messaging, tours, applications, **lease signing and payments**.
- **Zillow Preview**: pre-market listings (60+ brokerages).
- Q2 2026 revenue $772M (+18% YoY), driven by rentals and mortgages.
- **Lesson for PF**: monetize the **rental transaction** (applications, lease, payments: PF has Rent in 12 as a start) and bring AI into the main search flow.

## 9. Short-term rentals (holiday homes): a gap for PF
### PF today
- Has a **"Short term rental"** toggle (app) and daily-price listings on web: only **~1,300 daily listings** vs **~168,000** long-term rentals in the UAE.
- Same flow as long-term: Call / WhatsApp the agent. **No dates, no availability calendar, no instant booking, no reviews, no total price**; many daily listings are 6+ months old.

### Market
- Dubai: **19.59M international overnight visitors in 2025** (record, +5%); hotel occupancy 80.7%, ADR AED 579.
- Holiday homes: ~19-34K active listings depending on the source (AirDNA vs First Class index); 2026 hit by the regional crisis (occupancy and ADR down in Q2, recovery in H2), **longer stays** growing (1-6 months: relocators, digital nomads).
- DET (tourism department) licenses holiday homes; owners can register up to 8 units before needing a trade license. Professional operators (e.g. Stella Stays, Frank Porter, GuestReady) manage much of the supply.

### Competitors in this segment
| Player | What they offer |
|---|---|
| **Airbnb, Booking.com, Vrbo** | Global demand, instant booking, reviews, payments; main channel for tourists |
| **Dubizzle** | Direct holiday-home booking from licensed operators (launched 2025-26) |
| **Avito (Russia)** | Online booking + host reviews of guests, benchmark for classifieds moving into bookings |
| **Operators' own sites** | Stella Stays, Frank Porter etc. |

### Why it matters / ideas for PF
- PF's audience is **not tourists** but people **moving to / within the UAE**: the fit is **mid-term stays (1-6 months)** for relocators who need a place while searching for a long-term home. Bridges short-term demand into PF's core rental and buy funnels.
- Ideas: dates + availability, monthly price for 1-6 month stays, verified operators (DET permit shown), request-to-book via operators' channel managers, reviews; cross-sell "find your long-term home" during the stay.
- Monetization: booking commission (new revenue line) vs agent leads today.

## 10. Where PF can win (ideas)
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
11. **Official checks inside PF** (Dubai REST): title deed / permit verified, rent vs DLD Rental Index.
12. **Mid-term stays for relocators** (short-term gap): dates, availability, monthly price, request-to-book, cross-sell into long-term search.
13. **Rental transaction** (Zillow): application, Ejari/lease, payments on top of Rent in 12.

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
- [Cian Deal (Gazeta)](https://www.gazeta.ru/business/news/2026/03/19/28088071.shtml)
- [Domclick tests an AI agent for home selection](https://finance.mail.ru/article/domklik-testiruet-ii-agenta-dlya-podbora-zhilya-69214998/)
- [Avito early access for renters](https://msk1.ru/text/realty/2025/08/29/76006143/)
- [Avito AI assistants](https://new-retail.ru/novosti/retail/avito_testiruet_ii_assistentov_dlya_pokupateley_i_professionalnykh_prodavtsov/)
- [Avito A/B platform Trisigma (Habr)](https://habr.com/ru/articles/854110)
- [Dubai REST 7-star rating (WAM)](https://www.wam.ae/en/article/c363d76-dubai-rest-achieves-seven-star-rating)
- [Dubai REST features (Gulf News)](https://gulfnews.com/living-in-uae/housing/investing-or-renting-a-property-in-dubai-heres-why-you-should-download-the-dubai-rest-app-1.1691161626231)
- [Huspy (CB Insights)](https://www.cbinsights.com/company/huspy)
- [Zillow AI Mode](https://www.zillow.com/news/zillow-debuts-ai-mode)
- [Zillow Q2 2026 earnings (HousingWire)](https://www.housingwire.com/articles/zillow-q2-2026-earnings/)
- [Zillow super app (Inman)](https://www.inman.com/2026/11/04/zillow-housing-super-app-where-its-headed-per-its-coo/)
- [Dubai tourism 2025 record (Dubai Media Office)](https://www.mediaoffice.ae/en/news/2026/february/09-02/dubais-tourism-industry-achieves-third-successive-record-breaking-year)
- [Dubai short-term rentals 2026 (Skift)](https://skift.com/2026/09/02/for-uae-short-term-rentals-occupancy-is-recovering-demand-hasnt-fully-caught-up/)
- [Dubai STR demand and longer stays (Khaleej Times)](https://www.khaleejtimes.com/business/property/dubai-short-term-rental-property-demand-2026)
- [Holiday home licensing (Engel & Völkers)](https://www.engelvoelkers.com/ae/en/resources/holiday-home-license-dubai)
