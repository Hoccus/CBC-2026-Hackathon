from fastapi import APIRouter, HTTPException
from datetime import date
from models.nutrition import UserProfile, MacroTargets, MacroResponse, FoodLog
from calculations import calculate_macros
from database import db

router = APIRouter()


@router.post("/calculate-macros", response_model=MacroResponse)
def calculate_user_macros(profile: UserProfile):
    """
    Calculate daily macronutrient targets based on user profile.
    
    Uses Mifflin-St Jeor equation for BMR/TDEE calculation and applies:
    - Protein: 2.0g per kg of body weight
    - Fat: 25% of total daily calories
    - Carbs: Remaining calories
    
    Returns structured JSON ready for LLM injection.
    """
    try:
        # Calculate macro targets
        macro_targets = calculate_macros(profile)
        
        # Store targets in database for today
        db.set_daily_targets({
            'calories': macro_targets.calories,
            'protein_g': macro_targets.protein_g,
            'carbs_g': macro_targets.carbs_g,
            'fat_g': macro_targets.fat_g
        })
        
        # Get current tracking data
        tracking_data = db.get_daily_tracking()
        
        if tracking_data is None:
            # Initialize if no data exists
            current_macros = {
                "consumed": {
                    "calories": 0,
                    "protein_g": 0,
                    "carbs_g": 0,
                    "fat_g": 0
                },
                "target": {
                    "calories": macro_targets.calories,
                    "protein_g": macro_targets.protein_g,
                    "carbs_g": macro_targets.carbs_g,
                    "fat_g": macro_targets.fat_g
                },
                "remaining": {
                    "calories": macro_targets.calories,
                    "protein_g": macro_targets.protein_g,
                    "carbs_g": macro_targets.carbs_g,
                    "fat_g": macro_targets.fat_g
                }
            }
        else:
            current_macros = {
                "consumed": tracking_data["consumed"],
                "target": tracking_data["target"],
                "remaining": tracking_data["remaining"]
            }
        
        return MacroResponse(
            user_profile=profile,
            daily_targets=macro_targets,
            current_macros=current_macros
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating macros: {str(e)}")


@router.post("/log-food")
def log_food_intake(food: FoodLog):
    """
    Log consumed food and update daily macro tracking.
    
    Automatically updates the remaining macros for the current day.
    """
    try:
        food_data = {
            'meal_name': food.meal_name,
            'calories': food.calories,
            'protein_g': food.protein_g,
            'carbs_g': food.carbs_g,
            'fat_g': food.fat_g
        }
        
        db.log_food(food_data)
        
        # Return updated tracking data
        tracking_data = db.get_daily_tracking()
        
        if tracking_data is None:
            raise HTTPException(
                status_code=404, 
                detail="No daily targets set. Please calculate macros first."
            )
        
        return {
            "message": "Food logged successfully",
            "tracking": tracking_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging food: {str(e)}")


@router.get("/daily-tracking")
def get_daily_tracking():
    """
    Get current day's macro tracking data.
    
    Returns consumed, target, and remaining macros in LLM-ready format.
    """
    tracking_data = db.get_daily_tracking()
    
    if tracking_data is None:
        raise HTTPException(
            status_code=404,
            detail="No tracking data for today. Please calculate macros first."
        )
    
    return tracking_data


@router.get("/daily-tracking/{tracking_date}")
def get_daily_tracking_by_date(tracking_date: str):
    """
    Get specific date's macro tracking data.
    
    Date format: YYYY-MM-DD
    """
    tracking_data = db.get_daily_tracking(tracking_date)
    
    if tracking_data is None:
        raise HTTPException(
            status_code=404,
            detail=f"No tracking data found for {tracking_date}"
        )
    
    return tracking_data
