"""
Coach router: real-time nutrition advice via OpenAI GPT-4o.
Injects user profile (dietary restrictions, goals) into the system prompt.
"""
from fastapi import APIRouter, HTTPException
from models.nutrition import CoachRequest, CoachResponse
from services import openai_service
from routers.profile import _get_profile

router = APIRouter()


@router.post("/advice", response_model=CoachResponse)
async def get_advice(req: CoachRequest):
    profile = _get_profile()

    profile_summary = None
    restrictions = None
    if profile:
        profile_summary = (
            f"{profile.name or 'User'}, {profile.age}yo {profile.gender.value}, "
            f"{profile.weight_kg}kg, {profile.height_cm}cm, "
            f"goal: {profile.goal.value}, activity: {profile.activity_level.value}"
        )
        restrictions = profile.dietary_restrictions or None

    try:
        advice = openai_service.get_coach_response(
            user_message=req.message,
            context=req.context,
            user_profile_summary=profile_summary,
            dietary_restrictions=restrictions,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    return CoachResponse(advice=advice, suggestions=[])
