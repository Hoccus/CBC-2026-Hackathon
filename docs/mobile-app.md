# Mobile App (React Native / Expo)

A parallel iOS/Android app that hits the same FastAPI backend. Built with Expo so demo devices can run it instantly via the **Expo Go** app — no Xcode, no Android Studio, no app store.

## Screens

- **Home** — tiled navigation
- **Track** — take/pick a photo + optional description → macros (the killer demo)
- **Coach** — chat with the AI nutrition coach
- **Restaurants** — paste a list of nearby places → AI picks the top 5

All three features call the existing backend endpoints (`/api/track/analyze`, `/api/coach/advice`, `/api/restaurants/score`).

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
| Public WiFi blocks LAN | Use a phone hotspot, or `npx expo start --tunnel` (install `@expo/ngrok` first) |

---

## File layout

```
mobile/
  App.tsx                     # NavigationContainer + stack
  src/
    config.ts                 # API_BASE from EXPO_PUBLIC_API_URL
    theme.ts                  # colors
    navigation.ts             # RootStackParamList
    screens/
      HomeScreen.tsx
      TrackScreen.tsx         # photo → macros
      CoachScreen.tsx         # chat
      RestaurantsScreen.tsx   # ranked picks
```
