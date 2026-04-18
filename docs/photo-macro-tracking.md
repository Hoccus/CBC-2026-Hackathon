# Photo Macro Tracking API

Estimate nutritional macros from a food photo, a text description, or both.

## Endpoint

```
POST /api/meals/analyze
```

Accepts `multipart/form-data`. Both fields are optional, but at least one must be provided.

| Field | Type | Required |
|---|---|---|
| `image` | file (jpg/png) | optional |
| `description` | string | optional |

### Response

```json
{
  "calories": 780.0,
  "protein_g": 42.0,
  "carbs_g": 48.0,
  "fat_g": 45.0,
  "fiber_g": 2.0,
  "food_identified": "Gourmet cheeseburger on a brioche bun",
  "confidence": "low | medium | high",
  "notes": "Estimates assume a 6oz patty..."
}
```

## Examples

**Image only**
```bash
curl -X POST http://localhost:8000/api/meals/analyze \
  -F "image=@burger.png"
```

**Description only**
```bash
curl -X POST http://localhost:8000/api/meals/analyze \
  -F "description=two scrambled eggs and toast with butter"
```

**Image + description (most accurate)**
```bash
curl -X POST http://localhost:8000/api/meals/analyze \
  -F "image=@burger.png" \
  -F "description=large portion, added extra cheese"
```

---

## Log a Meal with Macros

After analyzing, save the meal to the log:

```
POST /api/meals/log
Content-Type: application/json
```

```json
{
  "description": "burger",
  "location": "airport",
  "notes": "was hungry",
  "macros": {
    "calories": 780,
    "protein_g": 42,
    "carbs_g": 48,
    "fat_g": 45,
    "fiber_g": 2,
    "food_identified": "cheeseburger on brioche",
    "confidence": "medium",
    "notes": "estimated for 6oz patty"
  }
}
```

```bash
curl -X POST http://localhost:8000/api/meals/log \
  -H "Content-Type: application/json" \
  -d '{"description":"burger","location":"airport","macros":{"calories":780,"protein_g":42,"carbs_g":48,"fat_g":45,"fiber_g":2,"food_identified":"cheeseburger","confidence":"medium"}}'
```

## List All Logged Meals

```bash
curl http://localhost:8000/api/meals/
```

---

## Interactive Docs

With the server running, visit [http://localhost:8000/docs](http://localhost:8000/docs) to explore and test all endpoints in the browser.

## Related: `/api/track/analyze`

The web and mobile frontends actually call a sibling endpoint at `POST /api/track/analyze` (see [backend/routers/track.py](../backend/routers/track.py)). Same multipart input, but a simpler response tailored for UI:

```json
{
  "calories": 780,
  "protein_g": 42.0,
  "carbs_g": 48.0,
  "fat_g": 45.0,
  "description": "cheeseburger on brioche",
  "health_notes": "High in saturated fat; balance with lighter meals today."
}
```

Use `/api/meals/analyze` when you want confidence/fiber/estimation-notes fields; use `/api/track/analyze` for the streamlined UI payload.

## Running the Backend

**Requirements:** Python 3.9+.

**First time — one command:**
```bash
./backend/setup.sh
```
This creates `backend/.venv`, installs all dependencies, and copies `.env.example` to `.env`. Edit `backend/.env` and set your `ANTHROPIC_API_KEY`.

**Start the server:**
```bash
./backend/run.sh
```

Server runs at http://localhost:8000. Interactive docs at http://localhost:8000/docs.

**Manual setup (if you prefer):**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add ANTHROPIC_API_KEY
uvicorn main:app --reload
```

> **Note for Windows users:** the `.sh` scripts require a bash shell (Git Bash, WSL, or similar). On native Windows PowerShell, follow the manual steps but replace activation with `.\.venv\Scripts\Activate.ps1`.
