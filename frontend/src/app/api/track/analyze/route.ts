import { NextResponse } from "next/server";
import { extractJsonValue, sendAnthropicMessage } from "@/lib/server/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const description = String(formData.get("description") || "").trim();
    const image = formData.get("image");

    if (!description && !(image instanceof File && image.size > 0)) {
      return NextResponse.json(
        { detail: "Provide a description or image." },
        { status: 400 },
      );
    }

    const content: Array<
      | { type: "text"; text: string }
      | {
          type: "image";
          source: { type: "base64"; media_type: string; data: string };
        }
    > = [];

    if (image instanceof File && image.size > 0) {
      const bytes = Buffer.from(await image.arrayBuffer());
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: image.type || "image/jpeg",
          data: bytes.toString("base64"),
        },
      });
    }

    const prompt = [
      "Estimate the nutritional content of this meal.",
      description ? `Description: ${description}` : "",
      'Respond only with valid JSON using this shape: {"calories":450,"protein_g":25.5,"carbs_g":40,"fat_g":15,"description":"brief meal name","health_notes":"1-2 sentence health assessment"}',
    ]
      .filter(Boolean)
      .join("\n\n");

    content.push({ type: "text", text: prompt });

    const raw = await sendAnthropicMessage(content, { maxTokens: 512 });
    const result = extractJsonValue(raw);

    return NextResponse.json(result);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Failed to analyze meal right now";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
