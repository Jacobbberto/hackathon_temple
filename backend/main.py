"""PhillyPulse API: everything happening in Philly today, in four endpoints.

    uvicorn main:app --reload --host 0.0.0.0
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pulse.cache import Cache
from pulse.config import PHILLY_TZ, load_settings
from pulse.feeds import FeedStore
from pulse.views import FEEDS, events_payload, home_payload, politics_payload, sports_payload

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

settings = load_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    cache = Cache(settings.cache_path)
    store = FeedStore(cache=cache, settings=settings, feeds=FEEDS)
    app.state.store = store

    scheduler = None
    if settings.enable_scheduler and not settings.offline:
        scheduler = AsyncIOScheduler(timezone=PHILLY_TZ)
        now = datetime.now(PHILLY_TZ)
        for name, feed in FEEDS.items():
            # Refresh a little before the cache goes stale; warm everything up at boot.
            scheduler.add_job(
                store.refresh, "interval", seconds=max(feed.max_age * 0.9, 45), args=[name],
                id=f"refresh-{name}", next_run_time=now, max_instances=1, coalesce=True,
            )
        scheduler.start()

    yield

    if scheduler is not None:
        scheduler.shutdown(wait=False)
    await store.aclose()
    cache.close()


app = FastAPI(
    title="PhillyPulse API",
    description="Philadelphia's daily dashboard: news, events, sports, weather and civic info.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    return {"name": "PhillyPulse API", "endpoints": ["/home", "/events", "/sports", "/politics"], "go": "birds"}


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "offline": settings.offline}


@app.get("/home")
async def home() -> dict:
    return await home_payload(app.state.store)


@app.get("/events")
async def events() -> dict:
    return await events_payload(app.state.store)


@app.get("/sports")
async def sports() -> dict:
    return await sports_payload(app.state.store)


@app.get("/politics")
async def politics() -> dict:
    return await politics_payload(app.state.store)
