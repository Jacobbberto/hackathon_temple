"""Sample payloads for demo mode and for sources that have never answered.

Everything is generated relative to "now" so a demo always looks current. Responses that
use this data are flagged `status: "sample"` and the app shows a "Demo data" badge, so
nobody mistakes a made-up score or headline for the real thing.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta
from typing import Any

from .config import PHILLY_TZ
from .teams import TEAMS_BY_KEY, broadcaster


def _now() -> datetime:
    return datetime.now(PHILLY_TZ).replace(second=0, microsecond=0)


def weather() -> dict[str, Any]:
    now = _now()
    day = lambda n: (now + timedelta(days=n)).date().isoformat()  # noqa: E731
    return {
        "observed_at": now.isoformat(),
        "temp_f": 68,
        "feels_like_f": 67,
        "humidity": 58,
        "wind_mph": 7,
        "is_day": 6 <= now.hour < 19,
        "condition": "Partly cloudy",
        "icon": "partly-cloudy",
        "code": 2,
        "high_f": 72,
        "low_f": 58,
        "precip_chance": 10,
        "sunrise": f"{day(0)}T06:58",
        "sunset": f"{day(0)}T18:52",
        "outlook": [
            {"date": day(1), "high_f": 75, "low_f": 60, "condition": "Mostly clear", "icon": "clear", "precip_chance": 5},
            {"date": day(2), "high_f": 70, "low_f": 61, "condition": "Rain showers", "icon": "rain", "precip_chance": 70},
            {"date": day(3), "high_f": 66, "low_f": 55, "condition": "Overcast", "icon": "cloudy", "precip_chance": 20},
        ],
    }


def news() -> list[dict[str, Any]]:
    now = time.time()
    stories = [
        ("What to know before you ride SEPTA this week", "A rundown of detours, schedule tweaks and weekend shuttle buses across the system."),
        ("Where to find the best water ice as the warm weather hangs on", "Neighborhood stands are stretching the season. Here's how locals rank them."),
        ("City Council returns: the bills to watch this session", "Housing, transit and public safety top the agenda as members head back to Room 400."),
        ("Your guide to this weekend's street closures", "Races, block parties and construction will reroute traffic in Center City and beyond."),
        ("A new mural is going up in Fishtown. Meet the artists", "Mural Arts' latest project brings neighbors together on a wall off Frankford Ave."),
        ("Schuylkill River Trail: what's open and what's next", "Progress on the trail connections that will link more neighborhoods to the river."),
        ("How Philly's libraries are expanding weekend hours", "More branches will stay open on Saturdays under a new pilot."),
        ("The Italian Market's newest vendors keep the tradition going", "Ninth Street welcomes a new generation of butchers, bakers and cheesemongers."),
    ]
    return [
        {
            "id": f"sample-news-{i}",
            "title": title,
            "snippet": snippet,
            "url": "https://github.com/jacobbberto/hackathon_temple#data-sources",
            "source": "Demo feed",
            "published_at": now - (i * 2 + 1) * 3600,
            "image_url": None,
        }
        for i, (title, snippet) in enumerate(stories)
    ]


def _game(team_key: str, opp: tuple[str, str, str], start: datetime, state: str, detail: str,
          ours: int | None = None, theirs: int | None = None, home: bool = True, venue: str | None = None,
          tv: str | None = None) -> dict[str, Any]:
    team = TEAMS_BY_KEY[team_key]
    result = None
    if state == "post" and ours is not None and theirs is not None:
        result = "W" if ours > theirs else "L" if ours < theirs else "T"
    tv_name = tv or team.default_tv or "FOX"
    return {
        "id": f"sample-{team_key}-{start:%m%d%H}",
        "team": team_key,
        "team_name": team.name,
        "league": team.endpoints[0].label,
        "opponent": {"name": opp[0], "short_name": opp[1], "abbr": opp[2]},
        "is_home": home,
        "start_time": start.isoformat(),
        "state": state,
        "detail": detail,
        "team_score": ours,
        "opponent_score": theirs,
        "result": result,
        "venue": venue,
        "broadcasts": [broadcaster(tv_name)],
        "broadcast_is_typical": tv is None,
        "game_url": "https://www.espn.com",
        "recap_url": "https://www.espn.com" if state == "post" else None,
    }


def games() -> list[dict[str, Any]]:
    now = _now()
    at = lambda days, hour, minute=0: (now + timedelta(days=days)).replace(hour=hour, minute=minute)  # noqa: E731
    return [
        _game("phillies", ("Atlanta Braves", "Braves", "ATL"), now - timedelta(hours=2), "in", "Bot 7th",
              5, 3, venue="Citizens Bank Park"),
        _game("union", ("New York Red Bulls", "Red Bulls", "NY"), now - timedelta(minutes=40), "in", "38'",
              1, 0, venue="Subaru Park"),
        _game("eagles", ("Dallas Cowboys", "Cowboys", "DAL"), at(1, 16, 25), "pre", "Sun 4:25 PM",
              home=True, venue="Lincoln Financial Field", tv="FOX"),
        _game("flyers", ("New York Rangers", "Rangers", "NYR"), at(2, 19), "pre", "7:00 PM",
              home=False, venue="Madison Square Garden"),
        _game("sixers", ("Boston Celtics", "Celtics", "BOS"), at(4, 19, 30), "pre", "7:30 PM",
              venue="Xfinity Mobile Arena"),
        _game("temple", ("Navy Midshipmen", "Navy", "NAVY"), at(6, 12), "pre", "12:00 PM",
              venue="Lincoln Financial Field"),
        _game("eagles", ("New York Giants", "Giants", "NYG"), at(-6, 13), "post", "Final",
              31, 17, home=False, venue="MetLife Stadium", tv="CBS"),
        _game("phillies", ("New York Mets", "Mets", "NYM"), at(-1, 18, 45), "post", "Final",
              6, 4, venue="Citizens Bank Park"),
        _game("temple", ("UConn Huskies", "UConn", "CONN"), at(-7, 15, 30), "post", "Final",
              24, 27, venue="Lincoln Financial Field"),
        _game("union", ("D.C. United", "D.C. United", "DC"), at(-4, 19, 30), "post", "FT",
              2, 2, home=False, venue="Audi Field"),
    ]


def council_calendar() -> list[dict[str, Any]]:
    now = _now()

    def next_weekday(weekday: int, hour: int) -> datetime:
        days = (weekday - now.weekday()) % 7 or 7
        return (now + timedelta(days=days)).replace(hour=hour, minute=0)

    return [
        {
            "id": "sample-meeting-1",
            "body": "City Council",
            "kind": "Session",
            "title": "Stated Meeting of City Council",
            "details": "Weekly session. Bills are introduced and voted on; public comment at the start.",
            "start": next_weekday(3, 10).isoformat(),
            "time_tbd": False,
            "location": "Room 400, City Hall",
            "url": "https://phila.legistar.com/Calendar.aspx",
            "agenda_url": None,
        },
        {
            "id": "sample-meeting-2",
            "body": "Committee on Transportation and Public Utilities",
            "kind": "Hearing",
            "title": "Committee on Transportation and Public Utilities hearing",
            "details": "Sample hearing on transit service and street safety.",
            "start": next_weekday(1, 13).isoformat(),
            "time_tbd": False,
            "location": "Room 400, City Hall",
            "url": "https://phila.legistar.com/Calendar.aspx",
            "agenda_url": None,
        },
        {
            "id": "sample-meeting-3",
            "body": "Committee on Housing, Neighborhood Development and The Homeless",
            "kind": "Hearing",
            "title": "Committee on Housing, Neighborhood Development and The Homeless hearing",
            "details": "Sample hearing on housing affordability programs.",
            "start": next_weekday(2, 10).isoformat(),
            "time_tbd": False,
            "location": "Room 400, City Hall",
            "url": "https://phila.legistar.com/Calendar.aspx",
            "agenda_url": None,
        },
    ]


def bills() -> list[dict[str, Any]]:
    today = _now().date()
    rows = [
        ("Bill", "Introduced", 3, None,
         "An Ordinance amending Title 12 of The Philadelphia Code, entitled \"Traffic Code,\" by adding protected "
         "bike lane requirements on certain streets, all under certain terms and conditions.",
         "Changes the city's \"Traffic Code\" rules by adding protected bike lane requirements on certain streets."),
        ("Bill", "Passed", 20, 2,
         "An Ordinance amending Chapter 9-200 of The Philadelphia Code, entitled \"Commercial Activities on Streets,\" "
         "by further providing for sidewalk vending licenses, all under certain terms and conditions.",
         "Changes the city's \"Commercial Activities on Streets\" rules by further providing for sidewalk vending licenses."),
        ("Resolution", "Introduced", 5, None,
         "Resolution authorizing the Committee on Public Health and Human Services to hold hearings regarding "
         "extreme heat preparedness in rowhouse neighborhoods.",
         "Calls for Council hearings on extreme heat preparedness in rowhouse neighborhoods."),
        ("Bill", "Introduced", 10, None,
         "An Ordinance establishing a Vacant Lot Greening Program within the Department of Parks and Recreation.",
         "Creates a Vacant Lot Greening Program within the Department of Parks and Recreation."),
    ]
    return [
        {
            "id": f"sample-bill-{i}",
            "number": f"DEMO-{i + 1:03d}",
            "title": title,
            "summary": summary,
            "type": kind,
            "status": stage,
            "stage": stage,
            "introduced": (today - timedelta(days=intro_ago)).isoformat(),
            "passed": (today - timedelta(days=passed_ago)).isoformat() if passed_ago else None,
            "url": "https://phila.legistar.com/Legislation.aspx",
            "source": "City Council",
            "ceremonial": False,
        }
        for i, (kind, stage, intro_ago, passed_ago, title, summary) in enumerate(rows)
    ]


def shows() -> list[dict[str, Any]]:
    now = _now()
    at = lambda days, hour: (now + timedelta(days=days)).replace(hour=hour, minute=0)  # noqa: E731
    return [
        {
            "id": "sample-show-1",
            "title": "Demo: Indie rock night",
            "category": "concerts_shows",
            "start": at(1, 20).isoformat(),
            "end": None,
            "all_day": False,
            "location": "Fishtown",
            "url": "https://developer.ticketmaster.com/",
            "description": "Sample listing. Add a Ticketmaster key to see real shows.",
            "closure": None,
            "date_note": None,
            "source": "Demo data",
        },
        {
            "id": "sample-show-2",
            "title": "Demo: Jazz on South Street",
            "category": "concerts_shows",
            "start": at(3, 19).isoformat(),
            "end": None,
            "all_day": False,
            "location": "South Street",
            "url": "https://developer.ticketmaster.com/",
            "description": "Sample listing. Add a Ticketmaster key to see real shows.",
            "closure": None,
            "date_note": None,
            "source": "Demo data",
        },
        {
            "id": "sample-show-3",
            "title": "Demo: Neighborhood block party & 5K",
            "category": "races_runs",
            "start": at(2, 9).isoformat(),
            "end": None,
            "all_day": False,
            "location": "East Passyunk Ave",
            "url": "https://developer.ticketmaster.com/",
            "description": "Sample listing.",
            "closure": "Sample: East Passyunk Ave closed to cars 8 a.m. to 1 p.m.",
            "date_note": None,
            "source": "Demo data",
        },
    ]
