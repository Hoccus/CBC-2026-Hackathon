# Macro Tracker Backend

FastAPI backend for calculating and tracking daily macronutrient targets.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Interactive API docs available at: `http://localhost:8000/docs`

## Endpoints

- `POST /calculate-macros` - Calculate daily macro targets
- `POST /log-food` - Log consumed food
- `GET /daily-tracking` - Get current day's tracking data
- `GET /daily-tracking/{date}` - Get specific date's tracking data
