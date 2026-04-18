# Mobile App (React Native / Expo)

A parallel iOS/Android app that hits the same FastAPI backend. Built with Expo so demo devices can run it instantly via the **Expo Go** app — no Xcode, no Android Studio, no app store.

The mobile app now matches the web [design prototype at `/prototype`](prototype.md) — dark `#0a0a0a` theme, Barlow Condensed display type, Maya Chen "national correspondent" persona. **Phase 1 (UI port) is done; Phase 2 (wire fake screens to the backend) is partially complete** — see "Backend wiring" below.

## Screens & navigation

The bottom tab bar shows four tabs plus a centered FAB:

| Tab / route | What it shows |
|---|---|
| **Dashboard** (`HomeScreen`) | Travel context banner ("Lunch in 28 min · Centennial Park"), weekly nutrition columns × 4 macros, "Next up today" schedule, sparkline insight cards |
| **Food Log** (`FoodLogScreen`) | Today's macro totals + logged meal entries with `📸 PHOTO` source tags |
| **[FAB]** | Opens the **LogSheet** bottom modal (photo / voice / search / quick-add → photo-estimate result) |
| **Restaurants** (`RestaurantsScreen`) | Real Google Places search + AI scoring (see Backend wiring) |
| **More** (`MoreScreen`) | Maya Chen profile, travel-nutrition stat grid, settings list |

Two screens live above the tab navigator:

- **Plan** (`PlanScreen`) — pushed onto the stack from Dashboard's "Full day" link or any meal-window tap. Timeline of today's calendar with meal windows expanded into ranked food options.
- **Coach** (`CoachScreen`) — full-screen modal that slides up. Reachable from the Dashboard travel banner ("Ask coach") and from "MEAL WINDOW" cards.

## Backend wiring

| Screen / feature | Status | Endpoint |
|---|---|---|
| Restaurants | ✅ Live | `POST /api/places/nearby`, `POST /api/restaurants/score`, OSM Nominatim geocoding |
| Coach chat | 🟡 Fake thread | `POST /api/coach/advice` (to wire) |
| Food Log entries | 🟡 Fake | `GET /api/meals` (to wire) + AsyncStorage |
| LogSheet → photo estimate | 🟡 Fake | `POST /api/track/analyze` (to wire — old `TrackScreen.tsx` has the working logic) |
| Dashboard weekly columns | 🟡 Fake | client-side aggregation of `/api/meals` (to wire) |
| Dashboard travel banner | ❌ No backend | Needs calendar + location + scoring combined |
| Plan timeline | 🟡 Fake | `POST /api/schedule/plan` (to wire — endpoint exists, takes appointments) |
| More travel-nutrition stats | ❌ No backend | New aggregates needed |

See [docs/mobile-phase2.md](mobile-phase2.md) for the full Phase 2 wiring punch list.

Profile and meal log are persisted locally via `AsyncStorage` under `nutricoach_profile` and `nutricoach_log`.

The pre-prototype screens (`TrackScreen.tsx`, `ProfileScreen.tsx`) are still on disk but unrouted — keep them around as reference for Phase 2 wiring patterns.

---

## First-time setup

### 1. Install Expo Go on the demo phone

- **iPhone:** App Store → "Expo Go"
- **Android:** Play Store → "Expo Go"

### 2. Make sure the phone and your laptop are on the same WiFi

Expo Go connects to Metro Bundler over the LAN.

### 3. Configure the backend URL

When Expo Go runs on a phone, `localhost` refers to the *phone*, not your laptop. You must use your computer's LAN IP.

Find your LAN IP:
```bash
ipconfig getifaddr en0       # macOS (WiFi)
```

Create `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.X.X:8000
```

### 4. Install dependencies
```bash
cd mobile
npm install
```

---

## Running the demo

You need **two processes**: the backend (bound to `0.0.0.0` so the phone can reach it) and Expo.

**Terminal 1 — backend:**
```bash
./backend/run.sh   # already binds to 0.0.0.0:8000
```

**Terminal 2 — mobile:**
```bash
cd mobile
npx expo start --lan
```

A QR code will print in the terminal. On the phone:

- **iPhone:** open the Camera app, point it at the QR code, tap the notification
- **Android:** open Expo Go → "Scan QR code"

The app loads live on the phone. Edits to source files hot-reload instantly. The first launch will take ~30s while @expo-google-fonts download Barlow Condensed / Space Grotesk / Inter.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Network request failed" on phone | Phone and laptop not on same WiFi, or `EXPO_PUBLIC_API_URL` still points to `localhost` |
| Backend unreachable | Ensure backend is started with `--host 0.0.0.0` (the run script does this) |
| Restaurants screen returns `GOOGLE_PLACES_API_KEY` error | Set `GOOGLE_PLACES_API_KEY` in `backend/.env` and restart |
| Camera/library permission denied | Tap **Allow** when prompted; on iOS toggle in Settings → Expo Go |
| Location permission denied | Restaurants needs location — Settings → Expo Go → Location |
| App stuck on a black screen with a spinner | Fonts haven't downloaded yet on first launch — give it ~30s |
| Public WiFi blocks LAN | Use a phone hotspot, or `npx expo start --tunnel` (install `@expo/ngrok` first) |
| Port 8081 in use | `npx expo start --port 8082` |

---

## File layout

```
mobile/
  App.tsx                          # Stack { MainTabs, Plan, Coach (modal) } + font loader
  src/
    config.ts                      # API_BASE from EXPO_PUBLIC_API_URL
    theme.ts                       # Dark palette, MACRO colors, FONTS map
    data.ts                        # Fake Maya Chen data (mirrors web prototype)
    navigation.ts                  # RootStackParamList + RootTabParamList
    storage.ts                     # AsyncStorage helpers (profile + meal log)
    types.ts                       # Profile, MealEntry, MacroResult, ScoredRestaurant
    components/
      atoms.tsx                    # Display, DisplayNum, ScoreBadge, Column, MacroBar, ICONS
      CustomTabBar.tsx             # Search input + 4 tabs + centered FAB
      LogSheet.tsx                 # Bottom sheet from FAB (menu → photo estimate)
    screens/
      HomeScreen.tsx               # Dashboard
      FoodLogScreen.tsx            # Food log
      RestaurantsScreen.tsx        # Google Places + scoring (real backend)
      MoreScreen.tsx               # Profile + travel stats + settings
      PlanScreen.tsx               # Stack-pushed timeline
      CoachScreen.tsx              # Full-screen modal chat
      TrackScreen.tsx              # ⚠️ unrouted — kept for Phase 2 photo wiring
      ProfileScreen.tsx            # ⚠️ unrouted — kept for Phase 2 profile/goal wiring
```

## Native libraries in use

- `@expo-google-fonts/barlow-condensed`, `@expo-google-fonts/space-grotesk`, `@expo-google-fonts/inter` + `expo-font` — display + body type
- `expo-linear-gradient` — Dashboard travel banner, More avatar, LogSheet photo gradient
- `react-native-svg` — Dashboard insight sparklines
- `expo-blur` — kept available; the dark theme uses solid surfaces instead of BlurView for now
- `@expo/vector-icons` — Ionicons mapped via `ICONS` in `components/atoms.tsx`
- `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` — Plan/Coach as stack screens, custom dark tab bar
- `react-native-safe-area-context` — `SafeAreaView` with `edges={['top']}` on every screen
- `expo-image-picker` — camera + library access (still wired in unrouted `TrackScreen.tsx`)
- `expo-location` + `@react-native-community/slider` — `RestaurantsScreen` GPS + radius
