from pydantic import BaseModel, Field
from typing import Literal
from datetime import date

class UserProfile(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Age in years")
    height_cm: float = Field(..., ge=50, le=300, description="Height in centimeters")
    weight_kg: float = Field(..., ge=20, le=500, description="Weight in kilograms")
    gender: Literal["male", "female"] = Field(..., description="Biological gender")
    activity_level: float = Field(..., ge=1.2, le=2.5, description="Activity multiplier (1.2-2.5)")
    goal: Literal["lose", "maintain", "gain"] = Field(..., description="Weight goal")

class MacroTargets(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    bmr: float
    tdee: float

class MacroResponse(BaseModel):
    user_profile: UserProfile
    daily_targets: MacroTargets
    current_macros: dict

class FoodLog(BaseModel):
    calories: float = Field(..., ge=0)
    protein_g: float = Field(..., ge=0)
    carbs_g: float = Field(..., ge=0)
    fat_g: float = Field(..., ge=0)
    meal_name: str = Field(default="", description="Optional meal description")

class DailyTracking(BaseModel):
    date: str
    consumed: dict
    target: dict
    remaining: dict
