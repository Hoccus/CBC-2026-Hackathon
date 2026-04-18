import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import calendar, coach, macros, meals, places, profile, restaurants, schedule, track

app = FastAPI(title="NutriCoach API", version="0.2.0")
frontend_origin = os.getenv("FRONTEND_APP_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(coach.router, prefix="/api/coach", tags=["coach"])
app.include_router(meals.router, prefix="/api/meals", tags=["meals"])
app.include_router(places.router, prefix="/api/places", tags=["places"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(macros.router, prefix="/api/macros", tags=["macros"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(track.router, prefix="/api/track", tags=["track"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])


@app.get("/health")
def health():
    return {"status": "ok"}
