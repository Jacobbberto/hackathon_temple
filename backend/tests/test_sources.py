from datetime import date, datetime, timedelta

from pulse.config import PHILLY_TZ
from pulse.elections import next_election
from pulse.sources.events import curated_events, normalize_ticketmaster
from pulse.sources.news import parse_feed, pick_headlines
from pulse.sources.politics import normalize_matter, normalize_meeting, rank_bills
from pulse.sources.sports import merge_games, parse_event, split_games
from pulse.sources.weather import normalize as normalize_weather
from pulse.summarize import summarize
from pulse.teams import TEAMS_BY_KEY


# --- summaries ---------------------------------------------------------------

def test_summarize_code_amendment_names_the_chapter():
    title = (
        "An Ordinance amending Chapter 9-200 of The Philadelphia Code, entitled “Commercial Activities on "
        "Streets,” by further providing for sidewalk vending, all under certain terms and conditions."
    )
    assert summarize(title) == (
        'Changes the city\'s "Commercial Activities on Streets" rules by further providing for sidewalk vending.'
    )


def test_summarize_zoning_hearing_and_generic_verbs():
    assert summarize(
        "An Ordinance amending the Philadelphia Zoning Maps by changing the zoning designations of certain areas "
        "of land located within an area bounded by Girard Avenue, 5th Street, Oxford Street and 2nd Street."
    ).startswith("Rezones land located within an area bounded by Girard Avenue")
    assert summarize(
        "Resolution authorizing the Committee on Transportation and Public Utilities to hold hearings regarding "
        "SEPTA reliability."
    ) == "Calls for Council hearings on SEPTA reliability."
    assert summarize("An Ordinance establishing a Vacant Lot Greening Fund.") == "Creates a Vacant Lot Greening Fund."


def test_summaries_stay_one_short_sentence():
    long_title = "An Ordinance authorizing the Commissioner of Streets to " + "construct things " * 40
    summary = summarize(long_title)
    assert len(summary) <= 171 and summary.endswith("…")


# --- elections ---------------------------------------------------------------

def test_next_election_general_2026():
    info = next_election(date(2026, 9, 26))
    assert info["name"] == "General Election"
    assert info["date"] == "2026-11-03"
    assert info["days_until"] == 38
    deadlines = {k["label"]: k["date"] for k in info["key_dates"]}
    assert deadlines["Voter registration deadline"] == "2026-10-19"
    assert deadlines["Mail ballot application deadline"] == "2026-10-27"


def test_next_election_rolls_to_municipal_primary():
    info = next_election(date(2026, 11, 4))
    assert info["name"] == "Municipal Primary"
    assert info["date"] == "2027-05-18"
    assert info["is_primary"] and info["note"]


# --- curated events ----------------------------------------------------------

def test_curated_rules():
    events = {e["title"]: e for e in curated_events(date(2026, 9, 26), date(2027, 1, 2))}
    assert events["Philadelphia Marathon"]["start"].startswith("2026-11-22")
    assert events["Thanksgiving Day Parade"]["start"].startswith("2026-11-26")
    assert events["Head of the Schuylkill Regatta"]["start"].startswith("2026-10-24")
    assert events["Mummers Parade"]["start"].startswith("2027-01-01")
    fridays = [e for e in curated_events(date(2026, 9, 26), date(2026, 12, 31)) if e["title"] == "First Friday in Old City"]
    assert [e["start"][:10] for e in fridays] == ["2026-10-02", "2026-11-06", "2026-12-04"]


def test_ticketmaster_skips_sports_and_duplicates():
    raw = {
        "_embedded": {
            "events": [
                {"id": "1", "name": "Band", "url": "u", "dates": {"start": {"dateTime": "2026-09-28T00:00:00Z"}},
                 "classifications": [{"segment": {"name": "Music"}, "genre": {"name": "Rock"}}],
                 "_embedded": {"venues": [{"name": "Union Transfer"}]}},
                {"id": "2", "name": "Band", "url": "u", "dates": {"start": {"dateTime": "2026-09-28T00:30:00Z"}},
                 "classifications": [{"segment": {"name": "Music"}}]},
                {"id": "3", "name": "Game", "dates": {"start": {"localDate": "2026-09-28"}},
                 "classifications": [{"segment": {"name": "Sports"}}]},
            ]
        }
    }
    events = normalize_ticketmaster(raw)
    assert len(events) == 1
    assert events[0]["location"] == "Union Transfer"
    assert events[0]["start"].startswith("2026-09-27T20:00")  # converted to Philly time


# --- news --------------------------------------------------------------------

RSS = """<?xml version="1.0"?><rss version="2.0"><channel><title>Local</title>
<item><title>Fresh story</title><link>https://example.com/a</link>
<description>&lt;p&gt;Some &lt;b&gt;HTML&lt;/b&gt; snippet&lt;/p&gt;</description>
<pubDate>Sat, 26 Sep 2026 20:00:00 GMT</pubDate></item>
<item><title>Old story</title><link>https://example.com/b</link>
<pubDate>Mon, 14 Sep 2026 20:00:00 GMT</pubDate></item>
</channel></rss>"""


def test_parse_feed_strips_html():
    items = parse_feed("Local", RSS)
    assert items[0]["title"] == "Fresh story"
    assert items[0]["snippet"] == "Some HTML snippet"


