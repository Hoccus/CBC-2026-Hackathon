import json
import os
import re

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class Restaurant(BaseModel):
    name: str
    cuisine: str = ""
    amenity: str = "restaurant"


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


class RestaurantResponse(BaseModel):
    suggestions: list[ScoredRestaurant]


@router.post("/score", response_model=RestaurantResponse)
async def score_restaurants(req: RestaurantRequest):
    if not req.restaurants:
        raise HTTPException(status_code=400, detail="No restaurants provided.")

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    items = "\n".join(
        f"- {r.name} ({r.cuisine or r.amenity})" for r in req.restaurants[:20]
    )
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

    data = json.loads(match.group())
    return RestaurantResponse(suggestions=[ScoredRestaurant(**r) for r in data])
