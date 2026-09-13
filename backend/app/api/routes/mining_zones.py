from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.mining_zone import (
    MiningZoneCreate,
    MiningZoneDeleteData,
    MiningZoneDeleteResponse,
    MiningZoneItem,
    MiningZoneResponse,
    MiningZoneSingleResponse,
)
from app.services.mining_zone_service import mining_zone_service

router = APIRouter(prefix="/mining-zones", tags=["Mining Zones"])


@router.get(
    "",
    response_model=MiningZoneResponse,
    summary="Get all mining zones",
    description="Return mining-zone information including coordinates for map display.",
)
def get_mining_zones(
    db: Session = Depends(get_db),
) -> MiningZoneResponse:
    """Retrieve mining zones from the database."""
    rows = mining_zone_service.get_all(db)
    return MiningZoneResponse(
        success=True,
        data=[MiningZoneItem(**r) for r in rows],
    )


@router.post(
    "",
    response_model=MiningZoneSingleResponse,
    status_code=201,
    summary="Add a new mining zone",
    description="Create a new manganese mining zone with geospatial coordinates and geological characteristics.",
)
def create_mining_zone(
    data: MiningZoneCreate,
    db: Session = Depends(get_db),
) -> MiningZoneSingleResponse:
    """Create and persist a new mining zone."""
    new_zone = mining_zone_service.create(db, data)
    return MiningZoneSingleResponse(
        success=True,
        data=MiningZoneItem(**new_zone),
    )


@router.delete(
    "/{zone_id}",
    response_model=MiningZoneDeleteResponse,
    summary="Delete a mining zone",
    description="Remove a mining zone by ID from the system.",
)
def delete_mining_zone(
    zone_id: int,
    db: Session = Depends(get_db),
) -> MiningZoneDeleteResponse:
    """Delete a mining zone by ID."""
    success = mining_zone_service.delete(db, zone_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Mining zone with ID {zone_id} not found")
    return MiningZoneDeleteResponse(
        success=True,
        data=MiningZoneDeleteData(deleted=True, id=zone_id),
    )
