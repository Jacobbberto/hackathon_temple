"""Pennsylvania election calendar, computed from the rules in the PA Election Code.

- Primary: third Tuesday in May.
- General / municipal election: the Tuesday after the first Monday in November.
- Voter registration closes 15 days before an election.
- Mail-in and absentee ballot applications are due 7 days before, by 5 p.m.
- Mail ballots must be received by 8 p.m. on Election Day. Polls are open 7 a.m. to 8 p.m.

Legislatures occasionally move a primary (PA did for 2024), so the official links are
always shown alongside the countdown.
"""

from __future__ import annotations

from datetime import date, timedelta

OFFICIAL_LINKS = [
    {"label": "Find your polling place", "url": "https://www.pavoterservices.pa.gov/Pages/PollingPlaceInfo.aspx"},
    {"label": "Check your registration", "url": "https://www.pavoterservices.pa.gov/Pages/voterregistrationstatus.aspx"},
    {"label": "Register to vote", "url": "https://www.pavoterservices.pa.gov/Pages/VoterRegistrationApplication.aspx"},
    {"label": "Apply for a mail ballot", "url": "https://www.pavoterservices.pa.gov/OnlineAbsenteeApplication/"},
    {"label": "Philadelphia City Commissioners", "url": "https://vote.phila.gov/"},
]


def _nth_weekday(year: int, month: int, weekday: int, n: int) -> date:
    first = date(year, month, 1)
    offset = (weekday - first.weekday()) % 7
    return first + timedelta(days=offset + 7 * (n - 1))


def elections_in(year: int) -> list[tuple[str, date]]:
    municipal = year % 2 == 1
    primary = _nth_weekday(year, 5, 1, 3)  # third Tuesday of May
    general = _nth_weekday(year, 11, 0, 1) + timedelta(days=1)  # Tuesday after first Monday
    return [
        ("Municipal Primary" if municipal else "General Primary", primary),
        ("Municipal Election" if municipal else "General Election", general),
    ]


def next_election(today: date) -> dict:
    candidates = elections_in(today.year) + elections_in(today.year + 1)
    name, day = next((n, d) for n, d in candidates if d >= today)
    key_dates = [
        ("Voter registration deadline", day - timedelta(days=15), "Last day to register or update your registration."),
        ("Mail ballot application deadline", day - timedelta(days=7), "Applications must be received by 5 p.m."),
        ("Election Day", day, "Polls open 7 a.m. to 8 p.m. Mail ballots due by 8 p.m."),
    ]
    return {
        "name": name,
        "date": day.isoformat(),
        "days_until": (day - today).days,
        "is_primary": "Primary" in name,
        "note": "Pennsylvania has closed primaries: only voters registered with a party vote in its primary."
        if "Primary" in name
        else None,
        "key_dates": [
            {"label": label, "date": d.isoformat(), "note": note, "passed": d < today, "days_until": (d - today).days}
            for label, d, note in key_dates
        ],
        "links": OFFICIAL_LINKS,
    }
