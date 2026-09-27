"""City Council (Legistar) and PA General Assembly (Open States) data."""

from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta
from typing import Any

import httpx

from ..config import PHILLY_TZ, Settings
from ..feeds import FeedDisabled
from ..summarize import is_ceremonial, summarize

LEGISTAR = "https://webapi.legistar.com/v1/phila"
LEGISTAR_WEB = "https://phila.legistar.com"
OPENSTATES = "https://v3.openstates.org/bills"
CALENDAR_DAYS = 14
BILL_LOOKBACK_DAYS = 30
MAX_BILLS = 15
PASSED_STATUSES = {"ADOPTED", "ENACTED", "PASSED", "SIGNED", "APPROVED", "PASSED FINALLY"}


def _odata_dt(d: date) -> str:
    return f"datetime'{d.isoformat()}T00:00:00'"


def _combine(day: str | None, time_str: str | None) -> str | None:
    """Legistar splits date ("2026-10-01T00:00:00") and time ("10:00 AM")."""
    if not day:
        return None
    base = datetime.fromisoformat(day[:19]).date()
    parsed_time = None
    for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M"):
        try:
            parsed_time = datetime.strptime((time_str or "").strip().upper(), fmt).time()
            break
        except ValueError:
            continue
    if parsed_time is None:
        return datetime(base.year, base.month, base.day, tzinfo=PHILLY_TZ).isoformat()
    return datetime.combine(base, parsed_time, tzinfo=PHILLY_TZ).isoformat()


def normalize_meeting(raw: dict[str, Any]) -> dict[str, Any]:
    body = (raw.get("EventBodyName") or "City Council").strip()
    is_session = body.lower() in {"city council", "council"}
    comment = (raw.get("EventComment") or "").strip()
    return {
        "id": f"legistar-{raw.get('EventId')}",
        "body": body,
        "kind": "Session" if is_session else "Hearing",
        "title": "Stated Meeting of City Council" if is_session else f"{body} hearing",
        "details": comment or None,
        "start": _combine(raw.get("EventDate"), raw.get("EventTime")),
        "time_tbd": not raw.get("EventTime"),
        "location": raw.get("EventLocation") or "City Hall",
        "url": raw.get("EventInSiteURL") or f"{LEGISTAR_WEB}/Calendar.aspx",
        "agenda_url": raw.get("EventAgendaFile"),
    }


def normalize_matter(raw: dict[str, Any]) -> dict[str, Any]:
    title = (raw.get("MatterTitle") or raw.get("MatterName") or "").strip()
    status_raw = (raw.get("MatterStatusName") or "").strip()
    passed = raw.get("MatterPassedDate")
    stage = "Passed" if passed or status_raw.upper() in PASSED_STATUSES else "Introduced"
    matter_id, guid = raw.get("MatterId"), raw.get("MatterGUID") or raw.get("MatterGuid")
    url = f"{LEGISTAR_WEB}/LegislationDetail.aspx?ID={matter_id}"
    if guid:
        url += f"&GUID={guid}"
    return {
        "id": f"phl-{matter_id}",
        "number": raw.get("MatterFile") or str(matter_id),
        "title": title,
        "summary": summarize(title),
        "type": raw.get("MatterTypeName") or "Bill",
        "status": status_raw.title() if status_raw else stage,
        "stage": stage,
        "introduced": (raw.get("MatterIntroDate") or "")[:10] or None,
        "passed": (passed or "")[:10] or None,
        "url": url,
        "source": "City Council",
        "ceremonial": is_ceremonial(title),
    }


def normalize_state_bill(raw: dict[str, Any]) -> dict[str, Any]:
    title = raw.get("title") or ""
    action = raw.get("latest_action_description") or ""
    passed = any(word in action.lower() for word in ("signed", "approved by the governor", "act no"))
    return {
        "id": f"pa-{raw.get('id')}",
        "number": raw.get("identifier") or "",
        "title": title,
        "summary": summarize(title),
        "type": "State bill",
        "status": action or "Introduced",
        "stage": "Passed" if passed else "Introduced",
        "introduced": raw.get("first_action_date"),
        "passed": raw.get("latest_action_date") if passed else None,
        "url": raw.get("openstates_url") or "https://www.legis.state.pa.us/",
        "source": "PA General Assembly",
        "ceremonial": False,
    }


def rank_bills(bills: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Substantive legislation first, newest activity first; ceremonial resolutions dropped."""
    useful = [b for b in bills if not b["ceremonial"] and b["title"]]

    def activity(b: dict[str, Any]) -> str:
        return max(b.get("passed") or "", b.get("introduced") or "")

    useful.sort(key=lambda b: (b["type"] == "Bill" or b["type"] == "State bill", activity(b)), reverse=True)
    return useful[:MAX_BILLS]


async def fetch_council_calendar(client: httpx.AsyncClient, settings: Settings) -> list[dict[str, Any]]:
    today = datetime.now(PHILLY_TZ).date()
    params = {
        "$filter": f"EventDate ge {_odata_dt(today)} and EventDate lt {_odata_dt(today + timedelta(days=CALENDAR_DAYS))}",
        "$orderby": "EventDate asc",
    }
    resp = await client.get(f"{LEGISTAR}/events", params=params)
    resp.raise_for_status()
    meetings = [normalize_meeting(m) for m in resp.json()]
    return sorted((m for m in meetings if m["start"]), key=lambda m: m["start"])


async def _council_bills(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    since = _odata_dt(datetime.now(PHILLY_TZ).date() - timedelta(days=BILL_LOOKBACK_DAYS))
    params = {
        "$filter": f"MatterIntroDate ge {since} or MatterPassedDate ge {since}",
        "$orderby": "MatterIntroDate desc",
        "$top": "100",
    }
    resp = await client.get(f"{LEGISTAR}/matters", params=params)
    resp.raise_for_status()
    return [normalize_matter(m) for m in resp.json()]


async def _state_bills(client: httpx.AsyncClient, settings: Settings) -> list[dict[str, Any]]:
    if not settings.openstates_key:
        raise FeedDisabled("Set OPENSTATES_API_KEY for PA General Assembly bills")
    params = {"jurisdiction": "Pennsylvania", "q": "Philadelphia", "sort": "updated_desc", "per_page": "10"}
    resp = await client.get(OPENSTATES, params=params, headers={"X-API-KEY": settings.openstates_key})
    resp.raise_for_status()
    return [normalize_state_bill(b) for b in resp.json().get("results", [])]


async def fetch_bills(client: httpx.AsyncClient, settings: Settings) -> list[dict[str, Any]]:
    council, state = await asyncio.gather(
        _council_bills(client), _state_bills(client, settings), return_exceptions=True
    )
    if isinstance(council, Exception) and isinstance(state, Exception):
        raise council
    bills = [b for group in (council, state) if isinstance(group, list) for b in group]
    return rank_bills(bills)
