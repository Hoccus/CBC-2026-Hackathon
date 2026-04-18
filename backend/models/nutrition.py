from pydantic import BaseModel
from typing import Optional


class CoachRequest(BaseModel):
    message: str
    context: Optional[str] = None


class CoachResponse(BaseModel):
    advice: str
    suggestions: list[str] = []


class MacroEstimate(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    food_identified: str
    confidence: str  # "low" | "medium" | "high"
    notes: Optional[str] = None


class MealLog(BaseModel):
    description: str
    location: Optional[str] = None
    notes: Optional[str] = None
    macros: Optional[MacroEstimate] = None


class MealLogResponse(BaseModel):
    id: str
    description: str
    location: Optional[str]
    notes: Optional[str]
    macros: Optional[MacroEstimate] = None

