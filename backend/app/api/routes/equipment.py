"""Equipment status route."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.equipment import EquipmentItem, EquipmentResponse
from app.services.equipment_service import equipment_service

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.get(
    "/status",
    response_model=EquipmentResponse,
    summary="Get equipment status",
    description="Return the current operational status of all equipment.",
)
def get_equipment_status(
    db: Session = Depends(get_db),
) -> EquipmentResponse:
    """Retrieve equipment records from the database."""
    rows = equipment_service.get_all(db)
    return EquipmentResponse(
        success=True,
        data=[EquipmentItem(**r) for r in rows],
    )
