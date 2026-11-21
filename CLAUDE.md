# CLAUDE.md

## Project
- Take-home build challenge for Property Finder (propertyfinder.ae, UAE real estate portal).
- 6-hour timed task (~3h of focused work), started 2026-11-21 18:02, ends 2026-11-22 00:02.
- Task (our summary, not the brief text): PropWorth (PF's home valuation for owners) is used once and never again. Give owners a real reason to open PF every month. Level: owners who bought a resale home from another owner; PF as the place where the search doesn't end.
- Must have: mobile-first clickable prototype on real public data for one building or community; owner flow starts from the PropWorth valuation; a renter flow reachable from the first screen and linked to the owner side; no pitch text or instructions inside the UI. Public data only.
- Deliverables: repo with code and a short `README.md` (how to run, what is real vs mocked); live link that works on a phone; `ONE-PAGER.md` (market with sources; who it helps: renters, buyers, sellers, owners, one example each; which portal metrics it moves and by how much; what the data makes possible; one number and a test on 1% of owners); Google Drive folder shared as "Anyone with the link can view".
- Plan and scope: `docs/SPEC.md`. Partial work is fine if what is missing is explained honestly.
## Reference docs
- `design.md`: Property Finder visual guidelines (colors, fonts, sizes, components). All UI must follow it.
- `context_pf.md`: Property Finder product: features, user types, use cases.
- `market_pf.md`: market, business model, clients, growth.
- `competitors.md`: Bayut, Dubizzle Property, Cian, Domclick, Avito, Dubai REST, Huspy, Zillow, short-term rentals segment: design, use cases, advantages, ideas for PF.
- `scout_pf.md`: Scout (PF's AI search assistant) features and ideas for extending it.
- Read the relevant doc instead of re-researching the site.

## Language
- Everything in this project is in English: code, comments, docs, commit messages, file names, UI text.
- This applies even when the user writes in another language.

## Features
- Read `feature.md` at the start of every session to get context fast and save tokens.
- Every new feature must be recorded in `feature.md` with a short description.
- Keep `feature.md` up to date: it must describe every feature developed in the project.

## Done log
- `done_log.md`: shareable log of main completed steps (date, what, why/outcome).
- Add an entry after each main step. Never include private notes, keys or task text.

## Testing
- All code, including every new feature, must be covered by tests.
- Workflow: write the code, then run the tests.
- When a test fails, find out why and fix the code first. Do not adjust tests to make them pass.
- If a change legitimately requires updating tests, say so explicitly, then update them.

## Git and deploy
- Never commit, push or deploy (including Vercel) without the user's explicit approval for that specific change.
- Approval covers one change only; ask again for every next commit or push.
- Before asking, list what will be committed and pushed.

## Communication
- Be brief. Keep answers and writing short.
