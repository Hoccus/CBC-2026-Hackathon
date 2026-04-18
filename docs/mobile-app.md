# Mobile App (React Native / Expo)

A parallel iOS/Android app that hits the same FastAPI backend. Built with Expo so demo devices can run it instantly via the **Expo Go** app — no Xcode, no Android Studio, no app store.

The mobile app is feature-equivalent to the web frontend (white/monochrome theme, same data model) and uses native components where they matter: a floating liquid-glass (BlurView) bottom tab bar, Ionicons, and an iOS SegmentedControl on the Track screen.

## Screens

- **Dashboard** — greeting, today's macro progress bars, today's meals, quick actions
- **Coach** — chat with the AI nutrition coach; context picker (airport, hotel, etc.)
- **Track** — take/pick a photo + optional description → macros, add to today's log
- **Restaurants** — geolocates the user, queries Overpass API for nearby places, ranks top picks
- **Profile** — age/weight/height/activity + dietary restrictions + auto-calculated goals (Mifflin-St Jeor)

All backend calls hit the existing endpoints (`/api/track/analyze`, `/api/coach/advice`, `/api/restaurants/score`). Profile and meal log are persisted locally via `AsyncStorage` under the keys `nutricoach_profile` and `nutricoach_log`.

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

The app loads live on the phone. Edits to source files hot-reload instantly.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Network request failed" on phone | Phone and laptop not on same WiFi, or `EXPO_PUBLIC_API_URL` still points to `localhost` |
| Backend unreachable | Ensure backend is started with `--host 0.0.0.0` (the run script does this) |
| Camera/library permission denied | Tap **Allow** when prompted; on iOS you may need to toggle it in Settings → Expo Go |
| Location permission denied | Restaurants screen needs location — grant in Settings → Expo Go → Location |
| Tab bar labels cut off by home indicator | Each screen pads content by `useBottomTabBarHeight()`; if a new screen is added, do the same |
| Public WiFi blocks LAN | Use a phone hotspot, or `npx expo start --tunnel` (install `@expo/ngrok` first) |

---

## File layout

```
mobile/
  App.tsx                     # Bottom-tab navigator + BlurView liquid-glass tab bar
  src/
    config.ts                 # API_BASE from EXPO_PUBLIC_API_URL
    theme.ts                  # colors, radius, typography (mirrors web CSS vars)
    navigation.ts             # RootTabParamList
    storage.ts                # AsyncStorage helpers (profile + meal log)
    types.ts                  # Profile, MealEntry, MacroResult, ScoredRestaurant
    screens/
      HomeScreen.tsx          # Dashboard
      CoachScreen.tsx         # Chat + context picker
      TrackScreen.tsx         # Photo/text → macros (SegmentedControl)
      RestaurantsScreen.tsx   # Geolocation → Overpass → ranked picks
      ProfileScreen.tsx       # BMR/TDEE + restrictions + goals
```

## Native components in use

- `expo-blur` — `BlurView` with `tint="systemChromeMaterialLight"` for the floating tab bar
- `@expo/vector-icons` — Ionicons for tab icons (filled when active, outline when inactive)
- `@react-native-segmented-control/segmented-control` — iOS segmented control on Track
- `react-native-safe-area-context` — `SafeAreaView` with `edges={['top']}` on every screen
- `@react-navigation/bottom-tabs` — `useBottomTabBarHeight` for content padding under the floating bar
- `expo-image-picker` — camera + library access for Track
- `expo-location` — foreground permission + coordinates for Restaurants
