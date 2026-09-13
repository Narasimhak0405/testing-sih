"""Production prediction and history routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.production import (
    ProductionHistoryItem,
    ProductionHistoryResponse,
    ProductionPredictionData,
    ProductionPredictionRequest,
    ProductionPredictionResponse,
)
from app.services.production_service import production_service

router = APIRouter(prefix="/production", tags=["Production"])


@router.post(
    "/predict",
    response_model=ProductionPredictionResponse,
    summary="Predict future production",
    description=(
        "Accept operational metrics and return a production forecast "
        "via the ML integration interface."
    ),
)
def predict_production(
    request: ProductionPredictionRequest,
    db: Session = Depends(get_db),
) -> ProductionPredictionResponse:
    """Thin route — delegates entirely to the service layer."""
    result = production_service.predict(db, request)
    return ProductionPredictionResponse(
        success=True,
        data=ProductionPredictionData(**result),
    )


@router.get(
    "/history",
    response_model=ProductionHistoryResponse,
    summary="Get production history",
    description="Return historical production data with optional year and zone filters.",
)
def get_production_history(
    mining_zone_id: Optional[int] = Query(None, description="Filter by mining zone ID"),
    start_year: Optional[int] = Query(None, description="Start year (inclusive)"),
    end_year: Optional[int] = Query(None, description="End year (inclusive)"),
    db: Session = Depends(get_db),
) -> ProductionHistoryResponse:
    """Retrieve production history from the database."""
    rows = production_service.get_history(db, mining_zone_id, start_year, end_year)
    return ProductionHistoryResponse(
        success=True,
        data=[ProductionHistoryItem(**r) for r in rows],
    )
