"""Pydantic schemas for the equipment status API."""

from typing import List, Optional

from pydantic import BaseModel, Field


class EquipmentItem(BaseModel):
    """Single piece of equipment and its operational status."""

    id: int
    equipment_name: str = Field(..., description="Human-readable equipment name.")
    equipment_type: Optional[str] = Field(None, description="Category (e.g. Excavator, Drill).")
    status: Optional[str] = Field(
        None,
        description="Current status: OPERATIONAL | WARNING | MAINTENANCE | OFFLINE.",
    )
    operating_hours: Optional[float] = Field(None, description="Cumulative operating hours.")
    efficiency: Optional[float] = Field(None, description="Efficiency ratio (0–1).")
    last_maintenance: Optional[str] = Field(None, description="Date of last maintenance (YYYY-MM-DD).")
    mining_zone_id: Optional[int] = Field(None, description="ID of the mining zone where equipment operates.")
    zone_name: Optional[str] = Field(None, description="Name of the assigned mining zone.")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "equipment_name": "Excavator E01",
                    "equipment_type": "Excavator",
                    "status": "OPERATIONAL",
                    "operating_hours": 6840,
                    "efficiency": 0.87,
                    "last_maintenance": "2026-08-20",
                }
            ]
        }
    }


class ErrorDetail(BaseModel):
    """Structured error detail."""

    code: str
    message: str


class EquipmentResponse(BaseModel):
    """Envelope returned by ``GET /api/v1/equipment/status``."""

    success: bool
    data: List[EquipmentItem] = []
    error: Optional[ErrorDetail] = None
