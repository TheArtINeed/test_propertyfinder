# Done Log

Main steps completed, in order. Shareable: no private notes, keys or task text.

Format: `YYYY-MM-DD — what was done — why / outcome`.

## Preparation

- 2026-11-21 — Created a dedicated GitHub repo for the challenge — one clean, reviewable deliverable.
- 2026-11-21 — Collected a design book (`design.md`): PF colors, fonts, sizes, components — prototype UI matches the brand.
- 2026-11-21 — Gathered market numbers (`market_pf.md`): market size, business model, clients, growth — grounded sizing and impact estimates.
- 2026-11-21 — Checked all integrations and that tokens are set across the whole stack, including the LLM API — no setup surprises once the clock starts.
- 2026-11-21 — Set up project guidelines (`CLAUDE.md`) and feature log (`feature.md`) — one source of rules and context for every session.
- 2026-11-21 — Added Property Finder reference docs: design, product, market, Scout — no re-research during the timed task.
- 2026-11-21 — Added competitor analysis (Bayut, Dubizzle, Cian, Domclick, Avito, Dubai REST, Huspy, Zillow, short-term rentals) — ideas and benchmarks for PF.
- 2026-11-21 — Added task-day prep templates: sizing fact sheet, measurement, GTM (`prep/`) — fast business framing once the task is known.
- 2026-11-21 — Added synthetic Dubai listings dataset and open data catalogue (`dataset/`, `prep/open_data.md`) — realistic data for the prototype without scraping.
- 2026-11-21 — Built Next.js app skeleton with API health check and tests — ready to build features from minute one.
- 2026-11-21 — Set OpenAI as the only LLM provider (`OPENAI_API_KEY`) — single, simple AI integration.
- 2026-11-21 — Added rule: no commit, push or deploy without explicit approval — controlled, reviewed history.
- 2026-11-21 — Set up tests: Vitest for the app, Python tests for the dataset — every feature ships with tests.
- 2026-11-21 — Prepared Vercel deploy setup (Node, Vercel, OpenAI) — the prototype can go live quickly.
- 2026-11-21 — Created a dedicated Drive folder for submission files and AI chat exports — everything for reviewers in one place.
- 2026-11-21 — Prepared a submission checklist, run ~40 minutes before the deadline — nothing missed at hand-in.

## Task

- 2026-11-21 — Re-ran the competitor analysis, focused on the task — benchmarks and ideas aimed at the problem we are solving.
- 2026-11-21 — Found and checked real open data from Dubai Land Department: sales transactions and Ejari rental contracts — the prototype runs on real market data, not only synthetic.
- 2026-11-21 — Chose JVC (Jumeirah Village Circle) as the example district: #2 in Dubai for ready-home resales (408 deals in Oct 2026), rich mix of studios/1BR/2BR — a deep, realistic sample for the demo.
- 2026-11-21 — Collected sourced user pains for owners, renters and buyers (`prep/user_pains.md`) — problem framing grounded in press and regulator sources, gaps marked.
- 2026-11-21 — Looked for what competitors have NOT built that could fix PF's problems, going beyond direct competitors to adjacent products — white spaces, not copies.
- 2026-11-21 — Listed PF's likely problems (hypotheses) and ranked candidate solutions by potential — a clear, defensible pick of what to build.
- 2026-11-21 — Looked for confirmation of the problems in open sources and compared them with hands-on experience at Cian — hypotheses checked against evidence and a real comparable market.
- 2026-11-21 — Checked the key sources behind the user pains (dates, survey bases, exact claims) and noted that pains are assumptions from open sources and portal experience, not PF data — numbers in the one-pager survive a fact-check.
- 2026-11-21 — Started an agent to collect support use cases in parallel while the DLD data loads — no idle time on the clock.
- 2026-11-21 — Pulled a real DLD snapshot for JVC, 1 Jan - 20 Nov 2026: 9,139 sales (~4K ready resales) and 34,692 Ejari rent contracts, with a re-runnable fetcher and tests (`dataset/fetch_dld.py`) — valuation, rent checks and "my building" views run on real public data. Limits found and kept honest: the open portal serves only the current year (no 2025 history without a Dubai Pulse key); rent contracts rarely list bedrooms and ~28% lack the building, so rents are compared by size.
