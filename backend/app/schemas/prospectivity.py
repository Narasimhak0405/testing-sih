"""Schemas for manganese prospectivity screening maps."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProspectivityGridRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    half_size_km: float = Field(12.0, gt=0, le=50)
    grid_size: int = Field(7, ge=3, le=15)
    max_cloud_cover: float = Field(20.0, ge=0, le=100)


class ProspectivityCell(BaseModel):
    id: str
    row: int
    col: int
    center: List[float]
    bounds: List[List[float]]
    score: float
    class_name: str
    satellite_score: Optional[float] = None
    geology_score: float
    occurrence_score: float
    nearest_reference: Optional[str] = None
    distance_to_reference_km: Optional[float] = None
    evidence: List[str] = []


class ProspectivityGridResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, str]] = None
