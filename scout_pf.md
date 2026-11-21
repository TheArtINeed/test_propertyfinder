# Scout (PF's AI assistant)

URL: https://www.propertyfinder.ae/scout/v2 (tested 2026-11-21, logged out). Status: **BETA**.
No official launch press release found; it looks like a live beta.

## What it is
- Conversational property search + market/investment advisor for the UAE.
- Positioning: data-driven decisions; latest data and news on new properties; search, neighborhoods, investment advice.
- Multilingual: "Search in the language you think in".
- Disclaimer under input: AI can make mistakes; `/feedback` command to send feedback.

## UI structure
- **Left sidebar**: "PF Scout" + BETA, "+ New Conversation", **Recents** (auto-titled chats with snippet, time, message count). Login prompt at the bottom.
- **Home**: hero image + big input "How can I help you today?".
- **Quick search chips** (mostly off-plan / investor oriented): New launches this month, Under 20% down payment, Post-handover plans, Highest appreciation potential, Emaar & DAMAC launches, Ready in 2027 under 2M.
- **Market Pulse** cards (live KPIs with change vs last period): new launches this month, average down payment (vs 20% baseline), hottest community (e.g. Dubai South, number of hot projects), off-plan momentum %, primary market share %.
- **Chat answer**:
  - "Used N tools · X s" (shows agentic tool calls).
  - Short summary with highlights ("best value for space", "best furnished deal").
  - Horizontal **carousel of listing cards** ("26 of 460 total"): SuperAgent, agent, tier (Standard/Premium), listed date, price AED/yr, beds/baths/area/type, address, Verified; buttons **Call**, **WhatsApp**, **Dig Deeper**.
  - **Refinement suggestions** as cards with title + subtitle (Furnished only, Larger size 1,300+ sqft, Under AED 120K, Verified listings only).
  - Thumbs up/down feedback per answer.
- **Dig Deeper** opens a **right detail panel** (listing photo, address, "View on PropertyFinder") with follow-up questions: compare with similar listings, what is included in rent, contact the agent, area market overview.
- Logged-out banner: personalized insights, smarter matches, saved chats require login.

## What it can do (observed)
1. **Natural-language search**: "2BR in Dubai Marina to rent under 150k with sea view" -> parsed filters (location, beds, budget, view), returned 460 matches, top picks with reasons.
2. **Investment comparison**: "JVC vs Dubai South off-plan, 1.5M budget" -> table with gross yield, net yield, price-per-sqft growth, rent growth, off-plan -> resale appreciation, transaction depth, number of projects under budget; verdict + bottom line by risk profile. Data from DLD transactions (3 years). Used 4 tools in ~2s.
3. **Listing deep-dive**: context-aware (knows the listing came from the current search).
4. Market KPIs for off-plan / primary market.

## Gaps and weak spots (ideas)
- Heavily investor/off-plan focused; **renters and first-time buyers** get less guidance (upfront costs, cheques vs Rent in 12, commute, schools).
- No visible **"what I understood"** panel: user cannot see/edit parsed filters (location, budget, beds) mid-conversation.
- Results carousel only; no **map**, no side-by-side **compare** of 2-3 listings.
- No **saved search / alert** from chat ("tell me when a new one appears").
- No **viewing booking** or agent availability; contact is only Call/WhatsApp.
- No affordability / **mortgage** integration in chat (income -> max price, monthly payment).
- No total **cost of living** per area (DEWA, service charges, chiller, parking).
- Answers lack **sources/confidence**; risky for investment advice.
- Personalization only after login; no **profile** (family, pets, office location, budget).
- Arabic/RTL and voice input not visible.
- Little for **agents** (B2B side): Scout could generate qualified leads with context (budget, timeline, preferences) instead of a bare WhatsApp click.

## Ideas to develop Scout
1. **Editable intent chips**: show parsed filters as chips above results; tap to change.
2. **Compare mode**: pick 2-3 listings/areas -> table (price, size, price/sqft, yield, commute, upfront costs).
3. **Commute & lifestyle search**: "max 25 min to DIFC, near a good school, pet-friendly".
4. **Affordability & total cost**: rent + cheques/Rent in 12, agency fee, deposit, DEWA, Ejari; buy: down payment, DLD 4% fee, mortgage.
5. **Smart alerts**: "watch this search" from chat, with AI summary of new matches.
6. **Qualified lead handoff**: summary of the conversation sent to agent (budget, move-in date, must-haves) -> better lead quality = more value for paying agencies.
7. **Viewing scheduler** and availability check (fight "not available" listings).
8. **Trust layer**: show data source (DLD, PF listings) and confidence for each number.
9. **Area explainer**: community profile, pros/cons, reviews summary, price trend chart.
10. **Agent-side Scout**: draft listing descriptions, price recommendation from transactions, lead prioritization.
