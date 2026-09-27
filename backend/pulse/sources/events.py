"""Events: curated Philly traditions + Ticketmaster shows + Council meetings + election dates."""

from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta, timezone
from functools import lru_cache
from typing import Any

import httpx

from ..config import DATA_DIR, PHILLY_TZ, Settings
from ..elections import next_election
from ..feeds import FeedDisabled

TICKETMASTER_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

CATEGORIES = [
    {"key": "parades_festivals", "label": "Parades & Festivals"},
    {"key": "races_runs", "label": "Races & Runs"},
    {"key": "civic", "label": "Civic/Political"},
    {"key": "concerts_shows", "label": "Concerts & Shows"},
]


# --- recurrence rules -------------------------------------------------------

def _nth_weekday(year: int, month: int, weekday: int, n: int) -> date:
    first = date(year, month, 1)
    return first + timedelta(days=(weekday - first.weekday()) % 7 + 7 * (n - 1))


def _last_weekday(year: int, month: int, weekday: int) -> date:
    nxt = date(year + (month == 12), month % 12 + 1, 1)
    last = nxt - timedelta(days=1)
    return last - timedelta(days=(last.weekday() - weekday) % 7)


def rule_date(rule: dict[str, Any], year: int, month: int | None = None) -> date:
    kind = rule["rule"]
    if kind == "fixed":
        return date(year, rule["month"], rule["day"])
    if kind == "nth_weekday":
        return _nth_weekday(year, rule["month"], rule["weekday"], rule["n"])
    if kind == "last_weekday":
        return _last_weekday(year, rule["month"], rule["weekday"])
    if kind == "thanksgiving":
        return _nth_weekday(year, 11, 3, 4) + timedelta(days=rule.get("offset_days", 0))
    if kind == "monthly_nth_weekday":
        return _nth_weekday(year, month or 1, rule["weekday"], rule["n"])
    raise ValueError(f"unknown rule {kind}")


def _occurrences(spec: dict[str, Any], start: date, end: date) -> list[tuple[date, date]]:
    """(first_day, last_day) spans of an event that overlap [start, end]."""
    rule = spec["when"]
    spans: list[tuple[date, date]] = []
    if rule["rule"] == "monthly_nth_weekday":
        cursor = date(start.year, start.month, 1)
        while cursor <= end:
            d = rule_date(rule, cursor.year, cursor.month)
            spans.append((d, d))
            cursor = date(cursor.year + (cursor.month == 12), cursor.month % 12 + 1, 1)
    else:
        for year in range(start.year - 1, end.year + 1):
            first = rule_date(rule, year)
            if "until" in spec:
                last = rule_date(spec["until"], year)
            else:
                last = first + timedelta(days=spec.get("days", 1) - 1)
            spans.append((first, last))
    return [(a, b) for a, b in spans if b >= start and a <= end]


def _at(day: date, hhmm: str | None) -> datetime:
    t = time.fromisoformat(hhmm) if hhmm else time(0, 0)
    return datetime.combine(day, t, tzinfo=PHILLY_TZ)


@lru_cache(maxsize=1)
def load_curated() -> list[dict[str, Any]]:
    with open(DATA_DIR / "curated_events.json", encoding="utf-8") as fh:
        return json.load(fh)["events"]


def curated_events(start: date, end: date) -> list[dict[str, Any]]:
    events = []
    for spec in load_curated():
        for first, last in _occurrences(spec, start, end):
            all_day = spec.get("all_day", False)
            has_end = last != first or bool(spec.get("end_time"))
            events.append(
                {
                    "id": f"{spec['id']}-{first.isoformat()}",
                    "title": spec["title"],
                    "category": spec["category"],
                    "start": _at(first, None if all_day else spec.get("time")).isoformat(),
                    "end": _at(last, spec.get("end_time") or "23:59").isoformat() if has_end else None,
                    "all_day": all_day,
                    "location": spec.get("location"),
                    "url": spec.get("url"),
                    "description": spec.get("description"),
                    "closure": spec.get("closure"),
                    "date_note": spec.get("date_note"),
                    "source": "Curated",
                }
            )
    return events


