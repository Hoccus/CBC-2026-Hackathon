"""
Macro tracking router.
- Analyze food via photo + description (GPT-4o Vision)
- Log meals
- View today's totals vs. profile targets
"""
import uuid
from datetime import datetime, date
from fastapi import APIRouter, HTTPException
from typing import Optional

from models.macros import (
    MacroAnalysisRequest,
    MacroAnalysisResponse,
    MacroLogEntry,
    MacroLogResponse,
    DailyMacroSummary,
    NutritionBreakdown,
)
from services import openai_service
from routers.profile import _get_profile

router = APIRouter()

# In-memory log — replace with DB in production
_log: list[MacroLogResponse] = []


@router.post("/analyze", response_model=MacroAnalysisResponse)
async def analyze_food(req: MacroAnalysisRequest):
    """
    Estimate macros from a food description and/or photo.
    Photo must be a base64-encoded JPEG or PNG string (no data: prefix needed).
    """
    try:
        result = openai_service.analyze_food_image(
            description=req.description,
            image_base64=req.image_base64,
            meal_type=req.meal_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    breakdown = [
        NutritionBreakdown(**item)
        for item in result.get("breakdown", [])
        if all(k in item for k in ("ingredient", "estimated_amount", "calories", "protein_g", "carbs_g", "fat_g"))
    ]

    return MacroAnalysisResponse(
        calories=result.get("calories", 0),
        protein_g=result.get("protein_g", 0),
        carbs_g=result.get("carbs_g", 0),
        fat_g=result.get("fat_g", 0),
        fiber_g=result.get("fiber_g"),
        sugar_g=result.get("sugar_g"),
        sodium_mg=result.get("sodium_mg"),
        confidence=result.get("confidence", "low"),
        breakdown=breakdown,
        health_notes=result.get("health_notes", ""),
    )


@router.post("/log", response_model=MacroLogResponse)
async def log_meal(req: MacroLogEntry):
    """Analyze and log a meal. Combines analyze + store in one call."""
    try:
        result = openai_service.analyze_food_image(
            description=req.description,
            image_base64=req.image_base64,
            meal_type=req.meal_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    entry = MacroLogResponse(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow().isoformat(),
        description=req.description,
        meal_type=req.meal_type,
        calories=result.get("calories", 0),
        protein_g=result.get("protein_g", 0),
        carbs_g=result.get("carbs_g", 0),
        fat_g=result.get("fat_g", 0),
        fiber_g=result.get("fiber_g") or 0,
        health_notes=result.get("health_notes", ""),
    )
    _log.append(entry)
    return entry


@router.get("/today", response_model=DailyMacroSummary)
async def get_today_macros():
    """Return today's macro totals and a breakdown by meal, plus progress vs profile targets."""
    today = date.today().isoformat()
    today_entries = [e for e in _log if e.timestamp.startswith(today)]

    totals = DailyMacroSummary(
        date=today,
        total_calories=sum(e.calories for e in today_entries),
        total_protein_g=sum(e.protein_g for e in today_entries),
        total_carbs_g=sum(e.carbs_g for e in today_entries),
        total_fat_g=sum(e.fat_g for e in today_entries),
        total_fiber_g=sum(e.fiber_g for e in today_entries),
        meal_count=len(today_entries),
        entries=today_entries,
    )

    profile = _get_profile()
    if profile:
        from services.nutrition_calc import calculate_bmr, calculate_tdee, calculate_macro_targets
        bmr = calculate_bmr(profile.weight_kg, profile.height_cm, profile.age, profile.gender)
        tdee = calculate_tdee(bmr, profile.activity_level)
        targets = calculate_macro_targets(tdee, profile.goal, profile.weight_kg)

        totals.progress_vs_targets = {
            "targets": targets.model_dump(),
            "consumed": {
                "calories": totals.total_calories,
                "protein_g": totals.total_protein_g,
                "carbs_g": totals.total_carbs_g,
                "fat_g": totals.total_fat_g,
                "fiber_g": totals.total_fiber_g,
            },
            "remaining": {
                "calories": max(0, targets.calories - totals.total_calories),
                "protein_g": max(0, targets.protein_g - totals.total_protein_g),
                "carbs_g": max(0, targets.carbs_g - totals.total_carbs_g),
                "fat_g": max(0, targets.fat_g - totals.total_fat_g),
                "fiber_g": max(0, targets.fiber_g - totals.total_fiber_g),
            },
            "percent_complete": {
                "calories": round(totals.total_calories / targets.calories * 100, 1) if targets.calories else 0,
                "protein_g": round(totals.total_protein_g / targets.protein_g * 100, 1) if targets.protein_g else 0,
            },
        }

    return totals


@router.get("/history", response_model=list[MacroLogResponse])
async def get_macro_history(limit: int = 50):
    """Return recent logged meals in reverse chronological order."""
    return list(reversed(_log))[:limit]


@router.delete("/log/{entry_id}")
async def delete_log_entry(entry_id: str):
    """Remove a meal entry from the log."""
    global _log
    before = len(_log)
    _log = [e for e in _log if e.id != entry_id]
    if len(_log) == before:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": entry_id}
