import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchAuthQuery(api.calendar.getConnections);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ connections: [] });
  }
}
