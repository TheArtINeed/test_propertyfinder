# Spec: support use cases

Product hygiene for the prototype: the secondary flows a real owner or renter expects around the main flow. They are not the core idea, but without them the prototype feels like a demo, not a product.

Scope: owner flow (starts from PropWorth) and renter flow. Agent side is not built (see Limitations doc); agents appear only as the destination of a lead.

Data: real DLD sales and Ejari rents for JVC (`dataset/dld_jvc_*.json`); everything else (accounts, verification, leads, notifications) is mocked in local state.

## Priorities

> **Superseded:** current priorities and new cases (O10 digest, R6 break / renew / negotiate, R7 owner-confirmed units, B1-B2 buyer, X7-X10) are in `docs/SPEC.md` section 9. This file keeps the details and acceptance criteria.

- **P0**: must work in the click-through. Built first.
- **P1**: built if time allows; otherwise a visible entry point that opens a simple stub screen.
- **P2**: not built; listed in README as known missing work.

| ID | Case | Priority |
|---|---|---|
| O1 | Find my home and claim the unit | P0 |
| O2 | Change property status | P0 |
| O3 | Rent out or sell through an agent (lead) | P0 |
| O4 | "I think it's worth" (owner's own value) | P1 |
| O5 | Add another property | P1 |
| O6 | Contact preferences (stop cold calls) | P1 |
| O7 | Notification settings | P1 |
| O8 | Lease renewal for a rented-out unit | P1 |
| O9 | Remove a property, delete my data | P1 |
| R1 | Renter entry from the first screen | P0 |
| R2 | Is my rent fair | P0 |
| R3 | Renewal check: is the increase allowed | P1 |
| R4 | Renter to owner: what would buying cost | P1 |
| R5 | Contact the landlord's agent about a listing | P1 |
| C1 | Source and estimate labels | P0 |
| C2 | Empty, low-data and error states | P0 |
| C3 | Mobile navigation and deep links | P0 |
| C4 | Report wrong data / contact support | P1 |
| C5 | Sign in, sign out (mock profile) | P1 |
| C6 | Consent for owner data | P1 |
| X1 | Real title deed verification | P2 |
| X2 | Real lead delivery to agents | P2 |
| X3 | Push / email notifications | P2 |
| X4 | Arabic and RTL | P2 |
| X5 | Move-out and deposit return | P2 |
| X6 | Areas beyond JVC, other emirates and markets | P2 |

## Owner

### O1. Find my home and claim the unit (P0)
- **Story:** as an owner I find my building, pick my unit and save it as mine, so I can come back to it.
- **Flow:** search by building name (JVC projects from DLD sales) → pick unit number, size, bedrooms → see valuation → "This is my home" → unit saved to "My homes".
- **Claim:** owner enters a title deed number; status shows "Verification pending". Mocked: no document check, no real ID stored.
- **Acceptance:** search matches partial names, case-insensitive; a saved unit survives page reload; claim status is visible on the unit page.
- **Edge:** building not found → "Can't find your building?" with a request form (C4).

### O2. Change property status (P0)
- **Story:** my situation changes; I tell PF what I do with the unit.
- **Statuses:** I live here / Rented out / For sale / Not available.
- **Rules:** "Rented out" asks for annual rent and lease end date (feeds O8). "For sale" and renting-out intent lead to O3.
- **Acceptance:** status is shown on the unit card and unit page; history of changes kept with dates.

### O3. Rent out or sell through an agent (P0)
- **Story:** I want to rent out or sell; PF connects me with an agent.
- **Flow:** "Rent out" or "Sell" → asking price prefilled from the estimate (editable) → availability date → contact method (call / WhatsApp / email) → summary of what the agent will receive → "Send request" → confirmation.
- **Lead payload:** unit, size, bedrooms, intent, asking price, estimate and range, availability, contact method, owner verification status.
- **Mocked:** nothing is sent; the lead is stored locally and shown in "My requests".
- **Acceptance:** cannot send without intent and contact method; payload matches the schema (tested).

### O4. "I think it's worth" (P1)
- Owner enters own value; shown next to the PF estimate with the difference in %.
- Stored with date; used later as data ("what owners think their home is worth").
- Validation: positive number, warn if more than 50% away from the estimate.

### O5. Add another property (P1)
- "My homes" lists all saved units with status and current estimate; "Add a home" reuses O1.
- Switching units keeps each unit's own status and settings.

### O6. Contact preferences (P1)
- Options: Not selling / Open to offers above AED X / Will rent out from date.
- Agents may contact the owner only through PF and only within these terms (stated in UI, not enforced in the prototype).
- Default: Not selling.

### O7. Notification settings (P1)
- Frequency: monthly summary / only big changes / off.
- Topics: value change, new sales in my building, lease renewal reminders (if rented out).
- Mocked: settings saved locally, no messages sent; an in-app "inbox" shows what would have been sent.

### O8. Lease renewal for a rented-out unit (P1)
- Input from O2: current rent, lease end date.
- Shows: days to lease end; reminder at 90 days (notice deadline); allowed increase per the RERA rental index rule (Decree 43 of 2013) using the JVC Ejari median for a similar size as the index proxy:

  | Current rent below index by | Max increase |
  |---|---|
  | up to 10% | 0% |
  | 11-20% | 5% |
  | 21-30% | 10% |
  | 31-40% | 15% |
  | over 40% | 20% |

- Note in README: the official RERA calculator uses DLD's own index, ours is a proxy from Ejari contracts.
- **Acceptance:** calculator returns the right band at each boundary (tested).

### O9. Remove a property, delete my data (P1)
- Remove one unit, or delete all data; confirmation dialog states what is deleted.
- **Acceptance:** after delete nothing of the owner remains in local storage.

## Renter

### R1. Renter entry from the first screen (P0)
- First screen has two clear entries: "I own a home" and "I rent".
- Renter can use R2 without an account.

### R2. Is my rent fair (P0)
- Input: building (optional), size or bedrooms, annual rent.
- Output: position vs JVC Ejari contracts of similar size, and vs the same building where data exists: median, typical range, "below / around / above market".
- Low data: fewer than 10 contracts in the building → compare with JVC by size and say so.
- **Acceptance:** median and range computed from real rows (tested on fixtures).

### R3. Renewal check (P1)
- Landlord asks +X%: same calculator as O8, from the renter's side: allowed or not, 90-day notice rule, link to the Rental Dispute Center.

### R4. Renter to owner (P1)
- "What would buying a similar home cost": PropWorth estimate for a similar unit in JVC, compared with annual rent (simple price-to-rent ratio).
- This is the bridge from the renter flow to the owner side.

### R5. Contact about a listing (P1)
- From a rental listing (synthetic listings): call / WhatsApp / email buttons, mocked; confirmation screen.

## Common

### C1. Source and estimate labels (P0)
- Every number shows where it comes from: "DLD registered deals, 2026", "Ejari contracts, 2026", "PF estimate", "Owner's value".
- Estimates always show a range, not only one number.

### C2. Empty, low-data and error states (P0)
- Building not found; unit with too few deals (wider range, JVC-level fallback); data failed to load (retry); AI unavailable, if AI is used (plain non-AI result instead).
- No dead ends: each state has a next action.

### C3. Mobile navigation and deep links (P0)
- Works at 375 px width; Back keeps entered data; each unit page has its own URL that can be shared.

### C4. Report wrong data / contact support (P1)
- "Something wrong?" on unit and rent pages: wrong size, wrong building, not my unit, other. Mocked: stored locally, confirmation shown.

### C5. Sign in, sign out (P1)
- Mock profile (name, phone) in local storage; no real auth, no passwords.

### C6. Consent for owner data (P1)
- Before claiming a unit: one-line consent on how PF uses the data, link to a short privacy text; owner can withdraw via O9.

## Tests
- Logic in `lib/` with Vitest: search matching (O1), status transitions (O2), lead payload schema (O3), value difference (O4), RERA increase bands with boundaries (O8, R3), rent position with low-data fallback (R2), data deletion (O9).
- UI: smoke test that every P0 screen renders and has a next action.
