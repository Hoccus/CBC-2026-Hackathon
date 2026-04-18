from pydantic import BaseModel, Field
from typing import Optional, List


class Appointment(BaseModel):
    title: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_time: str = Field(..., description="ISO 8601 datetime, e.g. '2026-04-18T09:00:00'")
    end_time: str = Field(..., description="ISO 8601 datetime, e.g. '2026-04-18T10:30:00'")


class MealWindow(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    window_start: str  # e.g. "07:00"
    window_end: str    # e.g. "09:00"
    available_minutes: int
    reference_location: str  # address near which to search


class RestaurantRecommendation(BaseModel):
    place_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    rating: Optional[float] = None
    open_during_window: bool
    distance_meters: Optional[float] = None
    recommended_items: List[str] = []
    health_score: Optional[float] = None


class MealPlanItem(BaseModel):
    meal_type: str
    recommended_time: str
    meal_window: MealWindow
    nearby_restaurants: List[RestaurantRecommendation]
    ai_recommendation: str


class SchedulePlanRequest(BaseModel):
    appointments: List[Appointment]
    current_latitude: float
    current_longitude: float
    current_address: Optional[str] = None
    date: str = Field(..., description="YYYY-MM-DD")


class SchedulePlanResponse(BaseModel):
    date: str
    meal_plan: List[MealPlanItem]
    daily_summary: str
