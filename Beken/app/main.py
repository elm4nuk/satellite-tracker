from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, load_settings
from app.models import HealthResponse, RootResponse, TleResponse
from app.services.tle import TleService, TleUnavailableError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def get_tle_service(request: Request) -> TleService:
    return request.app.state.tle_service


def create_app(settings: Settings | None = None) -> FastAPI:
    current_settings = settings or load_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        timeout = httpx.Timeout(current_settings.request_timeout_seconds)
        headers = {
            "Accept": "text/plain",
            "User-Agent": "OrbitalSatelliteTracker/1.0",
        }
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers=headers,
        ) as client:
            application.state.tle_service = TleService(
                client=client,
                sources=current_settings.tle_sources,
                cache_ttl_seconds=current_settings.cache_ttl_seconds,
            )
            yield

    application = FastAPI(
        title=current_settings.app_name,
        version="1.0.0",
        description="Cached proxy for CelesTrak TLE data.",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(current_settings.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["Accept", "Content-Type"],
    )

    @application.get("/", response_model=RootResponse, tags=["system"])
    async def root() -> RootResponse:
        return RootResponse(name=current_settings.app_name)

    @application.get("/health", response_model=HealthResponse, tags=["system"])
    async def health() -> HealthResponse:
        return HealthResponse()

    @application.get("/api/tle", response_model=TleResponse, tags=["satellites"])
    async def get_tle(
        refresh: bool = Query(default=False, description="Bypass the in-memory cache"),
        service: TleService = Depends(get_tle_service),
    ) -> TleResponse:
        try:
            catalog = await service.get_catalog(force_refresh=refresh)
        except TleUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="TLE feed is temporarily unavailable",
            ) from exc

        return TleResponse(
            tle=catalog.tle,
            source=catalog.source,
            fetched_at=catalog.fetched_at,
            cached=catalog.cached,
            satellite_count=catalog.satellite_count,
        )

    return application


app = create_app()
