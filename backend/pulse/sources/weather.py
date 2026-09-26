"""Weather from Open-Meteo (free, no key)."""

from __future__ import annotations

from typing import Any

import httpx

from ..config import PHILLY_LAT, PHILLY_LON, Settings

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather interpretation codes -> (label, icon key the app knows how to draw)
WMO_CODES: dict[int, tuple[str, str]] = {
    0: ("Clear sky", "clear"),
    1: ("Mostly clear", "clear"),
    2: ("Partly cloudy", "partly-cloudy"),
    3: ("Overcast", "cloudy"),
    45: ("Fog", "fog"),
    48: ("Freezing fog", "fog"),
    51: ("Light drizzle", "drizzle"),
    53: ("Drizzle", "drizzle"),
    55: ("Heavy drizzle", "drizzle"),
    56: ("Freezing drizzle", "drizzle"),
    57: ("Freezing drizzle", "drizzle"),
    61: ("Light rain", "rain"),
    63: ("Rain", "rain"),
    65: ("Heavy rain", "rain"),
    66: ("Freezing rain", "rain"),
    67: ("Freezing rain", "rain"),
    71: ("Light snow", "snow"),
    73: ("Snow", "snow"),
    75: ("Heavy snow", "snow"),
    77: ("Snow grains", "snow"),
    80: ("Rain showers", "rain"),
    81: ("Rain showers", "rain"),
    82: ("Violent rain showers", "rain"),
    85: ("Snow showers", "snow"),
    86: ("Heavy snow showers", "snow"),
    95: ("Thunderstorms", "storm"),
    96: ("Thunderstorms with hail", "storm"),
    99: ("Thunderstorms with hail", "storm"),
}


def describe(code: int | None) -> tuple[str, str]:
    if code is None:
        return ("Unknown", "cloudy")
    return WMO_CODES.get(int(code), ("Unknown", "cloudy"))


def _at(values: list[Any] | None, i: int) -> Any:
    if not values or i >= len(values):
        return None
    return values[i]


def normalize(raw: dict[str, Any]) -> dict[str, Any]:
    current = raw["current"]
    daily = raw["daily"]
    condition, icon = describe(current.get("weather_code"))

    days = []
    for i, date in enumerate(daily.get("time", [])):
        label, day_icon = describe(_at(daily.get("weather_code"), i))
        days.append(
            {
                "date": date,
                "high_f": _at(daily.get("temperature_2m_max"), i),
                "low_f": _at(daily.get("temperature_2m_min"), i),
                "condition": label,
                "icon": day_icon,
                "precip_chance": _at(daily.get("precipitation_probability_max"), i),
                "sunrise": _at(daily.get("sunrise"), i),
                "sunset": _at(daily.get("sunset"), i),
            }
        )

    today = days[0] if days else {}
    return {
        "observed_at": current.get("time"),
        "temp_f": current.get("temperature_2m"),
        "feels_like_f": current.get("apparent_temperature"),
        "humidity": current.get("relative_humidity_2m"),
        "wind_mph": current.get("wind_speed_10m"),
        "is_day": bool(current.get("is_day", 1)),
        "condition": condition,
        "icon": icon,
        "code": current.get("weather_code"),
        "high_f": today.get("high_f"),
        "low_f": today.get("low_f"),
        "precip_chance": today.get("precip_chance"),
        "sunrise": today.get("sunrise"),
        "sunset": today.get("sunset"),
        # Today is shown in the hero; the outlook is the next three days.
        "outlook": days[1:4],
    }


async def fetch_weather(client: httpx.AsyncClient, settings: Settings) -> dict[str, Any]:
    params = {
        "latitude": PHILLY_LAT,
        "longitude": PHILLY_LON,
        "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
        "temperature_unit": "fahrenheit",
        "wind_speed_unit": "mph",
        "timezone": "America/New_York",
        "forecast_days": 4,
    }
    resp = await client.get(OPEN_METEO_URL, params=params)
    resp.raise_for_status()
    return normalize(resp.json())
