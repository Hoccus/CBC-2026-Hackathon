"""
Places router: nearby restaurant search and AI-powered health scoring.
Uses Google Places API for discovery and Spoonacular + OpenAI for menu analysis.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models.places import NearbyPlacesRequest, NearbyPlacesResponse, RestaurantAnalysis
from services import google_places, spoonacular, openai_service
from routers.profile import _get_profile

router = APIRouter()


@router.post("/nearby", response_model=NearbyPlacesResponse)
async def nearby_restaurants(req: NearbyPlacesRequest):
    """Find restaurants near a given lat/lng using Google Places."""
    try:
        return google_places.search_nearby_restaurants(
            latitude=req.latitude,
            longitude=req.longitude,
            radius=req.radius,
            keyword=req.keyword,
            open_now=req.open_now,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Places error: {e}")


@router.get("/nearby", response_model=NearbyPlacesResponse)
async def nearby_restaurants_get(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius: int = Query(default=1500),
    keyword: Optional[str] = Query(default=None),
    open_now: bool = Query(default=False),
):
    """GET version of nearby restaurant search (useful for browser testing)."""
    try:
        return google_places.search_nearby_restaurants(
            latitude=latitude,
            longitude=longitude,
            radius=radius,
            keyword=keyword,
            open_now=open_now,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Places error: {e}")


@router.get("/{place_id}/analyze", response_model=RestaurantAnalysis)
async def analyze_restaurant(place_id: str, cuisine_hint: Optional[str] = Query(default=None)):
    """
    Get an AI-generated health score and menu recommendations for a restaurant.

    1. Fetches place details from Google Places (name, types).
    2. Searches Spoonacular for matching menu items to get nutritional data.
    3. Passes everything to GPT-4o for a health summary.
    """
    # Step 1: place details
    try:
        details = google_places.get_place_details(place_id)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Places error: {e}")

    name = details.get("name", "Unknown Restaurant")
    types = details.get("types", [])
    cuisine_types = [t.replace("_", " ") for t in types if t not in ("food", "point_of_interest", "establishment")]

    # Step 2: search Spoonacular for menu items by restaurant name / cuisine
    search_query = cuisine_hint or name
    try:
        menu_items = spoonacular.search_menu_items(search_query, limit=15)
    except ValueError:
        menu_items = []  # Spoonacular key not set — degrade gracefully
    except Exception:
        menu_items = []

    menu_item_names = [item.name for item in menu_items if item.name]

    # Step 3: GPT-4o health score + summary
    profile = _get_profile()
    user_restrictions = profile.dietary_restrictions if profile else None
    user_goal = profile.goal.value if profile else None

    try:
        scored = openai_service.score_restaurant(
            restaurant_name=name,
            cuisine_types=cuisine_types,
            sample_menu_items=menu_item_names,
            user_restrictions=user_restrictions,
            user_goal=user_goal,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    return RestaurantAnalysis(
        place_id=place_id,
        name=name,
        cuisine_types=cuisine_types,
        overall_health_score=scored.get("overall_health_score", 50.0),
        ai_summary=scored.get("ai_summary", ""),
        recommended_items=scored.get("recommended_items", []),
        items_to_avoid=scored.get("items_to_avoid", []),
        macro_friendly=scored.get("macro_friendly", False),
        dietary_options=scored.get("dietary_options", []),
        sample_menu_items=menu_items[:8],
    )
