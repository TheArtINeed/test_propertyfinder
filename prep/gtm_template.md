# Go-to-market and rollout (template)

Fill on task day. Keep each section to 2-4 lines.

## 1. Who gets value, who pays
| Party | Value they get | Do they pay? How? |
|---|---|---|
| Seeker (renter / buyer / investor) | | Usually free |
| Agent / agency | | Credits, paid tiers, per lead, per deal |
| Developer | | Project pages, launch leads |
| Bank / mortgage partner | | Fee per funded loan |
| Property Finder | Revenue, share vs Bayut, data | — |

## 2. Pricing and packaging
- Model: included in existing credits / new paid tier / per qualified lead / share of commission.
- Price logic: anchor to the value for the payer (e.g. commission per closed deal) and to what they pay today.
- How to test price: agency pilot with paid tier vs matched control, 2-3 price points.

## 3. Positioning (one line)
For **[segment]** who **[pain]**, **[feature]** **[benefit]**, unlike **[current way / Bayut]**.

## 4. Rollout phases
| Phase | Scope | Exit criteria |
|---|---|---|
| 0. Fake door / prototype | Small traffic slice or user interviews | Demand signal (click-through, sign-ups) |
| 1. Pilot | 1 city, 1 segment, 5-10 agencies | Holdout result on primary metric, guardrails safe |
| 2. Scale in UAE | All Dubai, then Abu Dhabi | Unit economics positive, ops ready |
| 3. Other markets | See market order below | Local fit confirmed |

## 5. Market order (5 markets)
| Market | Why this order | Local specifics to check |
|---|---|---|
| UAE | Core, most data and agencies | RERA / DLD ad rules, Ejari |
| KSA | Biggest growth (Vision 2030), funding goal | Arabic-first, REGA rules, Ejar, local hosting of data |
| Egypt | Large population, price-sensitive | Low agent budgets, currency volatility, off-plan heavy |
| Qatar | Smaller, high income | Fewer listings, expat rentals |
| Bahrain | Smallest | Quick pilot market for Arabic UX |

Adjust the order to the idea (e.g. an Arabic-first feature could start in KSA).

## 6. What we need from other teams
- **Commercial / Sales**: pilot agencies, pricing, sales deck, training.
- **Legal / Compliance**: data sharing with agents (consent), ad rules, AI disclaimers.
- **Data**: baselines, holdout setup, DLD / Ejari matching.
- **Design / Eng**: build after the prototype is validated.
- **Support / CS**: FAQ, dispute flow for paid leads or deals.

## 7. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Agencies don't see value / won't pay | Pilot with free period, show lead quality data |
| Lead volume drops (fewer but better leads) | Guardrail on lead volume; report value per lead |
| LLM cost or errors | Code handles numbers and filters; LLM only for understanding and text; cost cap per session |
| Bayut copies fast | Speed + PF data advantage (DLD transactions, Verified, SuperAgent) |