def election_events(today: date) -> list[dict[str, Any]]:
    election = next_election(today)
    events = []
    for key_date in election["key_dates"]:
        if key_date["passed"]:
            continue
        is_election_day = key_date["label"] == "Election Day"
        day = date.fromisoformat(key_date["date"])
        events.append(
            {
                "id": f"election-{key_date['date']}-{key_date['label'].lower().replace(' ', '-')}",
                "title": election["name"] if is_election_day else key_date["label"],
                "category": "civic",
                "start": _at(day, "07:00" if is_election_day else None).isoformat(),
                "end": _at(day, "20:00").isoformat() if is_election_day else None,
                "all_day": not is_election_day,
                "location": "Your polling place" if is_election_day else "Online, by mail, or in person",
                "url": election["links"][0]["url"] if is_election_day else election["links"][2]["url"],
                "description": key_date["note"],
                "closure": None,
                "date_note": None,
                "source": "PA Department of State",
            }
        )
    return events


def meeting_to_event(meeting: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": meeting["id"],
        "title": meeting["title"],
        "category": "civic",
        "start": meeting["start"],
        "end": None,
        "all_day": meeting.get("time_tbd", False),
        "location": meeting["location"],
        "url": meeting["url"],
        "description": meeting.get("details") or "Open to the public. Public comment rules are on the agenda.",
        "closure": None,
        "date_note": None,
        "source": "City Council",
    }


# --- Ticketmaster -----------------------------------------------------------

def normalize_ticketmaster(payload: dict[str, Any]) -> list[dict[str, Any]]:
    events, seen = [], set()
    for raw in (payload.get("_embedded") or {}).get("events", []):
        classification = (raw.get("classifications") or [{}])[0]
        segment = (classification.get("segment") or {}).get("name", "")
        if segment == "Sports":  # the Sports tab has these covered
            continue
        dates = (raw.get("dates") or {}).get("start") or {}
        if dates.get("dateTime"):
            start = datetime.fromisoformat(dates["dateTime"].replace("Z", "+00:00")).astimezone(PHILLY_TZ)
            all_day = False
        elif dates.get("localDate"):
            start = _at(date.fromisoformat(dates["localDate"]), dates.get("localTime", "00:00")[:5])
            all_day = not dates.get("localTime")
        else:
            continue
        key = (raw.get("name", "").lower(), start.date())
        if key in seen:
            continue
        seen.add(key)
        venue = ((raw.get("_embedded") or {}).get("venues") or [{}])[0]
        genre = (classification.get("genre") or {}).get("name")
        events.append(
            {
                "id": f"tm-{raw.get('id')}",
                "title": raw.get("name", "Live show"),
                "category": "parades_festivals" if genre in {"Fairs & Festivals", "Festival"} else "concerts_shows",
                "start": start.isoformat(),
                "end": None,
                "all_day": all_day,
                "location": venue.get("name"),
                "url": raw.get("url"),
                "description": " · ".join(x for x in (segment, genre) if x and x != "Undefined") or None,
                "closure": None,
                "date_note": None,
                "source": "Ticketmaster",
            }
        )
    return events


async def fetch_ticketmaster(client: httpx.AsyncClient, settings: Settings) -> list[dict[str, Any]]:
    if not settings.ticketmaster_key:
        raise FeedDisabled("Set TICKETMASTER_API_KEY to see concerts and shows")
    now = datetime.now(timezone.utc).replace(microsecond=0)
    fmt = "%Y-%m-%dT%H:%M:%SZ"
    params = {
        "apikey": settings.ticketmaster_key,
        "city": "Philadelphia",
        "stateCode": "PA",
        "countryCode": "US",
        "startDateTime": now.strftime(fmt),
        "endDateTime": (now + timedelta(days=8)).strftime(fmt),
        "sort": "date,asc",
        "size": "80",
    }
    resp = await client.get(TICKETMASTER_URL, params=params)
    resp.raise_for_status()
    return normalize_ticketmaster(resp.json())
