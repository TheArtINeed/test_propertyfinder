# Fact sheet: numbers for sizing

One place for the numbers we may need on task day. Every line has a tag:
- **fact**: public figure, source linked below.
- **derived**: simple math on facts (shown).
- **assumption**: our estimate; say so in the submission and name how PF data would verify it.

Currency: AED is pegged, 1 USD = 3.6725 AED.

## Property Finder
| Metric | Value | Tag | Source |
|---|---|---|---|
| UAE revenue 2024 | $117M | fact | [1] |
| UAE revenue H1 2025 | $73M | fact | [1] |
| UAE revenue 2025 (run-rate) | ~$146M | derived: H1 x2 | [1] |
| Revenue CAGR 2020-2024 | 40%+ | fact | [1] |
| Funding Sept 2025 | $525M (Permira, Blackstone), valuation > $2B | fact | [2] |
| Share of sale-listing impressions (PF self-reported) | 47% (2024) -> 49% (2025) | fact (self-reported) | [3] |
| Markets | UAE, KSA, Egypt, Qatar, Bahrain | fact | [4] |
| Main payer | Agencies (credits, paid tiers Featured / Premium / Spotlight) | fact | [4] |
| Agency share of revenue | ~70% | assumption | VERIFY: finance |
| UAE leads per year (call + WhatsApp + email) | ~6M | assumption | VERIFY: data team |
| Monthly visits | "several million" across markets | fact (vague) | [4] |
| Long-term rental listings UAE | ~168K | fact (site count, Nov 2026) | propertyfinder.ae |
| Short-term rental listings UAE | ~1.3K | fact (site count, Nov 2026) | propertyfinder.ae |

## Dubai market (2025, DLD)
| Metric | Value | Tag | Source |
|---|---|---|---|
| All transactions | 270,328 (+20% YoY), AED 917B | fact | [5] |
| Sales | ~215K deals, AED ~682B | fact | [5], [6] |
| Off-plan share | ~63-65% of deals, 53% of value | fact | [5] |
| Mortgage transactions | 50,974 (AED ~179B) | fact | [7] |
| New tenancy contracts | > 513K | fact | [8] |
| All tenancy contracts | ~1.38M, AED ~126B -> avg ~AED 92K/yr | fact + derived | [8] |
| Rent growth | +~17% (2025); 2026 forecasts -5% to +6% | fact | [9] |
| Supply risk | Big 2026-27 deliveries in JVC, JVT, Dubailand, Dubai South; vacancy up to ~12% | fact (forecast) | [9] |
| Population growth 2025 | +231K to +332K | fact (sources differ) | [10] |
| Expat share of residents | ~90% | fact | [4] |
| International overnight visitors | 19.59M (2025) | fact | `competitors.md` |

## Unit economics (market norms)
| Metric | Value | Tag |
|---|---|---|
| Rental agent commission | 5% of annual rent (tenant pays) | fact: market norm |
| Sale agent commission | 2% of price (buyer pays) | fact: market norm |
| Mortgage broker fee from bank | 0.5-1% of loan | assumption |
| Avg annual rent on PF | AED 100-120K | assumption (DLD avg AED 92K, PF skews up) |
| Avg secondary sale price | AED 1.8-2.2M | assumption (DLD avg AED 3.1M incl. off-plan and large deals) |
| Fully loaded Dubai FTE | $180K / yr | assumption |
| LLM cost per Scout conversation | ~$0.07 | derived: 6 turns x (4K in + 0.4K out) at ~$2 / $10 per 1M tokens; recompute with the price of the OpenAI model used |

## Competitors (one line each)
- **Bayut** (Dubizzle Group, adj. revenue ~$183M 2024): early in AI (BayutGPT, AI Search, app inside ChatGPT). Main rival.
- Developers selling direct and WhatsApp / Instagram agents: indirect competition for leads.
- Details: `competitors.md`.

## Quick sizing formulas
- **Leads -> revenue**: leads x share affected x uplift x value per lead.
- **Pay per deal**: leads x close rate x commission x PF share x share matched and paid.
- **% of PF revenue**: impact / ~$146M (2025) — useful sanity check; > 5% needs strong evidence.

## Sources
1. [Entrepreneur ME: PF revenue](https://www.entrepreneur.com/en-ae/finance/dubais-property-finder-raises-250-million-from-ares/498574)
2. [The National: $525M round](https://www.thenationalnews.com/business/property/2025/09/09/dubais-property-finder-raises-525m-from-permira-and-blackstone/)
3. [PF Market Watch 2025 review](https://www.propertyfinder.ae/en/insightshub/market_watch/2026-annually-2026-364)
4. `context_pf.md`, `market_pf.md` (this repo)
5. [DLD Annual Data Review 2025](https://dubailand.gov.ae/en/open-data/research/dubai-real-estate-market-annual-data-review-2025)
6. [Gulf News: Dubai 2025 record sales](https://gulfnews.com/business/property/dubai-property-market-closes-2025-with-record-dh6825-billion-in-sales-1.500396068)
7. [Zawya / DLD: mortgages 2025](https://www.zawya.com/press-release/research-and-studies/dubai-real-estate-market-hits-aed-6825bln-with-214-912-transactions-in-2025-lnxen66w)
8. [DLD: rental sector 2025](https://dubailand.gov.ae/en/news-media/dubai-s-rental-sector-records-strong-growth-in-2025-underscoring-market-stability-and-the-strength-of-the-emirate-s-real-estate-ecosystem/)
9. [Khaleej Times: rents cooling](https://www.khaleejtimes.com/business/property/dubai-rents-seen-cooling-as-new-supply-reshapes-market)
10. [Gulf News: Dubai population](https://gulfnews.com/uae/biggest-jump-how-dubais-population-crosses-458m-1.500625403)
