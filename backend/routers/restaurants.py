import json
import os
import re

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.google_places import reverse_geocode_label, search_nearby_restaurants_legacy

router = APIRouter()


class Restaurant(BaseModel):
    name: str
    cuisine: str = ""
    amenity: str = "restaurant"
    address: str | None = None
    maps_url: str | None = None


class RestaurantRequest(BaseModel):
    restaurants: list[Restaurant]
    dietary_restrictions: list[str] = []
    calorie_goal: int = 2000
    context: str = ""


class ScoredRestaurant(BaseModel):
    name: str
    health_score: int
    suggested_order: str
    reasoning: str
    address: str | None = None
    maps_url: str | None = None


class RestaurantResponse(BaseModel):
    suggestions: list[ScoredRestaurant]


class NearbyRestaurantSearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_m: float = 1200
    max_results: int = 15


class NearbyRestaurantResult(BaseModel):
    name: str
    cuisine: str = ""
    amenity: str = "restaurant"
    address: str | None = None
    maps_url: str | None = None


class NearbyRestaurantResponse(BaseModel):
    location_name: str | None = None
    restaurants: list[NearbyRestaurantResult]


@router.post("/nearby", response_model=NearbyRestaurantResponse)
async def nearby_restaurants(req: NearbyRestaurantSearchRequest):
    places = await search_nearby_restaurants_legacy(
        latitude=req.latitude,
        longitude=req.longitude,
        radius_m=req.radius_m,
        max_results=req.max_results,
    )
    location_name = await reverse_geocode_label(req.latitude, req.longitude)

    restaurants: list[NearbyRestaurantResult] = []
    seen: set[str] = set()
    for place in places:
        display_name = ((place.get("displayName") or {}).get("text") or "").strip()
        if not display_name or display_name in seen:
            continue
        seen.add(display_name)
        types = place.get("types") or []
        primary_type = place.get("primaryType") or "restaurant"
        cuisine = _infer_cuisine(types)
        restaurants.append(
            NearbyRestaurantResult(
                name=display_name,
                cuisine=cuisine,
                amenity=primary_type,
                address=place.get("formattedAddress"),
                maps_url=place.get("googleMapsUri"),
            )
        )

    return NearbyRestaurantResponse(location_name=location_name, restaurants=restaurants)


@router.post("/score", response_model=RestaurantResponse)
async def score_restaurants(req: RestaurantRequest):
    if not req.restaurants:
        raise HTTPException(status_code=400, detail="No restaurants provided.")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    items = "\n".join(_format_restaurant_line(r) for r in req.restaurants[:20])
    restrictions = ", ".join(req.dietary_restrictions) or "none"

    prompt = f"""You are a nutrition coach helping someone find the healthiest food nearby.

Nearby places:
{items}

User details:
- Dietary restrictions: {restrictions}
- Daily calorie goal: {req.calorie_goal} kcal
- Context: {req.context or "traveling"}

Choose the TOP 5 best options for this user and give each a health score 1-10.
Reply ONLY with a valid JSON array (no other text):
[{{"name":"Restaurant Name","health_score":8,"suggested_order":"Specific dish or order","reasoning":"Why this is a good choice"}}]

Only use restaurant names exactly as they appear in the list above."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Could not parse restaurant suggestions.")

    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Unexpected response from AI.")

    restaurant_lookup = {restaurant.name: restaurant for restaurant in req.restaurants}
    suggestions = []
    for row in data:
        original = restaurant_lookup.get(row["name"])
        suggestions.append(
            ScoredRestaurant(
                **row,
                address=original.address if original else None,
                maps_url=original.maps_url if original else None,
            )
        )
    return RestaurantResponse(suggestions=suggestions)


def _format_restaurant_line(restaurant: Restaurant) -> str:
    details = restaurant.cuisine or restaurant.amenity
    address = f" - {restaurant.address}" if restaurant.address else ""
    return f"- {restaurant.name} ({details}){address}"


def _infer_cuisine(types: list[str]) -> str:
    for place_type in types:
        if place_type.endswith("_restaurant"):
            return place_type.replace("_restaurant", "").replace("_", " ")
    return ""
