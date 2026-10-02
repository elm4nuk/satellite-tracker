from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
)

DEFAULT_TLE_SOURCES = (
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=TLE",
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=TLE",
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE",
)


def _csv_setting(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw_value = os.getenv(name)
    if not raw_value:
        return default
    return tuple(value.strip() for value in raw_value.split(",") if value.strip())


def _positive_float(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        value = float(raw_value)
    except ValueError as exc:
        raise ValueError(f"{name} must be a number") from exc

    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")
    return value


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str
    cors_origins: tuple[str, ...]
    cache_ttl_seconds: float
    request_timeout_seconds: float
    tle_sources: tuple[str, ...]


def load_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Orbital Satellite Tracker API"),
        cors_origins=_csv_setting("CORS_ORIGINS", DEFAULT_CORS_ORIGINS),
        cache_ttl_seconds=_positive_float("CACHE_TTL_SECONDS", 7200),
        request_timeout_seconds=_positive_float("REQUEST_TIMEOUT_SECONDS", 6),
        tle_sources=_csv_setting("TLE_SOURCE_URLS", DEFAULT_TLE_SOURCES),
    )
