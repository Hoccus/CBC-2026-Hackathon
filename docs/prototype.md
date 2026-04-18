# NutriCoach Design Prototype (`/prototype`)

An interactive, iOS-framed mockup of the "on the road" NutriCoach concept — ported from a Claude Design HTML export into the Next.js frontend. Dark theme, travel-journalist accent colors, Maya Chen (NBC national correspondent) persona, pre-scripted data.

**Not wired to the backend.** All content is fake: the schedule, food options, coach thread, and logged meals live in [frontend/src/components/prototype/data.ts](../frontend/src/components/prototype/data.ts). Use it for design review, stakeholder demos, and as a visual spec when porting to the mobile app.

## Where

- Route: `http://localhost:3000/prototype` (run `cd frontend && npm run dev`)
- Entry: [frontend/src/app/prototype/page.tsx](../frontend/src/app/prototype/page.tsx)
- The global Nav bar is hidden on this route ([frontend/src/components/Nav.tsx](../frontend/src/components/Nav.tsx)) so the iOS frame owns the viewport.

## What's in it

Five screens + two overlays, all inside a scaled 402×874 iOS device frame:

| Screen / overlay | Highlights |
|---|---|
| **Dashboard** | "Lunch in 28 min · Grown is 4 min walk" travel context banner; weekly nutrition with 7 columns × 4 macros; next-up schedule (meal windows open the coach); Expenditure / Weight-trend sparkline cards |
| **Plan** | Remaining-macros strip; full-day timeline with meal windows expanded into ranked restaurant options (score badge, ETA, macros) |
| **Food log** | Totals strip; logged entries with per-macro colored numbers and a `📸 PHOTO` vs quick-add source tag |
| **More** | Maya Chen profile card; travel-nutrition stat grid (on-target days, airport meals, cities, weight delta); settings list |
| **Coach overlay** | Calendar context chip, pre-written user/coach messages, rich suggestion cards with `ScoreBadge`, quick-prompt chips, composer |
| **Log sheet (FAB)** | Four log methods (photo, voice, search, quick-add) + photo-estimate flow with "HIGH CONFIDENCE" result card |

## Design tokens

- **Background**: `#0a0a0a` (app), `rgba(255,255,255,0.04)` (surface), `rgba(255,255,255,0.06)` (borders)
- **Macros** (stable, not themed): `MACRO.cal #6B8AFD`, `MACRO.p #E25D2C`, `MACRO.f #F5C54B`, `MACRO.c #55C08C`
- **Accent** (themed via Tweaks): default `#E8A83B` Prime Amber; also Wire Orange, Broadcast Red, Beltway Green, Press Blue
- **Display type**: Barlow Condensed (uppercase, 0.01em tracking) or Space Grotesk (mixed case, -0.025em) — toggled in Tweaks
- **Body type**: Inter

## Tweaks panel

Click **TWEAKS** (top-right) to toggle the design-control panel:

- **Accent swatches** — live-update the accent used by the travel banner, coach bubbles, meal-window cards, FAB outline, and dots on the Plan timeline
- **Display type** — swaps Barlow Condensed ↔ Space Grotesk for every `<Display>` (headers) and for the Dashboard `12:47`-style time numerals

Choices persist in `localStorage` under `nc_theme`. Active tab persists under `nc_tab`.

## File layout

```
frontend/src/app/prototype/
  layout.tsx              # Google Fonts <link>s for Barlow Condensed, Space Grotesk, Inter
  page.tsx                # App: iOS frame, scale-to-fit, tab state, coach/log overlays, Tweaks toggle

frontend/src/components/prototype/
  data.ts                 # USER, SCHEDULE, FOOD_OPTIONS, LOGGED, COACH_THREAD, MACRO
  atoms.tsx               # ThemeCtx, I (icon map), Display, ScoreBadge, Column, MacroBar
  screens.tsx             # Dashboard, CoachScreen, PlanScreen, LogScreen, MoreScreen
  shell.tsx               # IOSStatusBar, TabBar (w/ FAB), LogSheet, TweaksPanel
```

## Mobile port status

Phase 1 (UI port) is **shipped** in [mobile/](../mobile/) — the React Native app now matches this prototype's look. See [docs/mobile-app.md](mobile-app.md) for the screen-by-screen rundown and Phase 2 backend-wiring punch list. Notable departures from the web prototype:

- The mobile app has no iOS device frame — it runs on the real device.
- The tab bar is **Dashboard / Food Log / [FAB] / Restaurants / More** (Plan moved to a stack-pushed screen reachable from Dashboard) so the user's working Google Places `RestaurantsScreen` keeps a top-level slot.
- `TweaksPanel` (accent / display-type swap) is web-only — not ported.
