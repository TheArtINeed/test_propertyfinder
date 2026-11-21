# Design guidelines (Property Finder style)

Extracted from propertyfinder.ae computed styles and CSS variables (2026-11-21).
Use these tokens so everything we build looks like Property Finder.

## Principles
- Clean, white, airy UI. Lots of white space, light grey dividers.
- Coral/red = primary action (Search, Log in, badges "New").
- Deep indigo = brand secondary: selected states, links, secondary buttons, dark CTAs (Map), Scout UI.
- Pill shapes for buttons, chips and search bar; rounded cards (12px).
- Real photography (Dubai skyline, interiors). No heavy illustration.
- Soft, subtle shadows only on floating elements (search box, modals).

## Typography
- Font: **Open Sans** (Google Fonts), weights 400 / 600 / 700. Fallback: `system-ui, sans-serif`.
- Root font size on the site is 10px (`1rem = 10px`); values below are in px.
- Currency: AED symbol uses a custom font (`AEDSymbol`); in our UI write `AED` as text.

| Role | Size / weight / line-height | Color |
|---|---|---|
| Hero H1 | 48 / 700 / 72 | white over photo |
| Section title (H2) | 32 / 700 / 48 | `#333333` |
| Card / block title | 20 / 600 / 32 | `#333333` |
| Price (listing card) | 24 / 600 / 36 | `#333333` |
| Body large | 16 / 400 / 28 | `#333333` |
| Body / button | 14 / 400 or 600 / 24 | `#333333` |
| Secondary / meta | 12 / 400 / 20 | `#707070` |
| Tiny meta ("Listed 6 days ago", tier) | 10 / 400 / 16 | `#707070` |
| Badge text | 12 / 600 / 16 | white |

## Colors

### Core
| Token | Hex | Use |
|---|---|---|
| `primary` | `#EA3934` | Main CTA (Search, Log in), "New" badge |
| `primary-hover` / dark | `#97211E` | Pressed/hover |
| `primary-light` | `#FD6360` | Accents, logo tone |
| `primary-tint` | `#FCE5E5` / `#FEF5F5` | Soft backgrounds |
| `secondary` | `#3A307F` | Links, selected text, secondary button text, icons |
| `secondary-dark` | `#1F1948` | Dark buttons (Map), headings in dark accents |
| `secondary-800` | `#2C255E` | Dark surfaces |
| `secondary-600` | `#6459B2` | Borders of selected chips |
| `secondary-500` | `#8C84CC` | Outlined button border |
| `secondary-300` | `#D1CFED` | Light borders |
| `secondary-200` | `#E7E5F4` | Selected tab/chip background |
| `secondary-100` | `#F7F7FC` | Selected filter bg, icon-button bg (Call/WhatsApp) |
| `tertiary` | `#2E7992` | Info / data accents (teal) |
| `tertiary-100` | `#EFF9FF` | Info background |

### Neutrals
| Token | Hex | Use |
|---|---|---|
| `text-primary` | `#333333` | Main text |
| `text-secondary` | `#707070` | Meta text, placeholders |
| `text-muted` | `#919191` | Counts (e.g. "14,200") |
| `border-strong` | `#CCCCCC` | Inputs, filter pills |
| `border` | `#E3E3E3` | Cards, dividers |
| `bg-subtle` | `#F7F7F7` | Page sections, secondary surfaces |
| `surface` | `#FFFFFF` | Cards, header, body |
| `inverse` | `#1A1A1A` | Inverse surface |
| overlay | `rgba(0,0,0,0.4)` | Badges on photos ("Verified", "Spotlight") |

### Feedback
| Token | Hex |
|---|---|
| success | `#00A663` (bg `#DEFFEA`) |
| warning | `#F7C55F` / `#DDA800` (bg `#FFF6EA`) |
| error | `#CF3151` (bg `#FFF5F6`) |
| focus ring | `#4C94E6` |
| WhatsApp | `#4DBD43` |

## Spacing & layout
- Base unit 4px; common steps: 4, 8, 12, 16, 20, 24, 32, 48.
- Content max width ~1312px (some pages 1169px), side padding ~4% on small screens.
- Header: white, height ~72px, bottom border `#E3E3E3`; logo left, nav links 14px, red pill "Log in" right.
- Search results: list of horizontal cards (~650px wide) + right column; map toggle.

