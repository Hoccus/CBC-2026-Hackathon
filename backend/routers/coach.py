import os
import anthropic
from fastapi import APIRouter, HTTPException
try:
    from ..models.nutrition import CoachRequest, CoachResponse  # type: ignore
except ImportError:
    from models.nutrition import CoachRequest, CoachResponse  # type: ignore

router = APIRouter()

SYSTEM_PROMPT = """You are a personal nutrition coach for a national correspondent who travels constantly,
works odd hours, and often eats on the go. Your advice must be practical and actionable for real-world
situations — not generic tips. When the user describes what's available (fridge contents, a restaurant menu,
airport options), give specific meal suggestions with brief reasoning. Keep responses concise."""


@router.post("/advice", response_model=CoachResponse)
async def get_advice(req: CoachRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    parts = []
    if req.profile_context:
        parts.append(f"[User Profile: {req.profile_context}]")
    if req.context:
        parts.append(f"[Situation: {req.context}]")
    parts.append(req.message)
    user_message = "\n".join(parts)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    return CoachResponse(advice=message.content[0].text, suggestions=[])
