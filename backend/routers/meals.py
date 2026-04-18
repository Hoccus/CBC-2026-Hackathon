import uuid
import os
import base64
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import anthropic
try:
    from ..models.nutrition import MealLog, MealLogResponse, MacroEstimate  # type: ignore
except ImportError:
    from models.nutrition import MealLog, MealLogResponse, MacroEstimate  # type: ignore

router = APIRouter()

_meals: dict[str, MealLogResponse] = {}

ANALYZE_PROMPT = """You are a nutrition expert. Analyze the food provided and estimate macronutrients for the portion shown.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "fiber_g": <number>,
  "food_identified": "<brief description of what you identified>",
  "confidence": "<low|medium|high>",
  "notes": "<any caveats about portion size or estimation>"
}}

If portion size is unclear, estimate for a typical single serving. Be realistic.{context}"""


@router.post("/analyze", response_model=MacroEstimate)
async def analyze_meal(
    image: Optional[UploadFile] = File(None),
    description: Optional[str] = Form(None),
):
    if not image and not description:
        raise HTTPException(status_code=422, detail="Provide an image, a description, or both.")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    context = f"\n\nUser description: {description}" if description else ""
    prompt = ANALYZE_PROMPT.format(context=context)

    content: list = []

    if image:
        image_bytes = await image.read()
        media_type = image.content_type or "image/jpeg"
        b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": b64},
        })

    content.append({"type": "text", "text": prompt})

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": content}],
    )

    raw = message.content[0].text.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail=f"Unexpected response from AI: {raw}")

    return MacroEstimate(**data)


@router.post("/log", response_model=MealLogResponse)
async def log_meal(meal: MealLog):
    meal_id = str(uuid.uuid4())
    entry = MealLogResponse(
        id=meal_id,
        description=meal.description,
        location=meal.location,
        notes=meal.notes,
        macros=meal.macros,
    )
    _meals[meal_id] = entry
    return entry


@router.get("/", response_model=list[MealLogResponse])
async def list_meals():
    return list(_meals.values())