## Radius
| Token | px | Use |
|---|---|---|
| xs | 2 | Tiny tags, agency logos |
| s | 4 | Small elements |
| m | 8 | Buttons (rect), icon buttons, inputs |
| l | 12 | Listing cards |
| xl | 16 | Badges, modals, bottom sheets (`16 16 0 0`) |
| xxl | 24 | Tabs (Rent/Buy), large panels |
| full | 9999 | Pill buttons, search bar, filter chips |

## Shadows
- Floating panel (search box): `0 3px 6px rgba(0,0,0,.05), 0 10px 10px rgba(0,0,0,.05), 0 23px 14px rgba(0,0,0,.03)`
- Small: `0 1px 2px rgba(0,0,0,.05), 0 3px 3px rgba(0,0,0,.04), 0 7px 4px rgba(0,0,0,.02)`
- Cards use a 1px border, not a shadow.

## Motion
- Transition 300ms; ease-out.

## Components

### Buttons
| Variant | Style |
|---|---|
| Primary | bg `#EA3934`, white text 14/600, height 44 (36 compact), pill, padding 0 20px |
| Dark | bg `#1F1948`, white 14/600, height 40, pill (e.g. "Map") |
| Outline | white bg, 1px `#8C84CC`, text `#3A307F` 16/600, height 48, radius 8 |
| Ghost / link | transparent, text `#3A307F` 16/600 |
| Icon (Call, WhatsApp) | bg `#F7F7FC`, icon `#3A307F`, 40x36, radius 8 |

### Search bar
- Pill, white, 1px `#CCCCCC` border, height ~48; search icon left; placeholder "City, community or building" in `#707070`; red pill "Search" button inside on the right.
- Tabs above: Rent / Buy / Sell / New projects / Transactions / Agents in a white pill container; active tab bg `#E7E5F4`, text `#3A307F` 600.

### Filter chips
- Default: white, 1px `#CCCCCC`, text `#707070` 14, height 40, pill, chevron icon.
- Selected: bg `#F7F7FC`, 1px `#3A307F`, text `#3A307F`.
- Small tag chips (community categories): height 32, radius 20, 1px `#E3E3E3`; selected bg `#E7E5F4` + border `#6459B2`.

### Listing card (search results)
- White, 1px `#E3E3E3` border, radius 12, horizontal: photo (320x243, carousel with arrows) left, details right.
- Photo overlays: "Verified" / "Spotlight" badges (bg `rgba(0,0,0,.4)`, white 12/600, radius 16); heart "Save" top-right.
- Details: "Listed X days ago" (10px grey), tier label "Premium"/"Standard" + agency logo top-right; price 24/600 ("AED 170,000 yearly"); title 14 grey (1 line, ellipsis); icons row: beds, baths, area ft², property type (12 grey); address (12 grey, ellipsis).
- Footer: agent avatar (32px circle) + name 12/600, optional "SUPERAGENT" label; Call + WhatsApp icon buttons on the right.

### Scout (AI assistant) UI
- Left sidebar (white): "PF Scout" + "BETA" badge (indigo), "+ New Conversation" outline pill, Recents list.
- Main: hero photo with a large pill input ("How can I help you today?", hint "Search in the language you think in"); quick-search chips with coral borders; "Market Pulse" stat cards.
- Chat answers: text summary, horizontal carousel of compact listing cards (price "AED/yr", specs row, Call / WhatsApp / "Dig Deeper" buttons), then suggestion cards ("Would you like to narrow these down further?") with title + grey subtitle.
- Detail panel slides in on the right with listing photo and suggested follow-up questions.
- Light lavender page background `#F7F7FC`; primary buttons in indigo `#3A307F` / `#2C255E` (pill).

## Mobile app (iOS, from screenshots 2026-11-21)
The app has a newer, iOS-native look that differs from the website. For mobile prototypes, follow this section.

### Foundations
- Font: **system font (SF Pro)**, not Open Sans. Large bold titles, regular body.
- Background: light grey (`#F2F2F7`-like); content sits on **white cards with large radius (~24px)**.
- Primary CTA: **coral `#EF5E4E`** (website token `clay-100`), full-width pill, white bold text (e.g. "Show 167,760 properties", "Turn on alerts").
- Secondary button: light grey pill (`#EDEDF0`-like), black text with icon (Call, WhatsApp, "See agent properties").
- Active state: coral icon + coral label (tab bar), or pink-tinted pill (selected "Saved" chip).
- Inactive chips: grey pill, grey text + outline icon.
- Icons: solid black (tab bar, info rows), coral outline in round white buttons (Upfront costs, Rent vs buy, View on map).
- Currency: the **new UAE dirham symbol** (D with two bars) before the number: `[AED] 124,998 /year`.
- Units: **m²** by default (Metric), switchable in settings.
- Dark mode supported (Appearance: System).
- Soft, large shadows under floating elements; some glass/blur on overlays.

