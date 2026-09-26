"""Compose the four tab payloads (/home, /events, /sports, /politics) from cached feeds."""

from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta
from typing import Any

from . import sample
from .config import PHILLY_TZ
from .elections import next_election
from .feeds import Feed, FeedStore, SourceMeta
from .sources.events import CATEGORIES, curated_events, election_events, fetch_ticketmaster, meeting_to_event
from .sources.news import fetch_news
from .sources.politics import fetch_bills, fetch_council_calendar
from .sources.sports import fetch_schedule, fetch_scoreboard, merge_games, parse_time, split_games
from .sources.weather import fetch_weather
from .teams import TEAMS, team_summary

# name -> (fetcher, max age in seconds, sample factory). Max age doubles as the refresh interval.
FEEDS: dict[str, Feed] = {
    "weather": Feed("weather", fetch_weather, 30 * 60, sample.weather, dict),
    "news": Feed("news", fetch_news, 20 * 60, sample.news),
    "sports_schedule": Feed("sports_schedule", fetch_schedule, 15 * 60, sample.games),
    # Live scores. The schedule sample already includes today's demo games, so no sample here.
    "sports_scoreboard": Feed("sports_scoreboard", fetch_scoreboard, 60, list),
    "council": Feed("council", fetch_council_calendar, 60 * 60, sample.council_calendar),
    "bills": Feed("bills", fetch_bills, 60 * 60, sample.bills),
    "ticketmaster": Feed("ticketmaster", fetch_ticketmaster, 60 * 60, sample.shows),
}

WEEK_DAYS = 7
HORIZON_DAYS = 90


def _now() -> datetime:
    return datetime.now(PHILLY_TZ)


def _meta(**metas: SourceMeta) -> dict[str, dict[str, Any]]:
    return {name: m.as_dict() for name, m in metas.items()}


# --- sports -----------------------------------------------------------------

async def sports_payload(store: FeedStore, now: datetime | None = None) -> dict[str, Any]:
    now = now or _now()
    (schedule, schedule_meta), (board, board_meta) = await asyncio.gather(
        store.get("sports_schedule"), store.get("sports_scoreboard")
    )
    groups = split_games(merge_games(schedule, board), now)
    meta = schedule_meta
    if schedule_meta.status == "live" and board_meta.status not in {"live", "off"}:
        meta = SourceMeta("cached", schedule_meta.updated_at, "Live scores are temporarily delayed")
    return {
        "generated_at": now.isoformat(),
        **groups,
        "teams": [team_summary(t) for t in TEAMS],
        "sources": _meta(sports=meta),
    }


# --- events -----------------------------------------------------------------

def _event_bounds(event: dict[str, Any]) -> tuple[datetime, datetime]:
    start = parse_time(event["start"]) or _now()
    end = parse_time(event.get("end")) if event.get("end") else None
    if end is None:
        end = start.replace(hour=23, minute=59) if event.get("all_day") else start + timedelta(hours=3)
    return start, end


def arrange_events(events: list[dict[str, Any]], now: datetime) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Split into this week's events grouped by day, plus bigger things further out."""
    today = now.date()
    week_end = today + timedelta(days=WEEK_DAYS - 1)
    by_day: dict[date, list[dict[str, Any]]] = {}
    later: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for event in events:
        if event["id"] in seen_ids:
            continue
        seen_ids.add(event["id"])
        start, end = _event_bounds(event)
        if end < now:
            continue
        start_day = start.astimezone(PHILLY_TZ).date()
        day = max(start_day, today)
        item = {**event, "ongoing": start_day < today}
        if day <= week_end:
            by_day.setdefault(day, []).append(item)
        else:
            later.append(item)

    days = [
        {"date": d.isoformat(), "events": sorted(items, key=lambda e: (not e["all_day"], e["start"]))}
        for d, items in sorted(by_day.items())
    ]
    # "On the horizon": one entry per title, only the big stuff (skip monthly art walks).
    later.sort(key=lambda e: e["start"])
    horizon, titles = [], set()
    for event in later:
        if event["title"] in titles or event["source"] in {"Ticketmaster", "Demo data"} or event["id"].startswith("first-friday"):
            continue
        titles.add(event["title"])
        horizon.append(event)
    return days, horizon[:8]


async def events_payload(store: FeedStore, now: datetime | None = None) -> dict[str, Any]:
    now = now or _now()
    today = now.date()
    (meetings, council_meta), (shows, shows_meta) = await asyncio.gather(store.get("council"), store.get("ticketmaster"))
    events = (
        curated_events(today, today + timedelta(days=HORIZON_DAYS))
        + election_events(today)
        + [meeting_to_event(m) for m in meetings]
        + list(shows)
    )
    days, horizon = arrange_events(events, now)
    return {
        "generated_at": now.isoformat(),
        "range": {"start": today.isoformat(), "end": (today + timedelta(days=WEEK_DAYS - 1)).isoformat()},
        "categories": CATEGORIES,
        "days": days,
        "later": horizon,
        "sources": _meta(council=council_meta, shows=shows_meta),
    }


# --- politics ---------------------------------------------------------------

async def politics_payload(store: FeedStore, now: datetime | None = None) -> dict[str, Any]:
    now = now or _now()
    (meetings, council_meta), (bills, bills_meta) = await asyncio.gather(store.get("council"), store.get("bills"))
    upcoming = sorted(
        (m for m in meetings if (parse_time(m["start"]) or now) >= now - timedelta(hours=3)),
        key=lambda m: m["start"],
    )
    return {
        "generated_at": now.isoformat(),
        "election": next_election(now.date()),
        "hearings": upcoming,
        "bills": bills,
        "sources": _meta(council=council_meta, bills=bills_meta),
    }


# --- home -------------------------------------------------------------------

async def home_payload(store: FeedStore, now: datetime | None = None) -> dict[str, Any]:
    now = now or _now()
    (weather, weather_meta), (news, news_meta), sports, events = await asyncio.gather(
        store.get("weather"), store.get("news"), sports_payload(store, now), events_payload(store, now)
    )
    today_ids = {g["id"] for g in sports["today"]}
    strip = sports["today"] + [g for g in sports["live"] if g["id"] not in today_ids]
    upcoming = [e for day in events["days"] for e in day["events"] if not e["ongoing"]][:3]
    if len(upcoming) < 3:
        upcoming += events["later"][: 3 - len(upcoming)]
    return {
        "generated_at": now.isoformat(),
        "weather": weather,
        "sports_today": strip,
        "headlines": news,
        "upcoming_events": upcoming,
        "sources": {
            "weather": weather_meta.as_dict(),
            "news": news_meta.as_dict(),
            **sports["sources"],
            **events["sources"],
        },
    }
