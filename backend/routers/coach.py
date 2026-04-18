import os
import anthropic
from fastapi import APIRouter, HTTPException
try:
    from ..models.nutrition import CoachRequest, CoachResponse  # type: ignore
except ImportError:
    from models.nutrition import CoachRequest, CoachResponse  # type: ignore

router = APIRouter()

SYSTEM_PROMPT = """You are a personal nutrition coach for real life across many lifestyles (travelers, students,
busy parents, shift workers, home cooks, office workers, athletes, and older adults). Your job is to remove
guesswork by giving practical, situation-aware guidance—never generic advice.

Guidelines:
- Be actionable: suggest specific choices the user can make right now (what to order, what to buy, what to cook).
- Adapt to constraints: time, budget, cooking access (kitchen/microwave/no prep), schedule, hunger, and preferences.
- If info is missing, ask up to 2 short clarifying questions OR make a reasonable assumption and state it.
- When given a menu/fridge/options, pick 2–4 best options and provide quick swap ideas (e.g., “ask for sauce on side”).
- Use the user profile/situation context if provided (goals, restrictions, activity level). Keep it concise.
- Safety: If the user asks for medical advice or mentions serious conditions (e.g., diabetes medication, eating disorder),
  give general, non-diagnostic guidance and encourage consulting a clinician.

Output format: short bullets with a brief “why”, then one next step."""


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
