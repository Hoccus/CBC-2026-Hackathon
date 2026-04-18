# Mobile Phase 2 — Backend Wiring TODO

Phase 1 (UI port) is shipped: the React Native app matches the [/prototype](prototype.md) design end-to-end with fake data. Phase 2 swaps the fake `mobile/src/data.ts` consumers for real backend calls.

This doc is the punch list. Each item names the screen, the endpoint, the file to touch, and the rough scope. Tackle them in any order — the screens are independent.

## Endpoint inventory (already shipped on the backend)

| Method | Path                              | Source                                       |
|--------|-----------------------------------|----------------------------------------------|
| POST   | `/api/coach/advice`               | [coach.py](../backend/routers/coach.py)       |
| POST   | `/api/track/analyze`              | [track.py](../backend/routers/track.py)       |
| POST   | `/api/meals/analyze`              | [meals.py](../backend/routers/meals.py)       |
| POST   | `/api/meals/log`                  | [meals.py](../backend/routers/meals.py)       |
| GET    | `/api/meals/`                     | [meals.py](../backend/routers/meals.py)       |
| POST   | `/api/places/nearby`              | [places.py](../backend/routers/places.py)     |
| POST   | `/api/restaurants/score`          | [restaurants.py](../backend/routers/restaurants.py) |
| POST   | `/api/schedule/plan`              | [schedule.py](../backend/routers/schedule.py) |
| GET    | `/api/profile/`                   | [profile.py](../backend/routers/profile.py)   |
| POST   | `/api/profile/`                   | [profile.py](../backend/routers/profile.py)   |
| GET    | `/api/macros/today`               | [macros.py](../backend/routers/macros.py)     |
| GET    | `/api/macros/history`             | [macros.py](../backend/routers/macros.py)     |
| POST   | `/api/macros/log`                 | [macros.py](../backend/routers/macros.py)     |

Interactive docs while the backend is running: <http://localhost:8000/docs>.

---

## Quick wins (existing endpoints, no backend changes)

### 1. Coach chat → `POST /api/coach/advice`
- **File:** [mobile/src/screens/CoachScreen.tsx](../mobile/src/screens/CoachScreen.tsx)
- **Replace:** the static `COACH_THREAD` from `data.ts` with `useState<CoachMessage[]>` seeded with the context bubble.
- **Wire:** the send button (currently no-op) to POST `{ message, context }` and append both the user message and the assistant reply to the thread. Stream is fine — the endpoint is non-streaming today.
- **Reference impl:** the unrouted [TrackScreen.tsx](../mobile/src/screens/TrackScreen.tsx) has the existing `fetch(API_BASE/...)` pattern.

### 2. Food Log entries → `GET /api/meals/`
- **File:** [mobile/src/screens/FoodLogScreen.tsx](../mobile/src/screens/FoodLogScreen.tsx)
- **Replace:** `LOGGED` import from `data.ts` with a `useFocusEffect` that fetches today's meals.
- **Map:** server `MealLogResponse` → the screen's `LoggedMeal` shape (icon picker can stay client-side, or pick `🍽️` for everything until we add a category field).
- **Bonus:** `AsyncStorage` already has `nutricoach_log` from [mobile/src/storage.ts](../mobile/src/storage.ts) — decide whether the source of truth is the server or local. Recommend server-first with local as cache.

### 3. LogSheet photo flow → `POST /api/track/analyze`
- **File:** [mobile/src/components/LogSheet.tsx](../mobile/src/components/LogSheet.tsx)
- **Replace:** the hard-coded "Harvest chicken bowl / 580 kcal" result with the response from `/api/track/analyze`.
- **Wire:** the **Photo + describe** option should open `expo-image-picker` (already a dep), POST the image + description, and show real macros + confidence in the result card.
- **Confirm:** the `Log at 13:20 · Centennial Park` button → `POST /api/meals/log`.
- **Reference impl:** the unrouted [TrackScreen.tsx](../mobile/src/screens/TrackScreen.tsx) already does the image-picker + analyze + log flow — copy its logic.

