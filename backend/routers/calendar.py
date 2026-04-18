import asyncio
import os

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse

from models.calendar import (
    CalendarConnection,
    CalendarConnectionsResponse,
    CalendarEventsResponse,
    CalendarProvider,
    CalendarSummaryResponse,
)
from services.calendar_context import build_calendar_summary
from services.calendar_store import (
    create_oauth_state,
    delete_connection,
    ensure_session,
    get_connection,
    get_session,
    pop_oauth_state,
    save_connection,
)
from services.google_calendar import (
    build_google_auth_url,
    exchange_google_code,
    fetch_google_events,
)
from services.outlook_calendar import (
    build_outlook_auth_url,
    exchange_outlook_code,
    fetch_outlook_events,
)


router = APIRouter()


def _frontend_profile_url() -> str:
    base = os.getenv("FRONTEND_APP_URL", "http://localhost:3000")
    return f"{base}/profile"


@router.get("/connections", response_model=CalendarConnectionsResponse)
async def get_connections(request: Request, response: Response):
    session_id = ensure_session(request, response)
    session = get_session(session_id)
    google = session.connections.get("google")
    outlook = session.connections.get("outlook")
    return CalendarConnectionsResponse(
        connections=[
            CalendarConnection(
                provider="google",
                state="connected" if google else "idle",
                title="Google Calendar",
                account_email=google.account_email if google else None,
            ),
            CalendarConnection(
                provider="outlook",
                state="connected" if outlook else "idle",
                title="Outlook",
                account_email=outlook.account_email if outlook else None,
            ),
        ]
    )


@router.get("/{provider}/start")
async def start_calendar_oauth(provider: CalendarProvider, request: Request):
    response = RedirectResponse(url="/", status_code=302)
    session_id = ensure_session(request, response)
    state = create_oauth_state(provider, session_id)

    if provider == "google":
        response.headers["location"] = build_google_auth_url(state)
    elif provider == "outlook":
        response.headers["location"] = build_outlook_auth_url(state)
    else:
        raise HTTPException(status_code=404, detail="Unknown calendar provider")
    return response


@router.get("/google/callback")
async def google_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    if error:
        return RedirectResponse(url=f"{_frontend_profile_url()}?calendar_error={error}", status_code=302)
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing Google OAuth code or state")

    oauth_state = pop_oauth_state(state)
    if not oauth_state or oauth_state.provider != "google":
        raise HTTPException(status_code=400, detail="Invalid Google OAuth state")

    record = await exchange_google_code(code)
    save_connection(oauth_state.session_id, record)
    return RedirectResponse(url=f"{_frontend_profile_url()}?calendar_connected=google", status_code=302)


@router.get("/outlook/callback")
async def outlook_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    if error:
        return RedirectResponse(url=f"{_frontend_profile_url()}?calendar_error={error}", status_code=302)
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing Microsoft OAuth code or state")

    oauth_state = pop_oauth_state(state)
    if not oauth_state or oauth_state.provider != "outlook":
        raise HTTPException(status_code=400, detail="Invalid Microsoft OAuth state")

    record = await exchange_outlook_code(code)
    save_connection(oauth_state.session_id, record)
    return RedirectResponse(url=f"{_frontend_profile_url()}?calendar_connected=outlook", status_code=302)


@router.post("/{provider}/disconnect")
async def disconnect_calendar(provider: CalendarProvider, request: Request, response: Response):
    session_id = ensure_session(request, response)
    delete_connection(session_id, provider)
    return {"ok": True}


@router.get("/events", response_model=CalendarEventsResponse)
async def get_calendar_events(
    request: Request,
    response: Response,
    days: int = Query(default=7, ge=1, le=30),
):
    session_id = ensure_session(request, response)
    google = get_connection(session_id, "google")
    outlook = get_connection(session_id, "outlook")

    tasks = []
    if google:
        tasks.append(fetch_google_events(google, days=days))
    if outlook:
        tasks.append(fetch_outlook_events(outlook, days=days))

    if not tasks:
        return CalendarEventsResponse(events=[])

    results = await asyncio.gather(*tasks, return_exceptions=True)
    events = []
    for result in results:
        if isinstance(result, Exception):
            continue
        events.extend(result)

    events.sort(key=lambda event: event.starts_at)
    return CalendarEventsResponse(events=events)


@router.get("/summary", response_model=CalendarSummaryResponse)
async def get_calendar_summary(
    request: Request,
    response: Response,
    days: int = Query(default=3, ge=1, le=14),
):
    return CalendarSummaryResponse(summary=await build_calendar_summary(request, response, days=days))
