"""Satellite imagery and remote-sensing analysis routes."""
from fastapi import APIRouter, HTTPException

from app.schemas.satellite import SatelliteAnalysisRequest, SatelliteAnalysisResponse
from app.services.satellite_service import SatelliteServiceError, satellite_service

router = APIRouter(prefix="/satellite", tags=["Satellite Analysis"])


@router.post(
    "/analyze",
    response_model=SatelliteAnalysisResponse,
    summary="Find a Sentinel-2 scene and compute transparent spectral screening indicators",
)
def analyze_satellite(request: SatelliteAnalysisRequest) -> SatelliteAnalysisResponse:
    try:
        result = satellite_service.analyze(
            latitude=request.latitude,
            longitude=request.longitude,
            start_date=request.start_date,
            end_date=request.end_date,
            max_cloud_cover=request.max_cloud_cover,
            search_radius_degrees=request.search_radius_degrees,
        )
        return SatelliteAnalysisResponse(success=True, data=result)
    except SatelliteServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
