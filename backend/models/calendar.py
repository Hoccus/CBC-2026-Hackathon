from typing import Literal

from pydantic import BaseModel


CalendarProvider = Literal["google", "outlook"]
CalendarConnectionState = Literal["idle", "connected"]
CalendarRisk = Literal["low", "med", "high"]


class CalendarConnection(BaseModel):
    provider: CalendarProvider
    state: CalendarConnectionState
    title: str
    account_email: str | None = None


class CalendarConnectionsResponse(BaseModel):
    connections: list[CalendarConnection]


class CalendarEvent(BaseModel):
    id: str
    provider: CalendarProvider
    title: str
    location: str | None = None
    starts_at: str
    ends_at: str
    timezone: str | None = None
    is_all_day: bool = False
    status: str | None = None


class CalendarEventsResponse(BaseModel):
    events: list[CalendarEvent]


class CalendarSummaryResponse(BaseModel):
    summary: str | None = None
