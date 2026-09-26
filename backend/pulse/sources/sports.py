"""Philly scores and schedules from ESPN's public site API."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Any

import httpx

from ..config import PHILLY_TZ, Settings
from ..teams import TEAMS, Endpoint, Team, broadcaster

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports"
SCHEDULE_PAST = timedelta(days=10)
SCHEDULE_AHEAD = timedelta(days=21)

# ESPN web paths for fallback links, keyed by league path.
_WEB_PATHS = {
    "nfl": "nfl",
    "mlb": "mlb",
    "nba": "nba",
    "nhl": "nhl",
    "usa.1": "soccer",
    "college-football": "college-football",
    "mens-college-basketball": "mens-college-basketball",
}


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _score(competitor: dict[str, Any]) -> int | None:
    raw = competitor.get("score")
    if isinstance(raw, dict):
        raw = raw.get("displayValue", raw.get("value"))
    try:
        return int(float(raw))
    except (TypeError, ValueError):
        return None


def _is_us(competitor: dict[str, Any], endpoint: Endpoint) -> bool:
    team = competitor.get("team") or {}
    wanted = endpoint.team_id.lower()
    return wanted in {str(team.get("id", "")).lower(), str(team.get("abbreviation", "")).lower()}


def _broadcast_names(comp: dict[str, Any]) -> list[str]:
    names: list[str] = []
    for b in comp.get("broadcasts") or []:
        media = b.get("media") or {}
        if media.get("shortName"):
            names.append(media["shortName"])
        names.extend(b.get("names") or [])
    for b in comp.get("geoBroadcasts") or []:
        media = b.get("media") or {}
        if media.get("shortName"):
            names.append(media["shortName"])
    seen: set[str] = set()
    return [n for n in names if n and not (n.upper() in seen or seen.add(n.upper()))]


def _link(event: dict[str, Any], rel: str) -> str | None:
    for link in event.get("links") or []:
        if rel in (link.get("rel") or []) and link.get("href"):
            return link["href"]
    return None


def _result(state: str, us: dict[str, Any], them: dict[str, Any], ours: int | None, theirs: int | None) -> str | None:
    if state != "post" or ours is None or theirs is None:
        return None
    # Shootouts/penalties: trust ESPN's winner flag when exactly one side has it.
    if us.get("winner") is True and them.get("winner") is not True:
        return "W"
    if them.get("winner") is True and us.get("winner") is not True:
        return "L"
    return "W" if ours > theirs else "L" if ours < theirs else "T"


def parse_event(event: dict[str, Any], team: Team, endpoint: Endpoint) -> dict[str, Any] | None:
    comps = event.get("competitions") or []
    if not comps:
        return None
    comp = comps[0]
    competitors = comp.get("competitors") or []
    us = next((c for c in competitors if _is_us(c, endpoint)), None)
    them = next((c for c in competitors if c is not us), None)
    if us is None or them is None:
        return None

    status = comp.get("status") or event.get("status") or {}
    stype = status.get("type") or {}
    state = stype.get("state") or "pre"
    ours, theirs = _score(us), _score(them)
    opp = them.get("team") or {}

    names = _broadcast_names(comp)
    guessed = not names and bool(team.default_tv)
    if guessed:
        names = [team.default_tv]

    web = _WEB_PATHS.get(endpoint.league, endpoint.league)
    event_id = str(event.get("id") or comp.get("id"))
    game_url = _link(event, "summary") or _link(event, "event") or f"https://www.espn.com/{web}/game/_/gameId/{event_id}"
    recap_url = _link(event, "recap")
    if state == "post" and not recap_url:
        recap_url = game_url

    return {
        "id": event_id,
        "team": team.key,
        "team_name": team.name,
        "league": endpoint.label,
        "opponent": {
            "name": opp.get("displayName") or opp.get("name") or "TBD",
            "short_name": opp.get("shortDisplayName") or opp.get("name") or opp.get("abbreviation") or "TBD",
            "abbr": opp.get("abbreviation") or "",
        },
        "is_home": us.get("homeAway") == "home",
        "start_time": event.get("date") or comp.get("date"),
        "state": state,
        "detail": stype.get("shortDetail") or stype.get("detail") or stype.get("description") or "",
        "team_score": ours if state != "pre" else None,
        "opponent_score": theirs if state != "pre" else None,
        "result": _result(state, us, them, ours, theirs),
        "venue": (comp.get("venue") or {}).get("fullName"),
        "broadcasts": [broadcaster(n) for n in names],
        "broadcast_is_typical": guessed,
        "game_url": game_url,
        "recap_url": recap_url if state == "post" else None,
    }


def parse_events(payload: dict[str, Any], team: Team, endpoint: Endpoint) -> list[dict[str, Any]]:
    games = []
    for event in payload.get("events") or []:
        game = parse_event(event, team, endpoint)
        if game:
            games.append(game)
    return games


async def _get_json(client: httpx.AsyncClient, url: str, params: dict[str, str] | None = None) -> dict[str, Any]:
    resp = await client.get(url, params=params)
    resp.raise_for_status()
    return resp.json()


def _pairs() -> list[tuple[Team, Endpoint]]:
    return [(team, ep) for team in TEAMS for ep in team.endpoints]


async def _gather_games(tasks: list[Any], pairs: list[tuple[Team, Endpoint]]) -> list[dict[str, Any]]:
    results = await asyncio.gather(*tasks, return_exceptions=True)
    if all(isinstance(r, Exception) for r in results):
        raise RuntimeError(f"ESPN unreachable: {results[0]}")
    games: list[dict[str, Any]] = []
    for (team, ep), result in zip(pairs, results):
        if not isinstance(result, Exception):
            games.extend(parse_events(result, team, ep))
    return games


async def fetch_schedule(client: httpx.AsyncClient, settings: Settings) -> list[dict[str, Any]]:
    """Each team's season schedule, trimmed to a window around today. Refreshed every ~15 min."""
    pairs = _pairs()
    tasks = [_get_json(client, f"{ESPN_BASE}/{ep.sport}/{ep.league}/teams/{ep.team_id}/schedule") for _, ep in pairs]
    games = await _gather_games(tasks, pairs)
    now = datetime.now(PHILLY_TZ)
    kept = []
    for g in games:
        start = parse_time(g["start_time"])
        if start and now - SCHEDULE_PAST <= start <= now + SCHEDULE_AHEAD:
            kept.append(g)
    return kept