### 4. Plan timeline → `POST /api/schedule/plan`
- **File:** [mobile/src/screens/PlanScreen.tsx](../mobile/src/screens/PlanScreen.tsx)
- **Replace:** the static `SCHEDULE` + `FOOD_OPTIONS` with a single call to `/api/schedule/plan` that returns meal windows + ranked restaurant recommendations per window.
- **Required input:** an appointment list. For now, ship `data.ts`'s `SCHEDULE` filtered to `kind !== 'meal' && kind !== 'travel'` as the appointment payload — this gives a real plan for fake calendar data. Calendar integration (Item 8) replaces the input later.

### 5. Dashboard weekly nutrition → `GET /api/meals/` (client-aggregate)
- **File:** [mobile/src/screens/HomeScreen.tsx](../mobile/src/screens/HomeScreen.tsx)
- **Replace:** the `weekData` constant with a fetch of `/api/meals?days=7` (or the existing endpoint with date filtering — confirm the schema), then bucket by day and divide each day's `cal/p/f/c` totals by the user's goals.
- **Use:** `getProfile()` from [mobile/src/storage.ts](../mobile/src/storage.ts) for the goal denominators (or `GET /api/profile/`).

### 6. Dashboard "Next up today" → reuse Plan call
- Same fetch as Item 4. Take the next 4 non-past items from `/api/schedule/plan`'s response.

### 7. More → Maya Chen profile + goals → `GET /api/profile/`
- **File:** [mobile/src/screens/MoreScreen.tsx](../mobile/src/screens/MoreScreen.tsx)
- **Replace:** the hard-coded "Maya Chen / NBC News / Atlanta bureau" + "182 days on the road" header with profile fields. Travel-nutrition stat grid can stay fake until Item 9.
- **Wire:** the settings list rows (currently no-op `TouchableOpacity`s) to push profile edit screens. The unrouted [ProfileScreen.tsx](../mobile/src/screens/ProfileScreen.tsx) has the goal-recalc form.

---

## New backend work

### 8. Calendar integration (powers Dashboard banner + Plan + Coach context)
- The hero "Lunch in 28 min · Centennial Park" banner needs the user's actual calendar to be useful. Two paths:
  - **Path A — local input only.** Add a screen where the user pastes / picks today's appointments (or imports an `.ics`). Persist via `AsyncStorage` and pass into `/api/schedule/plan`.
  - **Path B — Google / iOS Calendar OAuth.** Add an `/api/calendar/today` backend endpoint that returns appointments for the signed-in user. Mobile calls it on Dashboard mount, then forwards the result to `/api/schedule/plan`.
- **Recommendation:** ship Path A first for the demo (1 evening of work). Path B is a real feature — add it after the hackathon if needed.

### 9. Travel-nutrition aggregates (powers More stat grid)
- "78% on-target days · 43 airport meals · 12 cities · -4.1 lbs since Jan" — none of these exist server-side.
- Add a `GET /api/macros/travel-stats` endpoint that aggregates over `meals` + a new (or existing) location/airport tag. Cheapest version: derive "airport meals" from meal `description` substrings; compute "on-target days" by comparing `/api/macros/history` daily totals to the profile goals.
- Skip until everything else above is wired — this is decoration.

---

## Cleanup once Phase 2 lands

- Delete unrouted `mobile/src/screens/TrackScreen.tsx` and `mobile/src/screens/ProfileScreen.tsx` once their logic has been copied into `LogSheet` / `MoreScreen`.
- Delete the now-fake exports from `mobile/src/data.ts` (`SCHEDULE`, `FOOD_OPTIONS`, `LOGGED`, `COACH_THREAD`). Keep `USER` only if the More screen still needs a fallback.
- Update [docs/mobile-app.md](mobile-app.md)'s "Backend wiring" status table as items flip from 🟡 → ✅.
