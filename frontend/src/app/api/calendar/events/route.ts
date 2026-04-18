import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { fetchAuthAction } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") || "7");

  try {
    const payload = await fetchAuthAction(api.calendar.getEvents, { days });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ events: [] });
  }
}
