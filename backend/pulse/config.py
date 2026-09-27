"""Runtime settings, read once from the environment (and an optional .env file)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

PHILLY_TZ = ZoneInfo("America/New_York")
# City Hall, give or take a Billy Penn hat brim.
PHILLY_LAT = 39.9526
PHILLY_LON = -75.1652

# Local outlets only. Override with NEWS_FEEDS="Name|url,Name|url".
DEFAULT_NEWS_FEEDS: list[tuple[str, str]] = [
    ("The Philadelphia Inquirer", "https://www.inquirer.com/arc/outboundfeeds/rss/?outputType=xml"),
    ("WHYY", "https://whyy.org/feed/"),
    ("Billy Penn", "https://billypenn.com/feed/"),
    ("PhillyVoice", "https://www.phillyvoice.com/feed/"),
    ("The Philadelphia Tribune", "https://www.phillytrib.com/search/?f=rss&t=article&c=news&l=25&s=start_time&sd=desc"),
]


def _flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _parse_feeds(raw: str | None) -> list[tuple[str, str]]:
    if not raw:
        return DEFAULT_NEWS_FEEDS
    feeds = []
    for chunk in raw.split(","):
        if "|" in chunk:
            name, url = chunk.split("|", 1)
            feeds.append((name.strip(), url.strip()))
    return feeds or DEFAULT_NEWS_FEEDS


@dataclass(frozen=True)
class Settings:
    cache_path: str
    offline: bool
    enable_scheduler: bool
    http_timeout: float
    ticketmaster_key: str | None
    openstates_key: str | None
    news_feeds: list[tuple[str, str]]
    cors_origins: list[str]


def load_settings() -> Settings:
    load_dotenv(BASE_DIR / ".env")
    return Settings(
        cache_path=os.getenv("PULSE_CACHE_PATH", str(BASE_DIR / "pulse_cache.sqlite3")),
        # Demo mode: never touch the network, serve sample data for everything.
        offline=_flag("PULSE_OFFLINE"),
        enable_scheduler=_flag("PULSE_SCHEDULER", default=True),
        http_timeout=float(os.getenv("PULSE_HTTP_TIMEOUT", "8")),
        ticketmaster_key=os.getenv("TICKETMASTER_API_KEY") or None,
        openstates_key=os.getenv("OPENSTATES_API_KEY") or None,
        news_feeds=_parse_feeds(os.getenv("NEWS_FEEDS")),
        cors_origins=[o.strip() for o in os.getenv("PULSE_CORS_ORIGINS", "*").split(",") if o.strip()],
    )