### Navigation
- **Floating pill tab bar** at the bottom (white, shadow): Properties, Activity, Transactions, Account. Active tab gets a grey rounded highlight + coral icon/label.
- Floating secondary actions above the tab bar: "Map", "Collections" (white pill, shadow).
- Top: rounded search pill with a filter icon; round icon buttons (sort, bell, back, share, heart).
- User can move the **search bar to top or bottom** (settings).

### Key components
- **Listing card (results)**: full-width photo with rounded top, "4 days ago" dark pill on photo, carousel dots; price "AED 124,998 yearly" (large bold), heart in a grey circle; "Building | Community, City"; type icon + "Apartment · 1 bed · 2 baths · 85 m²"; two big grey pill buttons Call + WhatsApp.
- **Ad card (developer)**: "AD" label, developer logo in a white circle, "From AED 1M | tagline".
- **Filter chips row**: Bedrooms, Residential, All filters (white pill, icon + chevron).
- **Filters sheet**: search field; segmented Rent / Buy / New projects; toggles (Short term rental, Rent in 12); property type tiles with live counts; list rows "Bedrooms … Any"; sticky coral CTA with result count.
- **Listing detail**: hero photo with "Premium" badge and "1 / 8" counter; white price card with three round action buttons; **sticky agent bar** at the bottom (avatar with SuperAgent badge, name, "Responds within 5 minutes", Call + WhatsApp).
- **Info rows**: icon in a small rounded square + label + value on the right (Response time · 5 mins; No of listings · 12).
- **Transactions list item**: date block (red month "NOV", big day, year), price, "Renewed rental for 12 months", "Building | Community", grey specs line, chevron.
- **KPI card**: label + month, big value with currency, green/red delta "vs Nov 2025", sparkline with soft fill.
- **Empty state**: outline icon, bold title, grey hint, white pill CTA ("Start searching").
- **Promo card**: lavender gradient with indigo round icon, coral pill CTA ("List with SuperAgents").
- **Agent card**: big round photo with indigo SuperAgent badge, "SUPERAGENT" caption, rating "4.2 · 20 ratings", info rows (response time, closed deals, languages), WhatsApp button.
- **Map**: black pill markers ("292 units", "AED 265K"), black dots; floating vertical tool pill (locate, layers, draw area).
- **Permission screen**: illustration with a notification mock, big title, coral CTA + "Not now".
- **Login sheet**: photo grid, "Change living for good" + logo mark, black "Continue with Apple", Google / WhatsApp / Facebook tiles, "Continue with Email".

## Icons & imagery
- Thin line icons (outline, ~1.5px stroke), grey `#707070` or indigo `#3A307F`.
- Logo: coral "P" pin mark (`#EA3934` / `#FD6360`). Do not copy the real logo into deliverables; use name text or a neutral placeholder.

## CSS starter
```css
:root {
  --pf-font: 'Open Sans', system-ui, sans-serif;
  --pf-primary: #EA3934;
  --pf-primary-dark: #97211E;
  --pf-secondary: #3A307F;
  --pf-secondary-dark: #1F1948;
  --pf-secondary-200: #E7E5F4;
  --pf-secondary-100: #F7F7FC;
  --pf-text: #333333;
  --pf-text-2: #707070;
  --pf-border: #E3E3E3;
  --pf-border-strong: #CCCCCC;
  --pf-bg: #FFFFFF;
  --pf-bg-subtle: #F7F7F7;
  --pf-success: #00A663;
  --pf-warning: #F7C55F;
  --pf-error: #CF3151;
  --pf-radius-m: 8px;
  --pf-radius-l: 12px;
  --pf-radius-xl: 16px;
  --pf-radius-full: 9999px;
  --pf-shadow-float: 0 3px 6px rgba(0,0,0,.05), 0 10px 10px rgba(0,0,0,.05), 0 23px 14px rgba(0,0,0,.03);
}
```
