# NutriCoach

A real-time nutrition coaching tool for a national correspondent who travels constantly, works odd hours, and eats on the go. Situation-aware advice ("here's what to pick from this airport menu"), photo-based macro tracking, and nearby-restaurant scoring — all powered by Claude.

## Stack

- **Backend:** FastAPI (Python 3.9+) — [backend/](backend/)
- **Web frontend:** Next.js 15 App Router — [frontend/](frontend/)
- **Mobile:** React Native / Expo — [mobile/](mobile/)
- **Design prototype:** iOS-framed hi-fi mockup at [/prototype](frontend/src/app/prototype/page.tsx) (dark mode, travel-journalist persona, fake data) — see [docs/prototype.md](docs/prototype.md)
- **AI:** Anthropic Claude (`claude-sonnet-4-6`) via the `anthropic` Python SDK

## Quick start

```bash
# Backend (first time)
./backend/setup.sh          # creates venv, installs deps, bootstraps .env
# then edit backend/.env and set ANTHROPIC_API_KEY

# Backend (every time)
./backend/run.sh            # http://localhost:8000  (binds 0.0.0.0 for LAN demos)

# Web frontend
cd frontend && npm install && npm run dev    # http://localhost:3000

# Mobile (Expo Go on your phone)
cd mobile && npm install && npx expo start --lan
```

See [docs/mobile-app.md](docs/mobile-app.md) for the full Expo Go demo setup.

## Docs

- [Design prototype (`/prototype`)](docs/prototype.md)
- [Mobile app (Expo / React Native)](docs/mobile-app.md)
- [Photo macro tracking API](docs/photo-macro-tracking.md)
- Interactive API docs: http://localhost:8000/docs when the backend is running

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/coach/advice` | Situation-aware nutrition chat |
| `POST` | `/api/track/analyze` | Photo + text → macros (used by the apps) |
| `POST` | `/api/meals/analyze` | Photo + text → macros with confidence/fiber |
| `POST` | `/api/meals/log` | Log a meal |
| `GET`  | `/api/meals/` | List logged meals |
| `POST` | `/api/restaurants/score` | Score nearby restaurants against user goals |
