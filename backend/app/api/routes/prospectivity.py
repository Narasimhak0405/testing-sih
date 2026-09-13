"""Manganese prospectivity grid API."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.prospectivity import ProspectivityGridRequest, ProspectivityGridResponse
from app.services.prospectivity_service import ProspectivityServiceError, prospectivity_service

router = APIRouter(prefix="/prospectivity", tags=["Manganese Prospectivity"])


@router.post(
    "/grid",
    response_model=ProspectivityGridResponse,
    summary="Generate manganese prospectivity screening grid",
    description="Combines Sentinel-2 scene evidence with Indian manganese reference/geological context. Screening only; field/XRF validation remains required.",
)
def prospectivity_grid(
    request: ProspectivityGridRequest,
    db: Session = Depends(get_db),
) -> ProspectivityGridResponse:
    try:
        result = prospectivity_service.build_grid(
            db,
            latitude=request.latitude,
            longitude=request.longitude,
            half_size_km=request.half_size_km,
            grid_size=request.grid_size,
            max_cloud_cover=request.max_cloud_cover,
        )
        return ProspectivityGridResponse(success=True, data=result)
    except ProspectivityServiceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
