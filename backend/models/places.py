from pydantic import BaseModel, Field
from typing import Optional, List


class NearbyPlacesRequest(BaseModel):
    latitude: float
    longitude: float
    radius: int = Field(default=1500, gt=0, le=50000, description="Search radius in meters")
    keyword: Optional[str] = Field(default=None, description="e.g. 'healthy food', 'salad', 'sushi'")
    open_now: bool = Field(default=False, description="Filter to only currently open places")


class PlaceResult(BaseModel):
    place_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    rating: Optional[float] = None
    price_level: Optional[int] = None  # 0-4: free, inexpensive, moderate, expensive, very expensive
    open_now: Optional[bool] = None
    types: List[str] = []
    distance_meters: Optional[float] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None


class NearbyPlacesResponse(BaseModel):
    places: List[PlaceResult]
    total: int


class MenuItemNutrition(BaseModel):
    name: str
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    health_score: Optional[float] = None  # 0-100


class RestaurantAnalysis(BaseModel):
    place_id: str
    name: str
    cuisine_types: List[str] = []
    overall_health_score: float = Field(..., ge=0, le=100)
    ai_summary: str
    recommended_items: List[str]
    items_to_avoid: List[str]
    macro_friendly: bool
    dietary_options: List[str]  # e.g. ["vegetarian", "gluten-free options"]
    sample_menu_items: List[MenuItemNutrition] = []
