"""Pydantic schemas for the production prediction & history APIs.

Updated for Smart India Hackathon (SIH) feature contract:
- 11 Environmental & Operational ML Features:
  - previous_production (previous_year_production)
  - rolling_2yr_production
  - rainfall_mm
  - soil_moisture
  - temperature_c
  - downtime (equipment_downtime_hours)
  - equipment_efficiency (equipment_efficiency_pct)
  - blasting_delay_hours
  - working_hours_per_day
  - number_of_equipment
  - mineral_value_tonnes
- Operational Targets:
  - planned_production
  - prediction_year
  - mining_zone_id
"""

from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Prediction — Request
# ---------------------------------------------------------------------------

class ProductionPredictionRequest(BaseModel):
    """Input payload for production forecast.

    Accepts weather, environmental, and operational features to feed the ML
    production forecasting model.
    """

    previous_production: float = Field(
        ...,
        gt=0,
        description="Previous-month production in metric tonnes. The final ExtraTrees model forecasts monthly production.",
        json_schema_extra={"example": 30824.0},
    )
    rolling_2yr_production: float = Field(
        ...,
        gt=0,
        description="Recent production average in metric tonnes, on the same monthly scale as the forecast.",
        json_schema_extra={"example": 30954.0},
    )
    rainfall_mm: float = Field(
        ...,
        ge=0,
        description="Monthly/seasonal precipitation in millimeters used as the weather input.",
        json_schema_extra={"example": 1200.0},
    )
    soil_moisture: float = Field(
        ...,
        ge=0,
        le=1.0,
        description="Soil moisture ratio (0.0 to 1.0).",
        json_schema_extra={"example": 0.55},
    )
    temperature_c: float = Field(
        ...,
        description="Average operational temperature in Celsius.",
        json_schema_extra={"example": 28.0},
    )
    downtime: float = Field(
        ...,
        ge=0,
        description="Total equipment downtime in hours.",
        json_schema_extra={"example": 400.0},
    )
    equipment_efficiency: float = Field(
        ...,
        gt=0,
        le=100.0,
        description=(
            "Equipment efficiency as a percent (0–100), matching ML feature "
            "equipment_efficiency_pct. Values ≤ 1.0 are treated as ratios and scaled."
        ),
        json_schema_extra={"example": 85.0},
    )
    blasting_delay_hours: float = Field(
        ...,
        ge=0,
        description="Cumulative blasting and clearance delays in hours.",
        json_schema_extra={"example": 30.0},
    )
    working_hours_per_day: float = Field(
        ...,
        gt=0,
        le=24.0,
        description="Active operating hours per shift/day.",
        json_schema_extra={"example": 9.0},
    )
    number_of_equipment: int = Field(
        ...,
        gt=0,
        description="Active heavy machinery units deployed in zone.",
        json_schema_extra={"example": 7},
    )
    mineral_value_tonnes: float = Field(
        ...,
        gt=0,
        description="Estimated value / benchmark volume in metric tonnes.",
        json_schema_extra={"example": 10000000.0},
    )
    planned_production: float = Field(
        ...,
        gt=0,
        description="Planned monthly production target in metric tonnes. Must use the same monthly scale as the model forecast.",
        json_schema_extra={"example": 33000.0},
    )
    prediction_year: int = Field(
        ...,
        description="Target year for the forecast.",
        json_schema_extra={"example": 2027},
    )
    mining_zone_id: Optional[int] = Field(
        None,
        description="Optional mining-zone ID to associate the prediction with.",
        json_schema_extra={"example": 1},
    )


# ---------------------------------------------------------------------------
# Prediction — Response
# ---------------------------------------------------------------------------

class ProductionPredictionData(BaseModel):
    """Production forecast result with shortfall and risk assessment."""

    predicted_production: Optional[float] = Field(
        None, description="Forecasted monthly production in metric tonnes."
    )
    shortfall_risk: Optional[str] = Field(
        None, description="Risk classification: LOW | MEDIUM | HIGH."
    )
    expected_shortfall: Optional[float] = Field(
        None, description="Expected shortfall in tonnes (planned - predicted)."
    )
    shortfall_percentage: Optional[float] = Field(
        None, description="Percentage of planned production at risk."
    )
    confidence: Optional[float] = Field(
        None, description="Tree-ensemble consensus confidence score (0-1), or null."
    )
    prediction_year: Optional[int] = Field(
        None, description="Target year for the forecast."
    )
    recommended_action: Optional[str] = Field(
        None, description="Prescriptive operational recommendation for dashboard."
    )


class ErrorDetail(BaseModel):
    """Structured error detail."""

    code: str
    message: str


class ProductionPredictionResponse(BaseModel):
    """Envelope returned by ``POST /api/v1/production/predict``."""

    success: bool
    data: Optional[ProductionPredictionData] = None
    error: Optional[ErrorDetail] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "data": {
                        "predicted_production": 1600000.0,
                        "shortfall_risk": "MEDIUM",
                        "expected_shortfall": 50000.0,
                        "shortfall_percentage": 3.03,
                        "confidence": 0.84,
                        "prediction_year": 2027,
                        "recommended_action": "Review equipment allocation and mine schedule",
                    },
                    "error": None,
                }
            ]
        }
    }


# ---------------------------------------------------------------------------
# History — Response
# ---------------------------------------------------------------------------

class ProductionHistoryItem(BaseModel):
    """Single year of production history."""

    year: int
    production: Optional[float] = None


class ProductionHistoryResponse(BaseModel):
    """Envelope returned by ``GET /api/v1/production/history``."""

    success: bool
    data: List[ProductionHistoryItem] = []
    error: Optional[ErrorDetail] = None
