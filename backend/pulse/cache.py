"""A tiny SQLite key/value cache so data survives restarts and slow sources never block a request."""

from __future__ import annotations

import json
import sqlite3
import threading
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class CacheEntry:
    payload: Any
    fetched_at: float

    @property
    def age(self) -> float:
        return time.time() - self.fetched_at


class Cache:
    def __init__(self, path: str):
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, payload TEXT NOT NULL, fetched_at REAL NOT NULL)"
        )
        self._conn.commit()

    def get(self, key: str) -> CacheEntry | None:
        with self._lock:
            row = self._conn.execute("SELECT payload, fetched_at FROM cache WHERE key = ?", (key,)).fetchone()
        if row is None:
            return None
        return CacheEntry(payload=json.loads(row[0]), fetched_at=row[1])

    def set(self, key: str, payload: Any, fetched_at: float | None = None) -> CacheEntry:
        entry = CacheEntry(payload=payload, fetched_at=fetched_at or time.time())
        with self._lock:
            self._conn.execute(
                "INSERT OR REPLACE INTO cache (key, payload, fetched_at) VALUES (?, ?, ?)",
                (key, json.dumps(payload, default=str), entry.fetched_at),
            )
            self._conn.commit()
        return entry

    def close(self) -> None:
        with self._lock:
            self._conn.close()
