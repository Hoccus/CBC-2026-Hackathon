"""
User profile router: create/update profile and get calculated macro targets.
Profile stored in-memory (replace with DB for production).
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from models.user import UserProfile, UserProfileResponse
from services.nutrition_calc import calculate_bmr, calculate_tdee, calculate_macro_targets

router = APIRouter()

# In-memory store — replace with a database in production
_profile: Optional[UserProfile] = None


def _get_profile() -> Optional[UserProfile]:
    return _profile


@router.get("/", response_model=UserProfileResponse)
async def get_profile():
    """Retrieve the current user profile with calculated macro targets."""
    if _profile is None:
        raise HTTPException(status_code=404, detail="No profile found. Create one with POST /api/profile/")
    return _build_response(_profile)


@router.post("/", response_model=UserProfileResponse)
async def create_or_update_profile(profile: UserProfile):
    """Create or fully replace the user profile."""
    global _profile
    _profile = profile
    return _build_response(_profile)


@router.patch("/restrictions")
async def update_dietary_restrictions(restrictions: list[str]):
    """Update only the dietary restrictions on the existing profile."""
    global _profile
    if _profile is None:
        raise HTTPException(status_code=404, detail="No profile found. Create one first.")
    _profile.dietary_restrictions = restrictions
    return {"dietary_restrictions": _profile.dietary_restrictions}


@router.get("/macros")
async def get_macro_targets():
    """Return calculated daily macro targets for the current profile."""
    if _profile is None:
        raise HTTPException(status_code=404, detail="No profile found. Create one first.")
    resp = _build_response(_profile)
    return {
        "macro_targets": resp.macro_targets,
        "bmr": resp.bmr,
        "tdee": resp.tdee,
        "goal": _profile.goal,
    }


def _build_response(profile: UserProfile) -> UserProfileResponse:
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
