"""Pydantic schemas for the reserve prediction API."""

from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class ReservePredictionRequest(BaseModel):
    """Input payload for reserve prediction.

    The frontend sends geological / exploration features.  The backend
    validates them and forwards to the ML integration interface.
    """

    ore_grade: float = Field(
        ...,
        description="Ore grade as a percentage (e.g. 42.5).",
        json_schema_extra={"example": 42.5},
    )
    depth: float = Field(
        ...,
        gt=0,
        description="Depth in metres. Must be positive.",
        json_schema_extra={"example": 85.0},
    )
    density: float = Field(
        ...,
        gt=0,
        description="Rock density (g/cm³). Must be positive.",
        json_schema_extra={"example": 3.8},
    )
    rock_type: str = Field(
        ...,
        min_length=1,
        description="Geological rock type (e.g. 'sedimentary').",
        json_schema_extra={"example": "sedimentary"},
    )
    mining_zone_id: Optional[int] = Field(
        None,
        description="Optional mining-zone ID to associate the prediction with.",
        json_schema_extra={"example": 1},
    )


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class ReservePredictionData(BaseModel):
    """Prediction result returned inside the response envelope."""

    estimated_reserve: Optional[float] = Field(
        None, description="Estimated reserve in million tonnes."
    )
    potential: Optional[str] = Field(
        None, description="Potential level (e.g. HIGH, MEDIUM, LOW)."
    )
    confidence: Optional[float] = Field(
        None, description="Model confidence score (0–1), or null if unavailable."
    )


class ErrorDetail(BaseModel):
    """Structured error detail."""

    code: str
    message: str


class ReservePredictionResponse(BaseModel):
    """Envelope returned by ``POST /api/v1/reserve/predict``."""

    success: bool
    data: Optional[ReservePredictionData] = None
    error: Optional[ErrorDetail] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "data": {
                        "estimated_reserve": 2.4,
                        "potential": "HIGH",
                        "confidence": 0.87,
                    },
                }
            ]
        }
    }
