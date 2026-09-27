import asyncio

import pytest
from fastapi.testclient import TestClient

from pulse.cache import Cache
from pulse.config import Settings
from pulse.feeds import Feed, FeedDisabled, FeedStore


def _settings(tmp_path, offline=False) -> Settings:
    return Settings(
        cache_path=str(tmp_path / "cache.sqlite3"),
        offline=offline,
        enable_scheduler=False,
        http_timeout=1,
        ticketmaster_key=None,
        openstates_key=None,
        news_feeds=[],
        cors_origins=["*"],
    )


def _store(tmp_path, fetch, max_age=60.0):
    settings = _settings(tmp_path)
    feed = Feed("demo", fetch, max_age, sample=lambda: ["sample"])
    return FeedStore(cache=Cache(settings.cache_path), settings=settings, feeds={"demo": feed})


def test_store_serves_live_then_last_good_payload(tmp_path):
    calls = {"n": 0}

    async def flaky(client, settings):
        calls["n"] += 1
        if calls["n"] > 1:
            raise RuntimeError("upstream down")
        return ["fresh"]

    store = _store(tmp_path, flaky, max_age=0)
    data, meta = asyncio.run(store.get("demo"))
    assert (data, meta.status) == (["fresh"], "live")

    # Stale + failing upstream -> last good payload, flagged as cached.
    data, meta = asyncio.run(store.get("demo"))
    assert (data, meta.status) == (["fresh"], "cached")


def test_store_falls_back_to_sample_when_never_fetched(tmp_path):
    async def down(client, settings):
        raise RuntimeError("nope")

    data, meta = asyncio.run(_store(tmp_path, down).get("demo"))
    assert (data, meta.status) == (["sample"], "sample")


def test_store_reports_disabled_sources(tmp_path):
    async def needs_key(client, settings):
        raise FeedDisabled("add a key")

    data, meta = asyncio.run(_store(tmp_path, needs_key).get("demo"))
    assert (data, meta.status, meta.note) == ([], "off", "add a key")


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("PULSE_OFFLINE", "1")
    monkeypatch.setenv("PULSE_CACHE_PATH", str(tmp_path / "api.sqlite3"))
    import importlib

    import main

    importlib.reload(main)
    with TestClient(main.app) as c:
        yield c


def test_endpoints_in_demo_mode(client):
    home = client.get("/home").json()
    assert home["weather"]["temp_f"] is not None
    assert len(home["headlines"]) >= 5
    assert any(g["state"] == "in" for g in home["sports_today"])
    assert len(home["upcoming_events"]) == 3
    assert all(s["status"] == "sample" for s in home["sources"].values())

    sports = client.get("/sports").json()
    assert {"live", "upcoming", "recent", "teams"} <= sports.keys()
    assert len(sports["teams"]) == 6

    events = client.get("/events").json()
    assert [c["label"] for c in events["categories"]] == [
        "Parades & Festivals", "Races & Runs", "Civic/Political", "Concerts & Shows",
    ]
    assert events["days"] and all(day["events"] for day in events["days"])

    politics = client.get("/politics").json()
    assert politics["election"]["links"][0]["label"] == "Find your polling place"
    assert politics["bills"] and politics["hearings"]
