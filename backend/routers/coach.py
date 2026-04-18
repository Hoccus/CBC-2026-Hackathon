"""
Coach router: real-time nutrition advice via Anthropic Claude.
Injects user profile (dietary restrictions, goals) into the system prompt.
"""
import os

import anthropic
from fastapi import APIRouter, HTTPException
from models.nutrition import CoachRequest, CoachResponse

router = APIRouter()


@router.post("/advice", response_model=CoachResponse)
async def get_advice(req: CoachRequest):
    system_parts = [
        "You are a personal nutrition coach for a busy professional who travels constantly, "
        "works odd hours, and eats on the go. Give practical, actionable advice tied to "
        "the specific situation — not generic tips. When the user describes what's available "
        "(a restaurant menu, airport food court, hotel minibar), suggest specific items with "
        "brief nutritional reasoning. Be concise."
    ]
    if req.profile_context:
        system_parts.append(f"\nUser profile: {req.profile_context}")

    user_content = req.message
    if req.context:
        user_content = f"[Location/context: {req.context}]\n{req.message}"

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system="\n".join(system_parts),
            messages=[{"role": "user", "content": user_content}],
        )
        advice = message.content[0].text
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {e}")

    return CoachResponse(advice=advice, suggestions=[])
