import os
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from models.calendar import CalendarEvent
from services.calendar_store import ProviderConnectionRecord


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
GOOGLE_SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/calendar.readonly",
]


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise HTTPException(status_code=500, detail=f"{name} not set")
    return value


def get_google_redirect_uri() -> str:
    return f"{_required_env('CALENDAR_OAUTH_BASE_URL')}/api/calendar/google/callback"


def build_google_auth_url(state: str) -> str:
    params = {
        "client_id": _required_env("GOOGLE_CLIENT_ID"),
        "redirect_uri": get_google_redirect_uri(),
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_google_code(code: str) -> ProviderConnectionRecord:
    payload = {
        "code": code,
        "client_id": _required_env("GOOGLE_CLIENT_ID"),
        "client_secret": _required_env("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": get_google_redirect_uri(),
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(GOOGLE_TOKEN_URL, data=payload)
        token_res.raise_for_status()
        token_data = token_res.json()

        access_token = token_data["access_token"]
        user_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_res.raise_for_status()
        user_data = user_res.json()

    return ProviderConnectionRecord(
        provider="google",
        access_token=access_token,
        refresh_token=token_data.get("refresh_token"),
        expires_at=time.time() + int(token_data.get("expires_in", 3600)),
        account_email=user_data.get("email"),
    )


async def refresh_google_access_token(connection: ProviderConnectionRecord) -> ProviderConnectionRecord:
    if not connection.refresh_token:
        raise HTTPException(status_code=400, detail="Google refresh token missing")

    payload = {
        "client_id": _required_env("GOOGLE_CLIENT_ID"),
        "client_secret": _required_env("GOOGLE_CLIENT_SECRET"),
        "refresh_token": connection.refresh_token,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(GOOGLE_TOKEN_URL, data=payload)
        token_res.raise_for_status()
        token_data = token_res.json()

    connection.access_token = token_data["access_token"]
    connection.expires_at = time.time() + int(token_data.get("expires_in", 3600))
    return connection


async def ensure_google_token(connection: ProviderConnectionRecord) -> ProviderConnectionRecord:
    if connection.expires_at and connection.expires_at > time.time() + 60:
        return connection
    return await refresh_google_access_token(connection)


async def fetch_google_events(
    connection: ProviderConnectionRecord,
    days: int = 7,
) -> list[CalendarEvent]:
    connection = await ensure_google_token(connection)
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=days)
    params = {
        "timeMin": start.isoformat(),
        "timeMax": end.isoformat(),
        "singleEvents": "true",
        "orderBy": "startTime",
        "maxResults": 50,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        res = await client.get(
            GOOGLE_EVENTS_URL,
            params=params,
            headers={"Authorization": f"Bearer {connection.access_token}"},
        )
        res.raise_for_status()
        payload = res.json()

    events: list[CalendarEvent] = []
    for item in payload.get("items", []):
        start_data = item.get("start", {})
        end_data = item.get("end", {})
        starts_at = start_data.get("dateTime") or start_data.get("date")
        ends_at = end_data.get("dateTime") or end_data.get("date")
        if not starts_at or not ends_at:
            continue
        events.append(
            CalendarEvent(
                id=item["id"],
                provider="google",
                title=item.get("summary") or "Untitled event",
                location=item.get("location"),
                starts_at=starts_at,
                ends_at=ends_at,
                timezone=start_data.get("timeZone") or end_data.get("timeZone"),
                is_all_day="date" in start_data,
                status=item.get("status"),
            )
        )
    return events
