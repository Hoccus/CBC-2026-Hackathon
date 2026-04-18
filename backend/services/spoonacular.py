"""
Spoonacular API wrapper for menu item search and nutritional data.
Docs: https://spoonacular.com/food-api/docs
"""
import os
import requests
from typing import Optional
from models.places import MenuItemNutrition


SPOON_BASE = "https://api.spoonacular.com"


def search_menu_items(
    query: str,
    min_calories: Optional[float] = None,
    max_calories: Optional[float] = None,
    min_protein: Optional[float] = None,
    max_fat: Optional[float] = None,
    limit: int = 10,
) -> list[MenuItemNutrition]:
    """
    Search Spoonacular's restaurant menu item database.
    Returns items with their nutritional data.
    """
    api_key = os.getenv("SPOONACULAR_API_KEY")
    if not api_key:
        raise ValueError("SPOONACULAR_API_KEY not set")

    params: dict = {
        "query": query,
        "number": limit,
        "apiKey": api_key,
    }
    if min_calories is not None:
        params["minCalories"] = min_calories
    if max_calories is not None:
        params["maxCalories"] = max_calories
    if min_protein is not None:
        params["minProtein"] = min_protein
    if max_fat is not None:
        params["maxFat"] = max_fat

    resp = requests.get(f"{SPOON_BASE}/food/menuItems/search", params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    items: list[MenuItemNutrition] = []
    for item in data.get("menuItems", []):
        nutrition = item.get("nutrition", {})
        nutrients = {n["name"].lower(): n["amount"] for n in nutrition.get("nutrients", [])}

        calories = nutrients.get("calories")
        protein = nutrients.get("protein")
        carbs = nutrients.get("carbohydrates")
        fat = nutrients.get("fat")
        fiber = nutrients.get("fiber")

        # Simple health score: protein density + low fat proportion
        health_score = None
        if calories and calories > 0 and protein is not None:
            protein_pct = (protein * 4 / calories) * 100
            fat_pct = ((fat or 0) * 9 / calories) * 100
            health_score = min(100, max(0, protein_pct * 1.5 - fat_pct * 0.3 + 30))

        items.append(
            MenuItemNutrition(
                name=item.get("title", ""),
                calories=calories,
                protein_g=protein,
                carbs_g=carbs,
                fat_g=fat,
                fiber_g=fiber,
                health_score=round(health_score, 1) if health_score is not None else None,
            )
        )

    return items


def get_ingredient_nutrition(ingredient_name: str, amount_grams: float = 100) -> dict:
    """Get nutrition facts for a single ingredient by name."""
    api_key = os.getenv("SPOONACULAR_API_KEY")
    if not api_key:
        raise ValueError("SPOONACULAR_API_KEY not set")

    params = {
        "ingredientName": ingredient_name,
        "amount": amount_grams,
        "unit": "grams",
        "apiKey": api_key,
    }
    resp = requests.get(f"{SPOON_BASE}/food/ingredients/substitutes", params=params, timeout=10)
    # Fall back to search if substitutes doesn't work
    search_params = {"query": ingredient_name, "number": 1, "apiKey": api_key}
    search_resp = requests.get(f"{SPOON_BASE}/food/ingredients/search", params=search_params, timeout=10)
    search_resp.raise_for_status()
    results = search_resp.json().get("results", [])
    if not results:
        return {}

    ingredient_id = results[0]["id"]
    nutrition_params = {
        "amount": amount_grams,
        "unit": "grams",
        "apiKey": api_key,
    }
    nutrition_resp = requests.get(
        f"{SPOON_BASE}/food/ingredients/{ingredient_id}/information",
        params=nutrition_params,
        timeout=10,
    )
    nutrition_resp.raise_for_status()
    return nutrition_resp.json()
