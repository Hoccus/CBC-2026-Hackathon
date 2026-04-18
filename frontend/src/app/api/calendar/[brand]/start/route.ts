import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(
    `${url.origin}/profile?calendar_error=calendar-sync-paused-in-next-only-mode`,
  );
}
