import uuid
from fastapi import APIRouter
from models.nutrition import MealLog, MealLogResponse

router = APIRouter()

# In-memory store — replace with a database
_meals: dict[str, MealLogResponse] = {}


@router.post("/log", response_model=MealLogResponse)
async def log_meal(meal: MealLog):
    meal_id = str(uuid.uuid4())
    entry = MealLogResponse(
        id=meal_id,
        description=meal.description,
        location=meal.location,
        notes=meal.notes,
    )
    _meals[meal_id] = entry
    return entry


@router.get("/", response_model=list[MealLogResponse])
async def list_meals():
    return list(_meals.values())
