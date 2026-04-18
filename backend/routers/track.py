import base64
import json
import os
import re

import anthropic
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter()


class MacroEstimate(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    description: str
    health_notes: str


@router.post("/analyze", response_model=MacroEstimate)
async def analyze_meal(
    description: str = Form(""),
    image: UploadFile | None = File(None),
):
    if not description and (not image or not image.filename):
        raise HTTPException(status_code=400, detail="Provide a description or image.")

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    content: list = []

    if image and image.filename:
        img_bytes = await image.read()
        img_b64 = base64.standard_b64encode(img_bytes).decode()
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": image.content_type or "image/jpeg",
                "data": img_b64,
            },
        })

    text = "Estimate the nutritional content of this meal."
    if description:
        text += f" Description: {description}"
    text += (
        '\n\nRespond ONLY with valid JSON:\n'
        '{"calories": 450, "protein_g": 25.5, "carbs_g": 40.0, "fat_g": 15.0, '
        '"description": "brief meal name", "health_notes": "1-2 sentence health assessment"}'
    )
    content.append({"type": "text", "text": text})

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": content}],
    )

    raw = message.content[0].text
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="Could not parse nutrition response.")
    return MacroEstimate(**json.loads(match.group()))
