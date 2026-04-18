"""
OpenAI GPT service for nutrition coaching, food analysis, and health scoring.
Uses GPT-4o which supports both text and image inputs.
"""
import os
import json
from typing import Optional
from openai import OpenAI


def _client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


def get_coach_response(
    user_message: str,
    context: Optional[str] = None,
    user_profile_summary: Optional[str] = None,
    dietary_restrictions: Optional[list[str]] = None,
) -> str:
    """
    Generate a contextual nutrition coaching response.
    """
    system_parts = [
        "You are a personal nutrition coach for a busy professional who travels constantly, "
        "works odd hours, and eats on the go. Give practical, actionable advice tied to "
        "the specific situation — not generic tips. When the user describes what's available "
        "(a restaurant menu, airport food court, hotel minibar), suggest specific items with "
        "brief nutritional reasoning. Be concise."
    ]
    if user_profile_summary:
        system_parts.append(f"\nUser profile: {user_profile_summary}")
    if dietary_restrictions:
        system_parts.append(f"\nDietary restrictions: {', '.join(dietary_restrictions)}")

    user_content = user_message
    if context:
        user_content = f"[Location/context: {context}]\n{user_message}"

    resp = _client().chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "\n".join(system_parts)},
            {"role": "user", "content": user_content},
        ],
        max_tokens=800,
        temperature=0.7,
    )
    return resp.choices[0].message.content or ""


def analyze_food_image(
    description: str,
    image_base64: Optional[str] = None,
    meal_type: Optional[str] = None,
) -> dict:
    """
    Use GPT-4o Vision to estimate macros from a food photo + description.
    Returns a structured dict with calories, macros, and breakdown.
    """
    system_prompt = (
        "You are a registered dietitian specializing in nutritional analysis. "
        "Given a food description and/or image, estimate the macronutrient content as accurately as possible. "
        "Respond ONLY with valid JSON matching this schema:\n"
        "{\n"
        '  "calories": float,\n'
        '  "protein_g": float,\n'
        '  "carbs_g": float,\n'
        '  "fat_g": float,\n'
        '  "fiber_g": float,\n'
        '  "sugar_g": float,\n'
        '  "sodium_mg": float,\n'
        '  "confidence": "high"|"medium"|"low",\n'
        '  "breakdown": [\n'
        '    {"ingredient": str, "estimated_amount": str, "calories": float, "protein_g": float, "carbs_g": float, "fat_g": float}\n'
        "  ],\n"
        '  "health_notes": str\n'
        "}\n"
        "Base estimates on standard portion sizes. If information is limited, set confidence to 'low'."
    )

    meal_label = f" ({meal_type})" if meal_type else ""
    user_text = f"Analyze this food{meal_label}: {description}"

    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    if image_base64:
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": user_text},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                },
            ],
        })
    else:
        messages.append({"role": "user", "content": user_text})

    resp = _client().chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore[arg-type]
        max_tokens=1000,
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    raw = resp.choices[0].message.content or "{}"
    return json.loads(raw)


def score_restaurant(
    restaurant_name: str,
    cuisine_types: list[str],
    sample_menu_items: list[str],
    user_restrictions: Optional[list[str]] = None,
    user_goal: Optional[str] = None,
) -> dict:
    """
    Use GPT-4o to generate a health score and summary for a restaurant.
    Returns structured JSON with score, recommendations, and dietary options.
    """
    system_prompt = (
        "You are a nutrition expert. Given a restaurant's name, cuisine, and sample menu items, "
        "produce a health assessment. Respond ONLY with valid JSON:\n"
        "{\n"
        '  "overall_health_score": float (0-100),\n'
        '  "ai_summary": str (2-3 sentences),\n'
        '  "recommended_items": [str],\n'
        '  "items_to_avoid": [str],\n'
        '  "macro_friendly": bool,\n'
        '  "dietary_options": [str]\n'
        "}"
    )

    parts = [
        f"Restaurant: {restaurant_name}",
        f"Cuisine types: {', '.join(cuisine_types) if cuisine_types else 'unknown'}",
    ]
    if sample_menu_items:
        parts.append(f"Sample menu items: {', '.join(sample_menu_items[:20])}")
    if user_restrictions:
        parts.append(f"User dietary restrictions: {', '.join(user_restrictions)}")
    if user_goal:
        parts.append(f"User goal: {user_goal}")

    resp = _client().chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "\n".join(parts)},
        ],
        max_tokens=600,
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    raw = resp.choices[0].message.content or "{}"
    return json.loads(raw)


def plan_meal_schedule(
    date: str,
    appointments: list[dict],
    meal_windows: list[dict],
    nearby_options: dict[str, list[dict]],
    user_profile_summary: Optional[str] = None,
    dietary_restrictions: Optional[list[str]] = None,
) -> str:
    """
    Generate a narrative meal plan given appointments, time windows, and nearby restaurant options.
    Returns a daily summary string.
    """
    system_prompt = (
        "You are a nutrition coach helping a busy professional plan their meals around their schedule. "
        "Given their appointments, meal windows, and nearby restaurant options, create a practical "
        "meal plan. Be specific about what to order. Keep it concise and actionable."
    )

    content_parts = [f"Date: {date}"]
    if user_profile_summary:
        content_parts.append(f"User: {user_profile_summary}")
    if dietary_restrictions:
        content_parts.append(f"Dietary restrictions: {', '.join(dietary_restrictions)}")

    content_parts.append("\nAppointments:")
    for appt in appointments:
        content_parts.append(f"  - {appt['title']} at {appt['address']} ({appt['start_time']} – {appt['end_time']})")

    content_parts.append("\nMeal windows and nearby options:")
    for window in meal_windows:
        meal_type = window["meal_type"]
        content_parts.append(f"\n{meal_type.capitalize()} window: {window['window_start']}–{window['window_end']}")
        options = nearby_options.get(meal_type, [])
        if options:
            for opt in options[:3]:
                content_parts.append(f"  - {opt['name']} ({opt.get('address', '')}), rating: {opt.get('rating', 'N/A')}")
        else:
            content_parts.append("  - No nearby options found")

    resp = _client().chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "\n".join(content_parts)},
        ],
        max_tokens=800,
        temperature=0.6,
    )
    return resp.choices[0].message.content or ""
