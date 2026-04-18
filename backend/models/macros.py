from pydantic import BaseModel, Field
from typing import Optional, List


class MacroAnalysisRequest(BaseModel):
    description: str = Field(..., description="Text description of the meal/food")
    image_base64: Optional[str] = Field(default=None, description="Base64-encoded image of the food")
    meal_type: Optional[str] = Field(default=None, description="breakfast, lunch, dinner, or snack")


class NutritionBreakdown(BaseModel):
    ingredient: str
    estimated_amount: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class MacroAnalysisResponse(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    confidence: str = Field(..., description="high, medium, or low")
    breakdown: List[NutritionBreakdown] = []
    health_notes: str


class MacroLogEntry(BaseModel):
    description: str
    meal_type: Optional[str] = None
    image_base64: Optional[str] = None


class MacroLogDirect(BaseModel):
    description: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0
    health_notes: str = ""
    meal_type: Optional[str] = None


class MacroLogResponse(BaseModel):
    id: str
    timestamp: str
    description: str
    meal_type: Optional[str]
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    health_notes: str


class DailyMacroSummary(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_fiber_g: float
    meal_count: int
    entries: List[MacroLogResponse]
    progress_vs_targets: Optional[dict] = None  # populated if user profile exists
