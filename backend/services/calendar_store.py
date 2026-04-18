import secrets
import time
from dataclasses import dataclass, field

from fastapi import Request, Response

from models.calendar import CalendarProvider


SESSION_COOKIE = "nutricoach_session"


@dataclass
class ProviderConnectionRecord:
    provider: CalendarProvider
    access_token: str
    refresh_token: str | None
    expires_at: float | None
    account_email: str | None = None


@dataclass
class SessionRecord:
    connections: dict[CalendarProvider, ProviderConnectionRecord] = field(default_factory=dict)


@dataclass
class OAuthStateRecord:
    provider: CalendarProvider
    session_id: str
    created_at: float


_sessions: dict[str, SessionRecord] = {}
_oauth_states: dict[str, OAuthStateRecord] = {}


def ensure_session(request: Request, response: Response) -> str:
    session_id = request.cookies.get(SESSION_COOKIE)
    if session_id and session_id in _sessions:
        return session_id

    session_id = secrets.token_urlsafe(24)
    _sessions[session_id] = SessionRecord()
    response.set_cookie(
        SESSION_COOKIE,
        session_id,
        httponly=True,
        samesite="lax",
        secure=request.url.scheme == "https",
        max_age=60 * 60 * 24 * 30,
    )
    return session_id


def get_session(session_id: str) -> SessionRecord:
    return _sessions.setdefault(session_id, SessionRecord())


def save_connection(session_id: str, record: ProviderConnectionRecord) -> None:
    get_session(session_id).connections[record.provider] = record


def get_connection(session_id: str, provider: CalendarProvider) -> ProviderConnectionRecord | None:
    return get_session(session_id).connections.get(provider)


def delete_connection(session_id: str, provider: CalendarProvider) -> None:
    get_session(session_id).connections.pop(provider, None)


def create_oauth_state(provider: CalendarProvider, session_id: str) -> str:
    state = secrets.token_urlsafe(24)
    _oauth_states[state] = OAuthStateRecord(
        provider=provider,
        session_id=session_id,
        created_at=time.time(),
    )
    return state


def pop_oauth_state(state: str) -> OAuthStateRecord | None:
    return _oauth_states.pop(state, None)
