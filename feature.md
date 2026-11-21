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