async def fetch_scoreboard(client: httpx.AsyncClient, settings: Settings) -> list[dict[str, Any]]:
    """Today's scoreboards: the live-score source. Refreshed every minute."""
    today = datetime.now(PHILLY_TZ).strftime("%Y%m%d")
    pairs = _pairs()
    tasks = [
        _get_json(
            client,
            f"{ESPN_BASE}/{ep.sport}/{ep.league}/scoreboard",
            {"dates": today, **dict(ep.scoreboard_params)},
        )
        for _, ep in pairs
    ]
    return await _gather_games(tasks, pairs)


def merge_games(schedule: list[dict[str, Any]], scoreboard: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Scoreboard data is fresher, so it wins for any game present in both."""
    merged = {g["id"]: g for g in schedule}
    for g in scoreboard:
        merged[g["id"]] = g
    return list(merged.values())


def split_games(games: list[dict[str, Any]], now: datetime | None = None) -> dict[str, list[dict[str, Any]]]:
    now = now or datetime.now(PHILLY_TZ)
    today = now.astimezone(PHILLY_TZ).date()

    def start(g: dict[str, Any]) -> datetime:
        return parse_time(g["start_time"]) or now

    live = sorted((g for g in games if g["state"] == "in"), key=start)
    upcoming = sorted(
        (g for g in games if g["state"] == "pre" and now - timedelta(hours=4) <= start(g) <= now + timedelta(days=7)),
        key=start,
    )
    recent = sorted(
        (g for g in games if g["state"] == "post" and start(g) >= now - timedelta(days=7)),
        key=start,
        reverse=True,
    )
    todays = sorted((g for g in games if start(g).astimezone(PHILLY_TZ).date() == today), key=start)
    return {"live": live, "upcoming": upcoming[:15], "recent": recent[:15], "today": todays}
