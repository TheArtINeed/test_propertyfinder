# Property Finder: product context

Source: propertyfinder.ae (browsed 2026-11-21) + public news. Summary in our own words.

## What it is
- Leading real estate portal in MENA, founded 2007, HQ Dubai.
- Markets: UAE (main), Qatar, Bahrain, Egypt, Saudi Arabia (sites: .ae, .qa, .bh, .eg, .sa). Stake in Zingat (Turkey).
- Web + iOS/Android apps. Languages: English, Arabic.
- Marketplace: consumers search for free; agencies, agents and developers pay.

## User types
| User | Goal | Pays? |
|---|---|---|
| Renter (tenant) | Find a rental, compare prices, contact agent | No |
| Buyer (end user) | Find a ready home, check value, get a mortgage | No |
| Investor | Find off-plan / yield deals, market data | No |
| Owner / landlord | Sell or rent out a property via an agent | No (lead for agents) |
| Agent / broker | Get leads from listings | Via agency |
| Agency | Publish listings, manage agents, buy visibility | **Yes**, main revenue |
| Developer | Promote new (off-plan) projects | **Yes** |
| Banks / mortgage | Mortgage leads | Partner revenue |

## Main features (consumer)
### Search
- Tabs: Rent, Buy, Sell, New projects, Transactions, Agents.
- Location search (city, community, building), multi-select.
- Filters: property type, beds & baths, price, amenities, residential/commercial, furnishing, completion status, rent frequency, keywords.
- "Rent in 12": pay rent in 12 monthly payments instead of a few cheques (labelled New); cards show the monthly amount.
- Community quick links with listing counts; community category tags (Family friendly, Pet-friendly, Luxury, Budget, Investment, etc.) with ratings and reviews.
- Map view, sorting, **saved search / "Create alert"**.
- Commercial, hotel apartments, villas, short pages for SEO ("2 bedroom apartments for rent in Dubai Marina").

### Short-term rentals (weak spot)
- "Short term rental" toggle in the app; daily-price listings on web (~1,300 vs ~168K long-term rentals in the UAE).
- No dates, availability calendar, booking, reviews or total price; contact via Call/WhatsApp like long-term. Many listings are old. See `competitors.md` section 9.

### Listing card
- Photo carousel, Save (heart), badges: **Verified** (checked listing), **Spotlight** / **Premium** / Standard (paid visibility tiers).
- Price (yearly for rent), title, beds/baths/area/type, address, agent + agency logo, **SuperAgent** label.
- Contact: Call, WhatsApp (and Email on detail page).
- Off-plan project cards injected in results ("explore this off-plan project", launch price, payment plan e.g. 20/60/20).

### Listing detail page
- Price + "Estimated upfront costs", "Compare rent vs buy" calculator, map.
- Property details: type, beds, baths, **number of cheques**, area, furnishing, available from, upgraded.
- Description, amenities, location.
- Building/community block: listings count, price range, reviews of the building.
- **Transactions for similar properties** (sold and rented history from Dubai Land Department data, "Powered by DataGuru").
- **Prices & trends**: this listing vs area average price and size.
- Project info (developer, delivery date).
- Agent card: languages, agent and agency listings, SuperAgents and verified agents count.
- Regulatory info: reference, broker license, agent license, permit; "Report this listing".

### Data & tools
- **Transactions**: DLD transaction data browser (sold / rented, new vs renewed rentals, volume trend).
- **Home valuation / "Your property's future"**: estimated value now + 6-month forecast, track up to 10 properties.
- Market insights, Insights Hub reports ("Market Watch"), blog, area guides.
- **Mortgage**: pre-approval request (min property value, income thresholds), callback form; mortgage calculator.
- **New projects**: off-plan catalog by emirate, developers list (Emaar, DAMAC, Aldar, Sobha, Nakheel...), delivery dates, payment plans.
- **Find agents / agencies** directory with ratings.
- **Sell your property**: owner enters details, picks SuperAgents, gets contacted.
- **Scout** (AI assistant, beta): conversational search + market data. See `scout_pf.md`.
- App extras: price-change alerts, save and track properties, notifications.

## Mobile app (iOS, screenshots 2026-11-21)