def test_pick_headlines_prefers_recent_and_caps_per_source():
    now = datetime(2026, 9, 26, 22, tzinfo=PHILLY_TZ).timestamp()
    items = [
        {"id": str(i), "title": f"Story {i}", "source": "A" if i < 5 else "B", "published_at": now - i * 600}
        for i in range(8)
    ]
    items.append({"id": "dup", "title": "Story 0!", "source": "B", "published_at": now})
    picked = pick_headlines(items, now=now)
    sources = [p["source"] for p in picked]
    assert sources.count("A") == 3
    assert len({p["title"].rstrip("!") for p in picked}) == len(picked)


# --- sports ------------------------------------------------------------------

def _espn_event(state="in", home_score="3", away_score="5", event_id="401", when="2026-09-26T22:05Z"):
    return {
        "id": event_id,
        "date": when,
        "links": [{"rel": ["summary", "desktop", "event"], "href": "https://www.espn.com/mlb/game/_/gameId/401"}],
        "competitions": [
            {
                "venue": {"fullName": "Citizens Bank Park"},
                "status": {"type": {"state": state, "shortDetail": "Top 7th" if state == "in" else "Final"}},
                "broadcasts": [{"market": "home", "names": ["NBCS-PHI"]}],
                "competitors": [
                    {"homeAway": "home", "team": {"id": "22", "abbreviation": "PHI", "displayName": "Philadelphia Phillies"},
                     "score": {"value": float(home_score), "displayValue": home_score}},
                    {"homeAway": "away", "team": {"id": "15", "abbreviation": "ATL", "displayName": "Atlanta Braves",
                                                  "shortDisplayName": "Braves"}, "score": away_score},
                ],
            }
        ],
    }


def test_parse_espn_event_live():
    team = TEAMS_BY_KEY["phillies"]
    game = parse_event(_espn_event(), team, team.endpoints[0])
    assert game["opponent"]["short_name"] == "Braves"
    assert (game["team_score"], game["opponent_score"]) == (3, 5)
    assert game["is_home"] and game["state"] == "in" and game["detail"] == "Top 7th"
    assert game["broadcasts"] == [{"name": "NBCS-PHI", "url": "https://www.nbcsportsphiladelphia.com"}]
    assert game["recap_url"] is None


def test_parse_espn_event_final_result():
    team = TEAMS_BY_KEY["phillies"]
    game = parse_event(_espn_event(state="post", home_score="6", away_score="2"), team, team.endpoints[0])
    assert game["result"] == "W"
    assert game["recap_url"]


def test_scoreboard_overrides_schedule_and_split():
    team = TEAMS_BY_KEY["phillies"]
    ep = team.endpoints[0]
    stale = parse_event(_espn_event(state="pre"), team, ep)
    fresh = parse_event(_espn_event(state="in"), team, ep)
    games = merge_games([stale], [fresh])
    now = datetime(2026, 9, 26, 19, 30, tzinfo=PHILLY_TZ)
    groups = split_games(games, now)
    assert [g["state"] for g in groups["live"]] == ["in"]
    assert len(groups["today"]) == 1 and not groups["upcoming"]


# --- weather / politics -------------------------------------------------------

def test_weather_normalize():
    raw = {
        "current": {"time": "2026-09-26T18:00", "temperature_2m": 71.2, "weather_code": 61, "is_day": 1},
        "daily": {
            "time": ["2026-09-26", "2026-09-27", "2026-09-28", "2026-09-29"],
            "weather_code": [61, 0, 3, 95],
            "temperature_2m_max": [74, 76, 70, 68],
            "temperature_2m_min": [60, 61, 59, 57],
            "precipitation_probability_max": [80, 0, 10, 60],
        },
    }
    weather = normalize_weather(raw)
    assert weather["condition"] == "Light rain" and weather["icon"] == "rain"
    assert weather["high_f"] == 74
    assert [d["icon"] for d in weather["outlook"]] == ["clear", "cloudy", "storm"]


def test_legistar_normalizers():
    meeting = normalize_meeting(
        {"EventId": 9, "EventBodyName": "City Council", "EventDate": "2026-10-01T00:00:00", "EventTime": "10:00 AM",
         "EventLocation": "Room 400, City Hall", "EventInSiteURL": "https://phila.legistar.com/x"}
    )
    assert meeting["kind"] == "Session"
    assert meeting["start"] == "2026-10-01T10:00:00-04:00"

    passed = normalize_matter({"MatterId": 1, "MatterFile": "260001", "MatterTypeName": "Bill",
                               "MatterTitle": "An Ordinance establishing a fund.", "MatterStatusName": "ENACTED",
                               "MatterIntroDate": "2026-09-10T00:00:00", "MatterPassedDate": "2026-09-24T00:00:00"})
    honor = normalize_matter({"MatterId": 2, "MatterTypeName": "Resolution",
                              "MatterTitle": "Resolution honoring the Phillie Phanatic.",
                              "MatterIntroDate": "2026-09-24T00:00:00"})
    assert passed["stage"] == "Passed" and passed["summary"] == "Creates a fund."
    assert honor["ceremonial"]
    assert rank_bills([honor, passed]) == [passed]


def test_elections_days_until_counts_from_today():
    today = datetime.now(PHILLY_TZ).date()
    info = next_election(today)
    assert info["days_until"] == (date.fromisoformat(info["date"]) - today).days
    assert info["days_until"] >= 0 and today + timedelta(days=info["days_until"]) == date.fromisoformat(info["date"])
