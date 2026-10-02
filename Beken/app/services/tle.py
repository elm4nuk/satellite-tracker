from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, replace
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)


class TleUnavailableError(RuntimeError):
    """Raised when no configured source can provide valid TLE data."""


@dataclass(frozen=True, slots=True)
class TleCatalog:
    tle: str
    source: str
    fetched_at: datetime
    cached: bool
    satellite_count: int


def normalize_tle(raw_text: str) -> tuple[str, int]:
    """Return normalized three-line TLE records and their record count."""
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    records: list[str] = []
    index = 0

    while index < len(lines):
        current = lines[index]

        if current.startswith("1 ") and index + 1 < len(lines) and lines[index + 1].startswith("2 "):
            catalog_number = current[2:7].strip() or "UNKNOWN"
            records.extend((f"NORAD {catalog_number}", current, lines[index + 1]))
            index += 2
            continue

        if (
            index + 2 < len(lines)
            and lines[index + 1].startswith("1 ")
            and lines[index + 2].startswith("2 ")
        ):
            name = current[2:].strip() if current.startswith("0 ") else current
            records.extend((name or "UNKNOWN", lines[index + 1], lines[index + 2]))
            index += 3
            continue

        index += 1

    count = len(records) // 3
    if count == 0:
        raise ValueError("response did not contain valid TLE records")

    return "\n".join(records), count


class TleService:
    def __init__(
        self,
        client: httpx.AsyncClient,
        sources: tuple[str, ...],
        cache_ttl_seconds: float,
    ) -> None:
        self._client = client
        self._sources = sources
        self._cache_ttl_seconds = cache_ttl_seconds
        self._cache: TleCatalog | None = None
        self._cache_time = 0.0
        self._refresh_lock = asyncio.Lock()

    def _cached_catalog(self, now: float) -> TleCatalog | None:
        if self._cache is None:
            return None
        if now - self._cache_time >= self._cache_ttl_seconds:
            return None
        return replace(self._cache, cached=True)

    async def get_catalog(self, force_refresh: bool = False) -> TleCatalog:
        now = time.monotonic()
        if not force_refresh and (cached := self._cached_catalog(now)) is not None:
            return cached

        async with self._refresh_lock:
            now = time.monotonic()
            if not force_refresh and (cached := self._cached_catalog(now)) is not None:
                return cached

            errors: list[str] = []
            for source in self._sources:
                try:
                    response = await self._client.get(source)
                    response.raise_for_status()
                    tle, satellite_count = normalize_tle(response.text)
                except (httpx.HTTPError, ValueError) as exc:
                    logger.warning("TLE source failed: %s (%s)", source, exc)
                    errors.append(f"{source}: {exc}")
                    continue

                catalog = TleCatalog(
                    tle=tle,
                    source=source,
                    fetched_at=datetime.now(timezone.utc),
                    cached=False,
                    satellite_count=satellite_count,
                )
                self._cache = catalog
                self._cache_time = time.monotonic()
                return catalog

            if self._cache is not None:
                logger.warning("All sources failed; serving stale TLE cache")
                return replace(self._cache, cached=True)

            detail = "; ".join(errors) if errors else "no TLE sources configured"
            raise TleUnavailableError(detail)
