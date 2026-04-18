from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class ActivityLevel(str, Enum):
    sedentary = "sedentary"           # little/no exercise
    lightly_active = "lightly_active"  # light exercise 1-3 days/week
    moderately_active = "moderately_active"  # moderate exercise 3-5 days/week
    very_active = "very_active"       # hard exercise 6-7 days/week
    extra_active = "extra_active"     # very hard exercise / physical job


class DietaryGoal(str, Enum):
    lose_weight = "lose_weight"
    maintain_weight = "maintain_weight"
    gain_muscle = "gain_muscle"
    improve_health = "improve_health"


class UserProfile(BaseModel):
    name: Optional[str] = None
    height_cm: float = Field(..., gt=0, description="Height in centimeters")
    weight_kg: float = Field(..., gt=0, description="Weight in kilograms")
    age: int = Field(..., gt=0, lt=120)
    gender: Gender
    activity_level: ActivityLevel = ActivityLevel.moderately_active
    goal: DietaryGoal = DietaryGoal.maintain_weight
    dietary_restrictions: List[str] = Field(
        default=[],
        description="e.g. ['vegetarian', 'gluten-free', 'nut allergy', 'lactose intolerant']"
    )
    preferred_cuisines: List[str] = Field(default=[], description="e.g. ['mediterranean', 'asian']")


class MacroTargets(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


class UserProfileResponse(BaseModel):
    name: Optional[str]
    height_cm: float
    weight_kg: float
    age: int
    gender: Gender
    activity_level: ActivityLevel
    goal: DietaryGoal
    dietary_restrictions: List[str]
    preferred_cuisines: List[str]
    macro_targets: MacroTargets
    bmr: float
    tdee: float
