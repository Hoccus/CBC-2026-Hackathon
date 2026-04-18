from pydantic import BaseModel
from typing import Optional


class CoachRequest(BaseModel):
    message: str
    context: Optional[str] = None  # e.g. "at home", "on the road", "at a restaurant"


class CoachResponse(BaseModel):
    advice: str
    suggestions: list[str] = []


class MealLog(BaseModel):
    description: str
    location: Optional[str] = None  # e.g. "home", "airport", "hotel"
    notes: Optional[str] = None


class MealLogResponse(BaseModel):
    id: str
    description: str
    location: Optional[str]
    notes: Optional[str]
    nutritional_summary: Optional[str] = None
