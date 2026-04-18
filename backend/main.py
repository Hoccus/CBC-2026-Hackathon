from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import coach, meals, track, restaurants

app = FastAPI(title="NutriCoach API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(coach.router, prefix="/api/coach", tags=["coach"])
app.include_router(meals.router, prefix="/api/meals", tags=["meals"])
app.include_router(track.router, prefix="/api/track", tags=["track"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])


@app.get("/health")
def health():
    return {"status": "ok"}
