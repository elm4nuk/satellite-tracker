from __future__ import annotations

import asyncio

import httpx

from app.services.tle import TleService


SAMPLE_TLE = """ISS (ZARYA)
1 25544U 98067A   26001.00000000  .00000000  00000-0  00000-0 0  9999
2 25544  51.6400  10.0000 0001000  20.0000  30.0000 15.50000000000001
"""


def test_service_falls_back_and_then_uses_cache() -> None:
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        if "primary" in str(request.url):
            return httpx.Response(502, text="upstream unavailable")
        return httpx.Response(200, text=SAMPLE_TLE)

    async def scenario() -> tuple[bool, bool]:
        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as client:
            service = TleService(
                client=client,
                sources=("https://example.test/primary", "https://example.test/fallback"),
                cache_ttl_seconds=60,
            )
            first = await service.get_catalog()
            second = await service.get_catalog()
            return first.cached, second.cached

    first_cached, second_cached = asyncio.run(scenario())

    assert calls == ["https://example.test/primary", "https://example.test/fallback"]
    assert first_cached is False
    assert second_cached is True
