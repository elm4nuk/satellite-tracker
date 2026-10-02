from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import httpx

from app.main import create_app, get_tle_service
from app.services.tle import TleCatalog, TleUnavailableError, normalize_tle


SAMPLE_TLE = """ISS (ZARYA)
1 25544U 98067A   26001.00000000  .00000000  00000-0  00000-0 0  9999
2 25544  51.6400  10.0000 0001000  20.0000  30.0000 15.50000000000001
"""


class StubTleService:
    async def get_catalog(self, force_refresh: bool = False) -> TleCatalog:
        return TleCatalog(
            tle=SAMPLE_TLE.strip(),
            source="test-source",
            fetched_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            cached=not force_refresh,
            satellite_count=1,
        )


class FailingTleService:
    async def get_catalog(self, force_refresh: bool = False) -> TleCatalog:
        raise TleUnavailableError("upstream failed")


async def request(app, method: str, path: str, **kwargs) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        return await client.request(method, path, **kwargs)


def test_normalize_tle() -> None:
    tle, count = normalize_tle(SAMPLE_TLE)
    assert count == 1
    assert tle.startswith("ISS (ZARYA)\n1 25544")


def test_health_and_root() -> None:
    app = create_app()
    health = asyncio.run(request(app, "GET", "/health"))
    root = asyncio.run(request(app, "GET", "/"))

    assert health.json() == {"status": "ok"}
    assert root.status_code == 200
    assert root.json()["docs"] == "/docs"


def test_tle_contract_and_refresh_flag() -> None:
    app = create_app()
    app.dependency_overrides[get_tle_service] = lambda: StubTleService()

    response = asyncio.run(request(app, "GET", "/api/tle?refresh=true"))

    assert response.status_code == 200
    payload = response.json()
    assert payload["tle"].startswith("ISS (ZARYA)")
    assert payload["satellite_count"] == 1
    assert payload["cached"] is False


def test_upstream_failure_returns_503() -> None:
    app = create_app()
    app.dependency_overrides[get_tle_service] = lambda: FailingTleService()

    response = asyncio.run(request(app, "GET", "/api/tle"))

    assert response.status_code == 503
    assert response.json()["detail"] == "TLE feed is temporarily unavailable"


def test_cors_for_frontend() -> None:
    app = create_app()
    response = asyncio.run(
        request(
            app,
            "GET",
            "/health",
            headers={"Origin": "http://localhost:5173"},
        )
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
