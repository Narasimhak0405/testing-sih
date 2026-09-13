"""Pydantic schemas for the mining-zones API."""

from typing import List, Optional

from pydantic import BaseModel, Field


class MiningZoneItem(BaseModel):
    """Single mining zone with location and geological summary."""

    id: int
    zone_name: str = Field(..., description="Display name of the mining zone.")
    latitude: float = Field(..., description="Latitude coordinate.")
    longitude: float = Field(..., description="Longitude coordinate.")
    district: Optional[str] = Field(None, description="Administrative district.")
    state: Optional[str] = Field(None, description="State / province.")
    mineral_type: Optional[str] = Field(None, description="Primary mineral (e.g. Manganese).")
    ore_grade: Optional[float] = Field(None, description="Average ore grade percentage.")
    estimated_reserve: Optional[float] = Field(
        None, description="Estimated reserve in million tonnes."
    )
    potential_level: Optional[str] = Field(
        None, description="Potential level (e.g. HIGH, MEDIUM, LOW)."
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "zone_name": "Zone A",
                    "latitude": 22.57,
                    "longitude": 88.36,
                    "district": "Example District",
                    "state": "Example State",
                    "mineral_type": "Manganese",
                    "ore_grade": 42.5,
                    "estimated_reserve": None,
                    "potential_level": None,
                }
            ]
        }
    }


class ErrorDetail(BaseModel):
    """Structured error detail."""

    code: str
    message: str


class MiningZoneCreate(BaseModel):
    """Payload to add a new mining zone."""

    zone_name: str = Field(..., min_length=1, max_length=255, description="Display name of the mining zone.")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinate.")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinate.")
    district: Optional[str] = Field(None, description="Administrative district.")
    state: Optional[str] = Field(None, description="State / province.")
    mineral_type: Optional[str] = Field("Manganese", description="Primary mineral.")
    ore_grade: Optional[float] = Field(None, ge=0.0, le=100.0, description="Average ore grade percentage.")
    estimated_reserve: Optional[float] = Field(None, ge=0.0, description="Estimated reserve in million tonnes.")
    potential_level: Optional[str] = Field("MEDIUM", description="Potential level (HIGH, MEDIUM, LOW).")


class MiningZoneResponse(BaseModel):
    """Envelope returned by ``GET /api/v1/mining-zones``."""

    success: bool
    data: List[MiningZoneItem] = []
    error: Optional[ErrorDetail] = None


class MiningZoneSingleResponse(BaseModel):
    """Envelope returned when creating or fetching a single mining zone."""

    success: bool
    data: Optional[MiningZoneItem] = None
    error: Optional[ErrorDetail] = None


class MiningZoneDeleteData(BaseModel):
    """Payload returned when deleting a zone."""

    deleted: bool
    id: int


class MiningZoneDeleteResponse(BaseModel):
    """Envelope returned by ``DELETE /api/v1/mining-zones/{zone_id}``."""

    success: bool
    data: Optional[MiningZoneDeleteData] = None
    error: Optional[ErrorDetail] = None
