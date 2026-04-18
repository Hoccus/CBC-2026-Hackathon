# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Problem Statement

A real-time nutrition coaching tool for a national correspondent who travels constantly, works odd hours, and eats on the go. The app gives practical, situation-aware advice ("here's what to pick from this airport menu") rather than generic dietary rules.

## Tech Stack

- **Frontend**: Next.js 15 (TypeScript, App Router) — `frontend/`
- **Backend**: FastAPI (Python) — `backend/`
- **AI**: Anthropic Codex via the `anthropic` Python SDK

## Development Commands

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add ANTHROPIC_API_KEY
uvicorn main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
```

Next.js rewrites `/api/*` to the FastAPI backend at `localhost:8000`, so both servers must run together during development.

## Architecture

```
frontend/src/app/
  page.tsx           # Home — links to coach and meal log
  coach/page.tsx     # Chat UI → POST /api/coach/advice
  meals/page.tsx     # Meal log UI → GET/POST /api/meals

backend/
  main.py            # FastAPI app, CORS, router registration
  routers/
    coach.py         # POST /api/coach/advice — calls Codex with a travel-aware system prompt
    meals.py         # GET/POST /api/meals — in-memory meal log (replace with DB)
  models/
    nutrition.py     # Pydantic request/response models
```

The coach router passes a `context` field (e.g. "at the airport") alongside the user's message to Codex so advice is situation-specific.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `backend/.env` | Codex API access |
