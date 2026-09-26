"""Local headlines from Philadelphia outlets' RSS feeds.

We keep only the headline, a short snippet and a link back: readers go to the outlet
for the full story.
"""

from __future__ import annotations

import asyncio
import calendar
import hashlib
import html
import re
import time
from typing import Any

import feedparser
import httpx

from ..config import Settings

MAX_HEADLINES = 8
MAX_PER_SOURCE = 3
SNIPPET_CHARS = 180
_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    text = html.unescape(_TAG_RE.sub(" ", value))
    return _WS_RE.sub(" ", text).strip()


def truncate(text: str, limit: int = SNIPPET_CHARS) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(",;:.-")
    return f"{cut}…"


def _published_ts(entry: Any) -> float | None:
    for key in ("published_parsed", "updated_parsed"):
        parsed = entry.get(key)
        if parsed:
            return float(calendar.timegm(parsed))
    return None


def _image(entry: Any) -> str | None:
    for key in ("media_content", "media_thumbnail"):
        for media in entry.get(key) or []:
            if media.get("url"):
                return media["url"]
    for link in entry.get("links") or []:
        if link.get("rel") == "enclosure" and str(link.get("type", "")).startswith("image"):
            return link.get("href")
    return None


def parse_feed(source: str, content: bytes | str) -> list[dict[str, Any]]:
    parsed = feedparser.parse(content)
    items = []
    for entry in parsed.entries:
        title = clean_text(entry.get("title"))
        url = entry.get("link")
        if not title or not url:
            continue
        items.append(
            {
                "id": hashlib.sha1(url.encode()).hexdigest()[:12],
                "title": title,
                "snippet": truncate(clean_text(entry.get("summary") or entry.get("description"))),
                "url": url,
                "source": source,
                "published_at": _published_ts(entry),
                "image_url": _image(entry),
            }
        )
    return items


def _title_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", title.lower())[:60]


def pick_headlines(items: list[dict[str, Any]], now: float | None = None, limit: int = MAX_HEADLINES) -> list[dict[str, Any]]:
    """Newest first, last 24h (widening to 48h on slow news days), deduped, max 3 per outlet."""
    now = now or time.time()
    dated = sorted((i for i in items if i.get("published_at")), key=lambda i: i["published_at"], reverse=True)

    for window_hours in (24, 48, 24 * 7):
        recent = [i for i in dated if now - i["published_at"] <= window_hours * 3600]
        if len(recent) >= limit // 2 or window_hours == 24 * 7:
            break

    picked, seen, per_source = [], set(), {}
    for item in recent:
        key = _title_key(item["title"])
        if key in seen or per_source.get(item["source"], 0) >= MAX_PER_SOURCE:
            continue
        seen.add(key)
        per_source[item["source"]] = per_source.get(item["source"], 0) + 1
        picked.append(item)
        if len(picked) >= limit:
            break
    return picked


async def _fetch_one(client: httpx.AsyncClient, source: str, url: str) -> list[dict[str, Any]]:
    resp = await client.get(url)
    resp.raise_for_status()
    return parse_feed(source, resp.content)


async def fetch_news(client: httpx.AsyncClient, settings: Settings) -> list[dict[str, Any]]:
    results = await asyncio.gather(
        *(_fetch_one(client, name, url) for name, url in settings.news_feeds), return_exceptions=True
    )
    items = [item for result in results if isinstance(result, list) for item in result]
    if not items:
        errors = [r for r in results if isinstance(r, Exception)]
        raise RuntimeError(f"no news feeds reachable ({len(errors)} errors)")
    return pick_headlines(items)
