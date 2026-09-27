"""The home teams. ESPN ids/paths drive the scoreboard fetchers."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Endpoint:
    sport: str  # ESPN sport path, e.g. "football"
    league: str  # ESPN league path, e.g. "nfl"
    team_id: str  # ESPN team id or abbreviation
    label: str  # human league label shown on cards
    scoreboard_params: tuple[tuple[str, str], ...] = ()


@dataclass(frozen=True)
class Team:
    key: str
    name: str
    full_name: str
    primary: str
    secondary: str
    default_tv: str  # where games usually air when the feed doesn't say ("" = varies too much to guess)
    endpoints: tuple[Endpoint, ...]


TEAMS: tuple[Team, ...] = (
    Team("eagles", "Eagles", "Philadelphia Eagles", "#004C54", "#A5ACAF", "",
         (Endpoint("football", "nfl", "phi", "NFL"),)),
    Team("phillies", "Phillies", "Philadelphia Phillies", "#E81828", "#002D72", "NBC Sports Philadelphia",
         (Endpoint("baseball", "mlb", "phi", "MLB"),)),
    Team("sixers", "76ers", "Philadelphia 76ers", "#006BB6", "#ED174C", "NBC Sports Philadelphia",
         (Endpoint("basketball", "nba", "phi", "NBA"),)),
    Team("flyers", "Flyers", "Philadelphia Flyers", "#F74902", "#000000", "NBC Sports Philadelphia",
         (Endpoint("hockey", "nhl", "phi", "NHL"),)),
    Team("union", "Union", "Philadelphia Union", "#071B2C", "#B19B69", "Apple TV",
         (Endpoint("soccer", "usa.1", "10739", "MLS"),)),
    Team("temple", "Temple Owls", "Temple Owls", "#9D2235", "#FFFFFF", "ESPN+",
         (
             Endpoint("football", "college-football", "218", "NCAAF", (("groups", "80"),)),
             Endpoint("basketball", "mens-college-basketball", "218", "NCAAM", (("groups", "50"),)),
         )),
)

TEAMS_BY_KEY = {t.key: t for t in TEAMS}


def team_summary(team: Team) -> dict[str, str]:
    return {
        "key": team.key,
        "name": team.name,
        "full_name": team.full_name,
        "primary": team.primary,
        "secondary": team.secondary,
        "leagues": " · ".join(e.label for e in team.endpoints),
    }


# Official broadcaster -> where to stream/watch it.
BROADCASTER_LINKS: dict[str, str] = {
    "NBC": "https://www.nbc.com/live",
    "PEACOCK": "https://www.peacocktv.com",
    "CBS": "https://www.cbs.com/live-tv/stream",
    "PARAMOUNT+": "https://www.paramountplus.com",
    "FOX": "https://www.foxsports.com/live",
    "FS1": "https://www.foxsports.com/live",
    "ABC": "https://www.espn.com/watch/",
    "ESPN": "https://www.espn.com/watch/",
    "ESPN2": "https://www.espn.com/watch/",
    "ESPNU": "https://www.espn.com/watch/",
    "ESPN+": "https://www.espn.com/watch/",
    "ESPNEWS": "https://www.espn.com/watch/",
    "SEC NETWORK": "https://www.espn.com/watch/",
    "ACC NETWORK": "https://www.espn.com/watch/",
    "PRIME VIDEO": "https://www.primevideo.com",
    "NETFLIX": "https://www.netflix.com",
    "NFL NET": "https://www.nfl.com/network/watch/nfl-network-live",
    "NFL NETWORK": "https://www.nfl.com/network/watch/nfl-network-live",
    "MLB NETWORK": "https://www.mlb.com/network",
    "MLBN": "https://www.mlb.com/network",
    "MLB.TV": "https://www.mlb.com/tv",
    "NBA TV": "https://www.nba.com/watch",
    "APPLE TV": "https://tv.apple.com",
    "MLS SEASON PASS": "https://tv.apple.com",
    "NBC SPORTS PHILADELPHIA": "https://www.nbcsportsphiladelphia.com",
    "NBCS-PHI": "https://www.nbcsportsphiladelphia.com",
    "NBCSP": "https://www.nbcsportsphiladelphia.com",
    "NBCSP+": "https://www.nbcsportsphiladelphia.com",
    "6ABC": "https://6abc.com/watch/live/",
    "PHL17": "https://phl17.com",
}


def broadcaster(name: str) -> dict[str, str | None]:
    return {"name": name, "url": BROADCASTER_LINKS.get(name.strip().upper())}
