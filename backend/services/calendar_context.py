from datetime import datetime

from fastapi import Request, Response

from services.calendar_store import ensure_session, get_connection
from services.google_calendar import fetch_google_events
from services.outlook_calendar import fetch_outlook_events


async def build_calendar_summary(
    request: Request,
    response: Response,
    days: int = 3,
) -> str | None:
    session_id = ensure_session(request, response)
    google = get_connection(session_id, "google")
    outlook = get_connection(session_id, "outlook")

    events = []
    if google:
        try:
            events.extend(await fetch_google_events(google, days=days))
        except Exception:
            pass
    if outlook:
        try:
            events.extend(await fetch_outlook_events(outlook, days=days))
        except Exception:
            pass

    if not events:
        return None

    events.sort(key=lambda event: event.starts_at)
    lines = []
    for event in events[:6]:
        start = _format_start(event.starts_at, event.is_all_day)
        location = f" at {event.location}" if event.location else ""
        lines.append(f"{start}: {event.title}{location}")
    return "Upcoming schedule: " + " | ".join(lines)


def _format_start(value: str, is_all_day: bool) -> str:
    if is_all_day:
        try:
            return datetime.fromisoformat(value).strftime("%a %b %d")
        except ValueError:
            return value

    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized).strftime("%a %b %d %I:%M %p")
    except ValueError:
        return value
