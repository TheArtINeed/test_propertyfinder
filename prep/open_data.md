# Open data for task day

Public data sources that may help with sizing, evidence or a prototype dataset. Collected 2026-11-21 from web search; dates and licenses must be re-checked before use. Status: **checked** = page seen in search results; **verify** = not opened, details unknown.

## Decision: no Dubai Pulse access request
We don't wait for permission-gated datasets. Use only sources that open without approval:
- Metro / tram stations (CC BY 4.0 copy on UAE open data).
- Aggregates from DLD reports, the DLD Rental Index and PF Transactions pages (read by hand, cite the page).
- Hugging Face DLD mirror only after checking its license and freshness.
- Prototype listings: synthetic, calibrated on those public aggregates. Note the license line for each file used (attribution in README).

## Dubai: real estate (DLD via Dubai Pulse)
| Dataset | What it gives | Use for | Access | Status |
|---|---|---|---|---|
| [DLD rent contracts](https://www.dubaipulse.gov.ae/data/dld-registration/dld_rent_contracts-open?page=1) | Ejari rental contracts (CSV / API), updated daily at source | Real rents by area / type / size; prototype data; "is this a fair price" | Permission + API key | verify: listing showed last update May 2024 |
| [DLD transactions](https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open) | All transactions: sales, mortgages, gifts, etc. (CSV / API) | Sale prices, off-plan vs ready, mortgage share | Permission + API key | verify: listing showed update Apr 2024 |
| [DLD projects](https://www.dubaipulse.gov.ae/data/dld-registration/dld_projects-open?page=4) | Registered projects | Off-plan / developer ideas | Permission | verify fields |
| [DLD area lookup](https://www.dubaipulse.gov.ae/data/dld-transactions/dld_lkp_areas-open) | Area codes and names | Normalising community names (JVC, Marina...) | Open | checked |
| [DLD land registry](https://www.dubaipulse.gov.ae/data/dld-registration/dld_land_registry-open) | Land records | Probably not needed | Permission | verify |
| [Dubai Pulse catalogue](https://www.dubaipulse.gov.ae/data/smartdubai-general/smart_dubai_dubai_pulse_data_catalog_open-open) | List of all open datasets with fields | Finding anything else fast | Open | checked |
| [DLD open data page](https://dubailand.gov.ae/en/open-data/real-estate-data) | DLD's own data portal (transactions, Ejari) | Alternative download | Open | verify |
| [DLD Rental Index](https://dubailand.gov.ae/en/eservices/rental-index-overview/) | Official rent ranges by area | Fair-rent check, RERA rent increase rules | Open (web tool) | checked |
| [DLD Annual Review 2025](https://dubailand.gov.ae/en/open-data/research/dubai-real-estate-market-annual-data-review-2025) | Market totals 2025 | Sizing (already in `fact_sheet.md`) | Open | checked |

**Fresh number**: Q1 2026 Dubai rental contracts ~AED 32.2B; 118,385 new + 135,607 renewals (DLD, Nov 2026, via search). Useful for renter funnel sizing; verify on the DLD news page.

## Dubai: location and life
| Dataset | Use for | Access | Status |
|---|---|---|---|
| [RTA metro stations](https://www.dubaipulse.gov.ae/data/rta-rail/rta_metro_stations-open?page=2) (name, line, lat/long; CC BY 4.0 copy on [UAE open data](https://opendata.fcsc.gov.ae/@dubaipulse/metro-stations)) | "Near metro" filter, distance on listing cards | Open | checked |
| [RTA tram stations](https://www.dubaipulse.gov.ae/data/rta-tram/rta_tram_stations-open) | Same for tram | Open | checked |
| [RTA metro ridership](https://www.dubaipulse.gov.ae/data/rta-rail/rta_metro_ridership-open) | Commute demand by station | Open | checked |
| [DSC population by community](https://www.dubaipulse.gov.ae/data/dsc-statistics/dsc_population_by_community-open?page=1) | Demand per community, per-capita metrics | API | verify year |
| [KHDA private schools](https://www.dubaipulse.gov.ae/data/khda-schools/khda_private_schools_in_dubai-open) | Schools near home for families (curriculum, rating, enrolment). Non-commercial use, attribution required; ratings frozen since 2024-25; no fees | Permission | checked |
| [Dubai Municipality open data](https://dm.gov.ae/open-data/) | Maps, zoning, community boundaries | Open | verify |

## Other PF markets
| Market | Source | What | Status |
|---|---|---|---|
| KSA | [REGA Real Estate Indicators](https://rei.rega.gov.sa/en) | Sales (MoJ) and rentals (Ejar) by region / city / district, dashboards | checked |
| KSA | [Saudi open data portal](https://open.data.gov.sa) and a community mirror [Saudi-Real-Estate-Data](https://raw.githubusercontent.com/civillizard/Saudi-Real-Estate-Data/main/README.md) | REGA rental indicators 2019-2024, MoJ sales files | verify license (mirror is unofficial) |
| KSA | [Ejar: 10M+ contracts since launch](https://rega.gov.sa/en/media-center/news-announcements/ejar-registers-over-10-million-rental-contracts-since-launch/) | Size of rental market | checked |
| Qatar | Ministry of Justice weekly real estate bulletin ([QNA example](https://qna.org.qa/en/News-Area/News/2026-10/15/qatar-real-estate-trading-volume-tops-qr499-million-in-one-week)) | Weekly sales by municipality and district | verify machine-readable format |
| Bahrain | [RERA Aqari platform](https://www.newsofbahrain.com/business/138182.html) | Transactions dashboard, price per sq ft by area | verify access |
| Bahrain | [CBRE H1 2026 snapshot](https://www.cbre.com/insights/figures/bahrain-real-estate-market-snapshot-h1-2026) | 4,951 transactions H1 2026 | checked |
| Egypt | not found yet | — | gap |

## Property Finder's own public data
| Source | What | Status |
|---|---|---|
| [PF Market Pulse](https://www.propertyfinder.ae/blog/property-finder-launches-pf-market-pulse/) (bi-monthly user poll) | ~70-72% of respondents plan to buy within 6 months; first wave 13K+ users. Sample = active PF users, not all residents | checked |
| [PF Market Watch 2025 review](https://www.propertyfinder.ae/en/insightshub/market_watch/2026-annually-2026-364) | Sale vs rent impressions 49/51 (2025); mortgage payment share of income 23% -> 31% (Mortgage Finder); Dubai prices +8% YoY | checked; one other release says sale impressions 39%: quote with care |
| [PF Transactions pages](https://www.propertyfinder.ae/en/transactions/rent/dubai/dubai-land) | DLD-based rent / sale history per community (web only) | checked |
| [PF mortgage guide](https://propertyfinder.ae/blog/dubai-mortgage-how-much-can-i-borrow) | Expat LTV 80% up to AED 5M, 70% above; 60-65% second home; fixed rates ~4.9-5.8% (2026) | checked; binding rules = Central Bank UAE |

## Listings data (for a prototype catalogue)
| Source | Notes | Status |
|---|---|---|
| [Kaggle: UAE Real Estate 2024](https://baselight.app/u/kaggle/dataset/kanchana1990_uae_real_estate_2024_dataset) | ~5K Dubai listings, Aug 2024, scraped (incl. PF). Fields: price, rent/sale, size, furnishing | verify license; scraped data: use only as shape reference, not as "PF data" |
| [HF: viewit-ai/full-dubai-pulse](https://huggingface.co/datasets/viewit-ai/full-dubai-pulse) | Mirror of DLD transactions from 2005 | verify license and freshness; fallback if Dubai Pulse access is slow |
| [HF: lemoninabag/Sales](https://huggingface.co/datasets/lemoninabag/Sales) | DLD sales incl. Oct 2024 | verify |
| Scrapers / paid datasets (Apify, Payhip) | Don't use: terms of service risk, cost | rejected |

**Recommendation for a prototype**: synthetic listings generated from real DLD rent / price distributions by area (+ real metro coordinates). Honest, legal, realistic; label it "synthetic, calibrated on DLD open data" in README.

## Mortgage / finance
- Expat mortgage rules (Khaleej Times): max tenor 25 years, debt burden ratio <= 50%, loan <= 7x annual income. [Source](https://www.khaleejtimes.com/life-and-living/uae-how-expats-can-take-out-mortgage-loans-minimum-salary-age-limit-documents). Verify with Central Bank UAE.
- EIBOR / Central Bank statistics: not found in this pass — check centralbank.ae if needed.

## Built: toy listings
`dataset/listings.json`: 150 synthetic listings calibrated on public area benchmarks. Limitations are written up in the Google Doc "PF Challenge - Data and Limitations".
