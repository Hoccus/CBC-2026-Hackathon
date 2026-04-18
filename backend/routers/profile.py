"""
User profile router.

This module supports two complementary flows:
1) A full lifestyle profile used by several "smart" routers (places/macros/schedule) via `_get_profile()`.
2) A lightweight macro-calculation endpoint (`/calculate-macros`) used by the current web onboarding UI.

Both are kept for backward compatibility while the project evolves.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from models.user import UserProfile as LifestyleProfile, UserProfileResponse
from services.nutrition_calc import calculate_bmr, calculate_tdee, calculate_macro_targets

from models.nutrition import (
    UserProfile as MacroCalcProfile,
    MacroResponse,
    FoodLog,
)
from calculations import calculate_macros
from database import db

router = APIRouter()

# In-memory store — replace with a database in production
_profile: Optional[LifestyleProfile] = None


def _get_profile() -> Optional[LifestyleProfile]:
    return _profile


@router.get("/", response_model=UserProfileResponse)
async def get_profile():
    """Retrieve the current lifestyle profile with calculated macro targets."""
    if _profile is None:
        raise HTTPException(status_code=404, detail="No profile found. Create one with POST /api/profile/")
    return _build_response(_profile)


@router.post("/", response_model=UserProfileResponse)
async def create_or_update_profile(profile: LifestyleProfile):
    """Create or fully replace the lifestyle profile."""
    global _profile
    _profile = profile
    return _build_response(_profile)


@router.patch("/restrictions")
async def update_dietary_restrictions(restrictions: list[str]):
    """Update only the dietary restrictions on the existing lifestyle profile."""
    global _profile
    if _profile is None:
        raise HTTPException(status_code=404, detail="No profile found. Create one first.")
    _profile.dietary_restrictions = restrictions
    return {"dietary_restrictions": _profile.dietary_restrictions}


@router.get("/macros")
async def get_macro_targets():
    """Return calculated daily macro targets for the current lifestyle profile."""
    if _profile is None:
        raise HTTPException(status_code=404, detail="No profile found. Create one first.")
    resp = _build_response(_profile)
    return {
        "macro_targets": resp.macro_targets,
        "bmr": resp.bmr,
        "tdee": resp.tdee,
        "goal": _profile.goal,
    }


def _build_response(profile: LifestyleProfile) -> UserProfileResponse:
    bmr = calculate_bmr(profile.weight_kg, profile.height_cm, profile.age, profile.gender)
    tdee = calculate_tdee(bmr, profile.activity_level)
    targets = calculate_macro_targets(tdee, profile.goal, profile.weight_kg)

    return UserProfileResponse(
        name=profile.name,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        age=profile.age,
        gender=profile.gender,
        activity_level=profile.activity_level,
        goal=profile.goal,
        dietary_restrictions=profile.dietary_restrictions,
        preferred_cuisines=profile.preferred_cuisines,
        macro_targets=targets,
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
    )


@router.post("/calculate-macros", response_model=MacroResponse)
def calculate_user_macros(profile: MacroCalcProfile):
    """
    Calculate daily macro targets based on a simplified macro profile.

    This is the endpoint used by `frontend/src/app/profile/page.tsx`.
    """
    try:
        macro_targets = calculate_macros(profile)

        db.set_daily_targets(
            {
                "calories": macro_targets.calories,
                "protein_g": macro_targets.protein_g,
                "carbs_g": macro_targets.carbs_g,
                "fat_g": macro_targets.fat_g,
            }
        )

        tracking_data = db.get_daily_tracking()

        if tracking_data is None:
            current_macros = {
                "consumed": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0},
                "target": {
                    "calories": macro_targets.calories,
                    "protein_g": macro_targets.protein_g,
                    "carbs_g": macro_targets.carbs_g,
                    "fat_g": macro_targets.fat_g,
                },
                "remaining": {
                    "calories": macro_targets.calories,
                    "protein_g": macro_targets.protein_g,
                    "carbs_g": macro_targets.carbs_g,
                    "fat_g": macro_targets.fat_g,
                },
            }
        else:
            current_macros = {
                "consumed": tracking_data["consumed"],
                "target": tracking_data["target"],
                "remaining": tracking_data["remaining"],
            }

        return MacroResponse(user_profile=profile, daily_targets=macro_targets, current_macros=current_macros)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating macros: {str(e)}")


@router.post("/log-food")
def log_food_intake(food: FoodLog):
    """Log consumed food and update daily macro tracking."""
    try:
        db.log_food(
            {
                "meal_name": food.meal_name,
                "calories": food.calories,
                "protein_g": food.protein_g,
                "carbs_g": food.carbs_g,
                "fat_g": food.fat_g,
            }
        )

        tracking_data = db.get_daily_tracking()
        if tracking_data is None:
            raise HTTPException(status_code=404, detail="No daily targets set. Please calculate macros first.")

        return {"message": "Food logged successfully", "tracking": tracking_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging food: {str(e)}")


@router.get("/daily-tracking")
def get_daily_tracking():
    """Get current day's macro tracking data."""
    tracking_data = db.get_daily_tracking()
    if tracking_data is None:
        raise HTTPException(status_code=404, detail="No tracking data for today. Please calculate macros first.")
    return tracking_data


@router.get("/daily-tracking/{tracking_date}")
def get_daily_tracking_by_date(tracking_date: str):
    """Get a specific date's macro tracking data (YYYY-MM-DD)."""
    tracking_data = db.get_daily_tracking(tracking_date)
    if tracking_data is None:
        raise HTTPException(status_code=404, detail=f"No tracking data found for {tracking_date}")
    return tracking_data
