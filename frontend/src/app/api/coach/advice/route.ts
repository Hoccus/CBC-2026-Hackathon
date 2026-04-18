import { NextResponse } from "next/server";
import { sendAnthropicMessage } from "@/lib/server/anthropic";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a personal nutrition coach for a national correspondent who travels constantly,
works odd hours, and often eats on the go. Your advice must be practical and actionable for real-world
situations, not generic tips. When the user describes what's available, give specific meal suggestions
with brief reasoning. Keep responses concise.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      context?: string;
      profile_context?: string;
    };

    if (!body.message?.trim()) {
      return NextResponse.json({ detail: "Message is required" }, { status: 400 });
    }

    const parts: string[] = [];
    if (body.profile_context) {
      parts.push(`[User Profile: ${body.profile_context}]`);
    }
    if (body.context) {
      parts.push(`[Situation: ${body.context}]`);
    }
    parts.push(body.message.trim());

    const advice = await sendAnthropicMessage(
      [{ type: "text", text: parts.join("\n") }],
      { system: SYSTEM_PROMPT, maxTokens: 1024 },
    );

    return NextResponse.json({ advice, suggestions: [] });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unable to generate advice right now";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
