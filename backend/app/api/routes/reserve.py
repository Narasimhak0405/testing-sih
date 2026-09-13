"""Reserve prediction route."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.reserve import (
    ReservePredictionData,
    ReservePredictionRequest,
    ReservePredictionResponse,
)
from app.services.reserve_service import reserve_service

router = APIRouter(prefix="/reserve", tags=["Reserve Prediction"])


@router.post(
    "/predict",
    response_model=ReservePredictionResponse,
    summary="Predict manganese reserve",
    description=(
        "Accept geological / exploration features and return a reserve "
        "prediction via the ML integration interface."
    ),
)
def predict_reserve(
    request: ReservePredictionRequest,
    db: Session = Depends(get_db),
) -> ReservePredictionResponse:
    """Thin route — delegates entirely to the service layer."""
    result = reserve_service.predict(db, request)
    return ReservePredictionResponse(
        success=True,
        data=ReservePredictionData(**result),
    )
