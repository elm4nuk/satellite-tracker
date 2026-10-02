from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"


class RootResponse(BaseModel):
    name: str
    status: str = "ok"
    health: str = "/health"
    tle: str = "/api/tle"
    docs: str = "/docs"


class TleResponse(BaseModel):
    tle: str = Field(description="Three-line satellite element records")
    source: str
    fetched_at: datetime
    cached: bool
    satellite_count: int = Field(ge=1)
