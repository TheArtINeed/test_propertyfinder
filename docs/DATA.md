# Data and measurement

What we measure, what must not drop, which data from other PF teams we read, and how we handle the data. Event names in `code` are the ones the prototype already sends (`lib/events.ts`, `POST /api/events`); items in *italics* are planned and need production systems.

## 1. Metric tree
**One number: owner month-2 retention**: share of owners with a PF session (not an email open) in their second month after the valuation.

Inputs to the one number:
- **Reach:** valuations done -> share that clicks "Get this every month".
- **Habit:** monthly digest opened -> clicked -> session on My Home.
- **Value per visit:** intent set, lead sent, deal list or news opened.

**Owner funnel**
1. Valuation viewed: `valuation_viewed`
2. "Get this every month": `get_monthly_clicked`
3. Home saved: `unit_claimed`, `digest_subscribed`
4. Digest opened, return session: `digest_opened`, `session_started`, `deal_list_opened`, `news_opened`
5. Intent set: `intent_set`
6. Lead sent, status checked: `lead_submitted`, `lead_status_viewed`
7. *Agent accepted the lead* -> *deal registered in DLD / Ejari for the same unit* (lead-to-deal match)

**Renter funnel:** rent checked `rent_checked` -> reminder set `renter_reminder_set` -> owner-confirmed unit viewed `owner_confirmed_viewed` -> viewing requested `renter_lead_submitted` -> rent vs buy `rent_vs_buy_viewed` -> *mortgage pre-approval*.

**Buyer funnel:** price checked -> mortgage or agent request `mortgage_lead_submitted`, `buyer_lead_submitted` -> "I bought this" `bought_this` -> enters the owner funnel at step 3.

**Valuation quality:** share of the next real deals in the building that fall inside our range (target >= 50% for a P25-P75 range), median error vs the deal price, data freshness (days since the last DLD load).

**Where the money is:** owner leads per 1,000 tracked owners; lead -> deal rate; revenue per lead and, later, per closed deal.

## 2. What must not drop (guardrails)
- **Portal core:** search -> lead conversion and leads per listing for agents. Owner blocks must not distract people who search.
- **Agents:** lead acceptance rate, response time, complaints; credit revenue per agency (pay per deal must add to it, not replace it).
- **Owners:** unsubscribes, spam reports, WhatsApp blocks, consent withdrawn, data deletion requests.
- **Trust:** valuation complaints and "Something wrong?" reports.
- **Notification budget:** our digest plus other teams' messages must stay under PF's per-user limit.
- **Mortgage Finder:** its applications must grow, not move from one entry to another.

## 3. Data from other PF teams
- **PropWorth today:** valuations per month and repeat rate. This is the test baseline (we assumed 4%) and checks that 1% of owners gives ~1.9K per arm.
- **Search and saved searches:** demand for the digest; a saved search that goes quiet triggers "Did you buy?".
- **Listings and Trakheesi permits:** match owner-confirmed units, find duplicates and withdrawn listings.
- **Leads (call, WhatsApp, email) and agent CRM:** response time, lead -> deal.
- **Mortgage Finder:** refinance owners and renters who could buy.
- **Scout:** questions like "how much is my flat worth".
- **Transactions tab, Market Watch, PF Insights:** reuse their DLD pipeline so our numbers match the portal's.
- **Agency billing:** cannibalisation check for pay per deal.

## 4. Handling and infrastructure (short)
- Monthly DLD sales and Ejari load; Dubai Pulse for history before 2026 and all of Dubai.
- Cleaning as in the prototype: same-day bulk deals counted once, Ejari outliers (AED 50 to AED 9M a year) handled with medians, deals without a building name dropped, off-plan excluded.
- Unit registry with owner confirmation (title deed), consent store: who may contact the owner, about what, by which channel.
- Personal data kept apart from analytics; agents get aggregates and only leads the owner sent. UAE PDPL; deletion on request (built in the prototype: "Remove this home").
- Lead-to-deal matching by unit against DLD / Ejari.
- Events into PF's analytics and experiment platform for the holdout test. In the prototype events are validated and kept in memory and `localStorage` only.
