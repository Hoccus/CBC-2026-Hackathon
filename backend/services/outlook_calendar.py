import os
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from models.calendar import CalendarEvent
from services.calendar_store import ProviderConnectionRecord


MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
MICROSOFT_ME_URL = "https://graph.microsoft.com/v1.0/me"
MICROSOFT_EVENTS_URL = "https://graph.microsoft.com/v1.0/me/calendarView"
MICROSOFT_SCOPES = [
    "openid",
    "profile",
    "offline_access",
    "User.Read",
    "Calendars.Read",
]


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise HTTPException(status_code=500, detail=f"{name} not set")
    return value


def get_outlook_redirect_uri() -> str:
    return f"{_required_env('CALENDAR_OAUTH_BASE_URL')}/api/calendar/outlook/callback"


def build_outlook_auth_url(state: str) -> str:
    params = {
        "client_id": _required_env("MICROSOFT_CLIENT_ID"),
        "redirect_uri": get_outlook_redirect_uri(),
        "response_type": "code",
        "scope": " ".join(MICROSOFT_SCOPES),
        "response_mode": "query",
        "state": state,
    }
    return f"{MICROSOFT_AUTH_URL}?{urlencode(params)}"


async def exchange_outlook_code(code: str) -> ProviderConnectionRecord:
    payload = {
        "client_id": _required_env("MICROSOFT_CLIENT_ID"),
        "client_secret": _required_env("MICROSOFT_CLIENT_SECRET"),
        "code": code,
        "redirect_uri": get_outlook_redirect_uri(),
        "grant_type": "authorization_code",
        "scope": " ".join(MICROSOFT_SCOPES),
    }
    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(MICROSOFT_TOKEN_URL, data=payload)
        token_res.raise_for_status()
        token_data = token_res.json()

        access_token = token_data["access_token"]
        me_res = await client.get(
            MICROSOFT_ME_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me_res.raise_for_status()
        me_data = me_res.json()

    return ProviderConnectionRecord(
        provider="outlook",
        access_token=access_token,
        refresh_token=token_data.get("refresh_token"),
        expires_at=time.time() + int(token_data.get("expires_in", 3600)),
        account_email=me_data.get("mail") or me_data.get("userPrincipalName"),
    )


async def refresh_outlook_access_token(connection: ProviderConnectionRecord) -> ProviderConnectionRecord:
    if not connection.refresh_token:
        raise HTTPException(status_code=400, detail="Microsoft refresh token missing")

    payload = {
        "client_id": _required_env("MICROSOFT_CLIENT_ID"),
        "client_secret": _required_env("MICROSOFT_CLIENT_SECRET"),
        "refresh_token": connection.refresh_token,
        "grant_type": "refresh_token",
        "scope": " ".join(MICROSOFT_SCOPES),
    }
    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(MICROSOFT_TOKEN_URL, data=payload)
        token_res.raise_for_status()
        token_data = token_res.json()

    connection.access_token = token_data["access_token"]
    connection.expires_at = time.time() + int(token_data.get("expires_in", 3600))
    connection.refresh_token = token_data.get("refresh_token", connection.refresh_token)
    return connection


async def ensure_outlook_token(connection: ProviderConnectionRecord) -> ProviderConnectionRecord:
    if connection.expires_at and connection.expires_at > time.time() + 60:
        return connection
    return await refresh_outlook_access_token(connection)


async def fetch_outlook_events(
    connection: ProviderConnectionRecord,
    days: int = 7,
) -> list[CalendarEvent]:
    connection = await ensure_outlook_token(connection)
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=days)
    params = {
        "startDateTime": start.isoformat(),
        "endDateTime": end.isoformat(),
        "$top": 50,
        "$orderby": "start/dateTime",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        res = await client.get(
            MICROSOFT_EVENTS_URL,
            params=params,
            headers={"Authorization": f"Bearer {connection.access_token}"},
        )
        res.raise_for_status()
        payload = res.json()

    events: list[CalendarEvent] = []
    for item in payload.get("value", []):
        start_data = item.get("start", {})
        end_data = item.get("end", {})
        starts_at = start_data.get("dateTime")
        ends_at = end_data.get("dateTime")
        if not starts_at or not ends_at:
            continue
        events.append(
            CalendarEvent(
                id=item["id"],
                provider="outlook",
                title=item.get("subject") or "Untitled event",
                location=(item.get("location") or {}).get("displayName"),
                starts_at=starts_at,
                ends_at=ends_at,
                timezone=start_data.get("timeZone") or end_data.get("timeZone"),
                is_all_day=bool(item.get("isAllDay")),
                status=item.get("showAs"),
            )
        )
    return events
