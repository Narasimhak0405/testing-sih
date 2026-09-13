"""Schemas for Sentinel-2 satellite scene discovery and screening."""
from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SatelliteAnalysisRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_cloud_cover: float = Field(20.0, ge=0, le=100)
    search_radius_degrees: float = Field(0.08, gt=0, le=1)


class SatelliteAnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, str]] = None
