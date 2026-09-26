"""Feed registry: fetch -> normalize -> cache, with graceful fallbacks.

Every upstream source is a `Feed`. Requests never wait on a healthy cache, a failing
source falls back to its last good payload, and a source that has never worked falls
back to bundled sample data, so one bad feed can't take the whole app down.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Literal

import httpx

from .cache import Cache
from .config import Settings

log = logging.getLogger("pulse.feeds")

Status = Literal["live", "cached", "sample", "off"]
USER_AGENT = "PhillyPulse/1.0 (OwlHacks 2026; local news dashboard)"


class FeedDisabled(Exception):
    """The source isn't configured here (usually a missing API key)."""


FetchFn = Callable[[httpx.AsyncClient, Settings], Awaitable[Any]]


@dataclass
class Feed:
    name: str
    fetch: FetchFn
    max_age: float  # seconds before a cached payload counts as stale
    sample: Callable[[], Any]
    empty: Callable[[], Any] = list


@dataclass
class SourceMeta:
    status: Status
    updated_at: float | None = None
    note: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {"status": self.status, "updated_at": self.updated_at, "note": self.note}


@dataclass
class FeedStore:
    cache: Cache
    settings: Settings
    feeds: dict[str, Feed]
    retry_after: float = 60.0
    _locks: dict[str, asyncio.Lock] = field(default_factory=dict)
    _failed_at: dict[str, float] = field(default_factory=dict)
    _disabled: dict[str, str] = field(default_factory=dict)
    _client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.settings.http_timeout,
                follow_redirects=True,
                headers={"User-Agent": USER_AGENT},
            )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    def _lock(self, name: str) -> asyncio.Lock:
        return self._locks.setdefault(name, asyncio.Lock())

    async def refresh(self, name: str) -> bool:
        """Fetch a feed and cache it. Returns True on success."""
        if self.settings.offline:
            return False
        feed = self.feeds[name]
        async with self._lock(name):
            try:
                payload = await feed.fetch(self.client, self.settings)
            except FeedDisabled as exc:
                self._disabled[name] = str(exc)
                return False
            except Exception as exc:  # noqa: BLE001 - any upstream failure is non-fatal
                self._failed_at[name] = time.time()
                log.warning("feed %s failed: %s", name, exc)
                return False
            self._disabled.pop(name, None)
            self._failed_at.pop(name, None)
            self.cache.set(name, payload)
            return True

    async def get(self, name: str) -> tuple[Any, SourceMeta]:
        feed = self.feeds[name]
        if self.settings.offline:
            return feed.sample(), SourceMeta("sample", time.time(), "Demo mode: sample data")

        entry = self.cache.get(name)
        if entry is not None and entry.age < feed.max_age:
            return entry.payload, SourceMeta("live", entry.fetched_at)

        refreshed = False
        lock = self._lock(name)
        if lock.locked():
            # Someone (probably the scheduler) is already fetching; wait for them.
            async with lock:
                pass
        else:
            recently_failed = time.time() - self._failed_at.get(name, 0) < self.retry_after
            if not recently_failed:
                refreshed = await self.refresh(name)

        if name in self._disabled:
            return feed.empty(), SourceMeta("off", None, self._disabled[name])

        entry = self.cache.get(name)
        if entry is not None:
            status: Status = "live" if refreshed or entry.age < feed.max_age else "cached"
            return entry.payload, SourceMeta(status, entry.fetched_at)

        return feed.sample(), SourceMeta("sample", time.time(), "Source unreachable: showing sample data")
