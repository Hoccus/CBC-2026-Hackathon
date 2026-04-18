import { NextResponse } from "next/server";
import { extractJsonValue, sendAnthropicMessage } from "@/lib/server/anthropic";

export const dynamic = "force-dynamic";

interface Restaurant {
  name: string;
  cuisine?: string;
  amenity?: string;
  address?: string;
  maps_url?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      restaurants?: Restaurant[];
      dietary_restrictions?: string[];
      calorie_goal?: number;
      context?: string;
    };

    const restaurants = body.restaurants ?? [];
    if (restaurants.length === 0) {
      return NextResponse.json({ detail: "No restaurants provided." }, { status: 400 });
    }

    const items = restaurants
      .slice(0, 20)
      .map((restaurant) => {
        const details = restaurant.cuisine || restaurant.amenity || "restaurant";
        const address = restaurant.address ? ` - ${restaurant.address}` : "";
        return `- ${restaurant.name} (${details})${address}`;
      })
      .join("\n");

    const restrictions = (body.dietary_restrictions ?? []).join(", ") || "none";

    const raw = await sendAnthropicMessage(
      [
        {
          type: "text",
          text: `You are a nutrition coach helping someone find the healthiest food nearby.

Nearby places:
${items}

User details:
- Dietary restrictions: ${restrictions}
- Daily calorie goal: ${body.calorie_goal ?? 2000} kcal
- Context: ${body.context || "traveling"}

Choose the top 5 best options and give each a health score from 1-10.
Reply only with a valid JSON array:
[{"name":"Restaurant Name","health_score":8,"suggested_order":"Specific dish or order","reasoning":"Why this is a good choice"}]

Only use restaurant names exactly as they appear in the list above.`,
        },
      ],
      { maxTokens: 1024 },
    );

    const parsed = extractJsonValue(raw);
    const lookup = new Map(restaurants.map((restaurant) => [restaurant.name, restaurant]));
    const suggestions = Array.isArray(parsed)
      ? parsed.map((row) => {
          const original = lookup.get(String(row.name));
          return {
            ...row,
            address: original?.address,
            maps_url: original?.maps_url,
          };
        })
      : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Failed to score restaurants right now";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
