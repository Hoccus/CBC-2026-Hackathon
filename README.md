# Macro Foundation & Tracking MVP

A health-tech application for traveling national correspondents to calculate and track daily macronutrient targets.

## Project Structure

```
macro-tracker/
├── backend/          # FastAPI backend
│   ├── main.py       # API endpoints
│   ├── models.py     # Pydantic models
│   ├── calculations.py  # BMR/TDEE calculations
│   ├── database.py   # SQLite database
│   └── requirements.txt
└── frontend/         # Next.js frontend
    ├── app/          # Next.js app directory
    ├── components/   # React components
    └── package.json
```

## Features

### Backend (FastAPI)
- ✅ Pydantic models for UserProfile and MacroTargets
- ✅ Mifflin-St Jeor equation for BMR/TDEE calculation
- ✅ Macro-split logic (2.0g protein/kg, 25% fat, remaining carbs)
- ✅ POST `/calculate-macros` endpoint
- ✅ SQLite database for tracking daily macros
- ✅ LLM-ready JSON output format

### Frontend (Next.js)
- ✅ Onboarding form with Tailwind CSS
- ✅ Travel Intensity selector (1.2, 1.375, 1.55 multipliers)
- ✅ Macro Dashboard with circular progress bars
- ✅ "Remaining Today" summary card
- ✅ Mobile-responsive design
- ✅ Lucide-react icons

## Quick Start

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend will run on `http://localhost:8000`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

- `POST /calculate-macros` - Calculate daily macro targets
- `POST /log-food` - Log consumed food
- `GET /daily-tracking` - Get current day's tracking data
- `GET /daily-tracking/{date}` - Get specific date's tracking data

## API Documentation

Interactive API docs available at: `http://localhost:8000/docs`

## Technology Stack

- **Backend**: FastAPI, Pydantic, SQLite
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React

## Calculations

### BMR (Mifflin-St Jeor Equation)
- **Men**: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
- **Women**: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

### TDEE
- TDEE = BMR × Activity Multiplier

### Macros
- **Protein**: 2.0g per kg of body weight
- **Fat**: 25% of total daily calories
- **Carbs**: Remaining calories

### Goal Adjustments
- **Lose Weight**: 15% calorie deficit
- **Maintain**: TDEE calories
- **Gain Weight**: 10% calorie surplus

## LLM Integration

The API returns data in a structured format ready for LLM injection:

```json
{
  "consumed": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
  "target": { "calories": 2000, "protein_g": 140, "carbs_g": 225, "fat_g": 55 },
  "remaining": { "calories": 2000, "protein_g": 140, "carbs_g": 225, "fat_g": 55 }
}
```

## License

MIT
