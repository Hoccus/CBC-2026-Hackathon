"""
Schedule router: plan meals around a day's appointments.

Given a list of appointments with locations and times, this router:
1. Calculates meal windows (gaps between appointments).
2. Searches for nearby restaurants during each window using Google Places.
3. Asks GPT-4o to write a personalised meal plan.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException

from models.schedule import (
    Appointment,
    MealWindow,
    MealPlanItem,
    RestaurantRecommendation,
    SchedulePlanRequest,
    SchedulePlanResponse,
)
from services import google_places, openai_service
from routers.profile import _get_profile

router = APIRouter()

# Ideal meal time windows (hour of day)
MEAL_WINDOWS = {
    "breakfast": (6, 10),
    "lunch": (11, 14),
    "dinner": (17, 21),
    "snack": (14, 17),
}


def _parse_dt(s: str) -> datetime:
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse datetime: {s}")


def _find_meal_windows(appointments: list[Appointment], date: str) -> list[MealWindow]:
    """
    Identify free time slots between appointments that align with meal times.
    Returns a list of MealWindow objects with the nearest appointment address as reference.
    """
    date_prefix = date  # YYYY-MM-DD

    # Build sorted list of busy intervals
    intervals: list[tuple[datetime, datetime, str]] = []
    for appt in appointments:
        try:
            start = _parse_dt(appt.start_time)
            end = _parse_dt(appt.end_time)
            intervals.append((start, end, appt.address))
        except ValueError:
            continue

    intervals.sort(key=lambda x: x[0])

    windows: list[MealWindow] = []
    seen_meals: set[str] = set()

    for meal_type, (meal_start_h, meal_end_h) in MEAL_WINDOWS.items():
        meal_start = datetime.strptime(f"{date_prefix} {meal_start_h:02d}:00", "%Y-%m-%d %H:%M")
        meal_end = datetime.strptime(f"{date_prefix} {meal_end_h:02d}:00", "%Y-%m-%d %H:%M")

        # Find a free block within the meal window
        free_start = meal_start
        ref_address = ""
        for appt_start, appt_end, addr in intervals:
            if appt_start <= free_start < appt_end:
                free_start = appt_end  # push past this appointment
                ref_address = addr
            if free_start >= meal_end:
                break

        if free_start >= meal_end:
            continue  # no free time in this meal window

        # How long is the free slot?
        next_busy = meal_end
        for appt_start, appt_end, addr in intervals:
            if appt_start > free_start:
                next_busy = min(next_busy, appt_start)
                if not ref_address:
                    ref_address = addr
                break

        available_minutes = int((next_busy - free_start).total_seconds() / 60)
        if available_minutes < 20:
            continue  # not enough time to eat

        if not ref_address and intervals:
            ref_address = intervals[0][2]

        windows.append(
            MealWindow(
                meal_type=meal_type,
                window_start=free_start.strftime("%H:%M"),
                window_end=next_busy.strftime("%H:%M"),
                available_minutes=available_minutes,
                reference_location=ref_address,
            )
        )
        seen_meals.add(meal_type)

    return windows


@router.post("/plan", response_model=SchedulePlanResponse)
async def plan_meals(req: SchedulePlanRequest):
    """
    Generate a meal plan for the day based on appointments and location.
    """
    profile = _get_profile()

    # 1. Compute meal windows
    windows = _find_meal_windows(req.appointments, req.date)
    if not windows:
        windows = [
            MealWindow(
                meal_type="lunch",
                window_start="12:00",
                window_end="13:00",
                available_minutes=60,
                reference_location=req.current_address or f"{req.current_latitude},{req.current_longitude}",
            )
        ]

    # 2. Search nearby restaurants for each window
    meal_plan_items: list[MealPlanItem] = []
    nearby_by_meal: dict[str, list[dict]] = {}

    for window in windows:
        try:
            result = google_places.search_nearby_restaurants(
                latitude=req.current_latitude,
                longitude=req.current_longitude,
                radius=1000,
                open_now=True,
            )
            places = result.places[:5]
        except Exception:
            places = []

        recs: list[RestaurantRecommendation] = [
            RestaurantRecommendation(
                place_id=p.place_id,
                name=p.name,
                address=p.address,
                latitude=p.latitude,
                longitude=p.longitude,
                rating=p.rating,
                open_during_window=True,
                distance_meters=p.distance_meters,
            )
            for p in places
        ]

        nearby_by_meal[window.meal_type] = [
            {"name": p.name, "address": p.address, "rating": p.rating}
            for p in places
        ]

        meal_plan_items.append(
            MealPlanItem(
                meal_type=window.meal_type,
                recommended_time=window.window_start,
                meal_window=window,
                nearby_restaurants=recs,
                ai_recommendation="",  # filled in below
            )
        )

    # 3. GPT-4o narrative plan
    profile_summary = None
    restrictions = None
    if profile:
        profile_summary = (
            f"{profile.name or 'User'}, {profile.age}yo {profile.gender.value}, "
            f"goal: {profile.goal.value}, activity: {profile.activity_level.value}"
        )
        restrictions = profile.dietary_restrictions

    try:
        appts_dicts = [
            {"title": a.title, "address": a.address, "start_time": a.start_time, "end_time": a.end_time}
            for a in req.appointments
        ]
        windows_dicts = [
            {"meal_type": w.meal_type, "window_start": w.window_start, "window_end": w.window_end}
            for w in windows
        ]
        daily_summary = openai_service.plan_meal_schedule(
            date=req.date,
            appointments=appts_dicts,
            meal_windows=windows_dicts,
            nearby_options=nearby_by_meal,
            user_profile_summary=profile_summary,
            dietary_restrictions=restrictions,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    # Distribute the narrative across meal plan items as individual recommendations
    for item in meal_plan_items:
        item.ai_recommendation = daily_summary  # full summary on each; frontend can filter

    return SchedulePlanResponse(
        date=req.date,
        meal_plan=meal_plan_items,
        daily_summary=daily_summary,
    )