### Structure (bottom tabs)
| Tab | What's inside |
|---|---|
| **Properties** | Search (area/community), sort, **alerts bell**, chips (Bedrooms, Residential, All filters), results feed with developer ads, Map |
| **Activity** | Properties: **Saved / Viewed / Contacted**; Searches (saved searches); **Collections** |
| **Transactions** | DLD data: filters (period, Rented/Sold, type), total count (e.g. 641K rental transactions, excluding bulk deals), KPI cards (avg and median new rent with YoY delta and sparkline), list of deals, Map |
| **Account** | Sign up, **country switcher** (UAE, KSA, Egypt, Qatar, Bahrain), Find an agent, Mortgage Finder, Rent in 12, Sell or rent out, Support and feedback, Settings |

- **Scout is not visible** in the app navigation (web only, beta).
- Settings: language, units (metric/imperial), notifications, appearance (dark mode), **search bar position top/bottom**.

### Flows seen
- **Search**: filters sheet with Rent / Buy / New projects, **Short term rental** and **Rent in 12** toggles, type tiles with live counts, rows: bedrooms, bathrooms, price, size, amenities, furnishing, listed date, floor plan & virtual tours, keywords, agency. CTA shows result count.
- **Map**: clusters and price pins, draw-your-area tool, layers.
- **Listing detail**: photos, tier badge (Premium), price, **Upfront costs**, **Rent vs buy**, View on map, description, amenities, About the building / About the area, agent stats (response time), agency stats (listings, SuperAgents, verified agents), regulatory info (reference, permit: Madhmoun in Abu Dhabi / Trakheesi in Dubai, broker and agent licenses), **Report this property**.
- **Contact**: sticky agent bar with **"Responds within 5 minutes"**; Call opens "You are calling" sheet (agent languages + listing reference, so the agent knows which listing), WhatsApp opens chat. Contacts land in Activity -> Contacted.
- **Saved search alerts**: permission screen "Be the first to see homes that match your search".
- **Find an agent**: SuperAgent cards (rating, response time, closed deals, languages), promo "List your home with top SuperAgents".
- **Sell / rent out**: "find your property and match you with SuperAgents" (owner lead flow).
- **Mortgage Finder**: rates, pre-approval, advisors, free callback, mortgage and rent-vs-buy calculators.
- **Login**: Apple, Google, WhatsApp, Facebook, Email. Most personal features (Activity, alerts) need an account.

### Product observations (for PM thinking)
- Funnel is **search -> listing -> Call/WhatsApp** (lead = PF's core value for paying agencies). "Contacted" history exists, but there is no follow-up after contact (did the agent reply? viewing? outcome?).
- Trust signals are strong (response time, SuperAgent, licenses, verified), but listing **availability** is not shown.
- Data assets (Transactions, KPIs) live in a separate tab and are weakly connected to the listing decision ("is this price fair?").
- Monetization hooks inside the consumer app: paid tiers (Premium), developer ads in the feed, mortgages, Rent in 12, owner leads for SuperAgents.
- AI (Scout) is not part of the app yet: an obvious surface to bring it to.

## Features for agents / agencies (B2B)
- **PF Expert / Partner Hub**: listing management, lead inbox (calls, WhatsApp, email), performance analytics.
- **Credits system (PF Flex)**: agencies buy credits on an annual contract; listings cost credits depending on value and market; upgrades (Featured, Premium, Spotlight) for more exposure.
- **Credit Optimizer**: AI tool suggesting where to spend credits.
- **SuperAgent**: monthly badge for top agents (verified deals in last 90 days, rating >= 4.0) that boosts ranking.
- **Verified listings**: listing checked for availability/accuracy (Trakheesi permit in Dubai).
- Lead quality, response time and customer reviews drive ranking.

## Key use cases
1. **Renter**: search area + budget -> filter -> compare cards -> WhatsApp agent -> viewing. Pain: fake/unavailable listings, cheques vs monthly rent, comparing areas.
2. **Buyer (end user)**: search -> check transactions and price vs average -> mortgage pre-approval -> contact agent.
3. **Investor (off-plan)**: browse new projects -> compare payment plans, developer, delivery -> yield and growth -> contact developer/agent. Heavy use of data.
4. **Owner / seller**: valuation -> "Sell your property" -> choose SuperAgent.
5. **Agent**: list properties, buy upgrades, respond to leads fast, earn SuperAgent.
6. **Developer**: launch project page, generate leads for off-plan sales.

## Trust signals (important in this market)
- Verified badge, SuperAgent, licenses shown, DLD transaction data, reviews of agents, buildings and communities.
