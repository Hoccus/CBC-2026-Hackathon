from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import coach, meals, places, profile, macros, schedule

app = FastAPI(title="NutriCoach API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(coach.router,    prefix="/api/coach",    tags=["coach"])
app.include_router(meals.router,    prefix="/api/meals",    tags=["meals"])
app.include_router(places.router,   prefix="/api/places",   tags=["places"])
app.include_router(profile.router,  prefix="/api/profile",  tags=["profile"])
app.include_router(macros.router,   prefix="/api/macros",   tags=["macros"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])


@app.get("/health")
def health():
    return {"status": "ok"}
