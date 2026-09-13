"""Frontend-facing ML prediction aliases.

``POST /api/v1/predict/production`` and ``POST /api/v1/predict/reserve``
forward the same payloads as the existing service routes so the React
app can send ML feature vectors and receive model output in one hop.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.production import (
    ProductionPredictionData,
    ProductionPredictionRequest,
    ProductionPredictionResponse,
)
from app.schemas.reserve import (
    ReservePredictionData,
    ReservePredictionRequest,
    ReservePredictionResponse,
)
from app.services.production_service import production_service
from app.services.reserve_service import reserve_service

router = APIRouter(prefix="/predict", tags=["ML Predict"])


@router.post(
    "/production",
    response_model=ProductionPredictionResponse,
    summary="Send operational features to the ML production model",
    description=(
        "Accepts the final ExtraTrees production features plus a monthly planned target, "
        "forwards them to the loaded .pkl model, and returns the forecast."
    ),
)
def predict_production_ml(
    request: ProductionPredictionRequest,
    db: Session = Depends(get_db),
) -> ProductionPredictionResponse:
    result = production_service.predict(db, request)
    return ProductionPredictionResponse(
        success=True,
        data=ProductionPredictionData(**result),
    )


@router.post(
    "/reserve",
    response_model=ReservePredictionResponse,
    summary="Send geological features to the reserve estimator",
    description=(
        "Accepts ore grade, depth, density, and rock type and returns "
        "estimated reserve, potential class, and confidence."
    ),
)
def predict_reserve_ml(
    request: ReservePredictionRequest,
    db: Session = Depends(get_db),
) -> ReservePredictionResponse:
    result = reserve_service.predict(db, request)
    return ReservePredictionResponse(
        success=True,
        data=ReservePredictionData(**result),
    )
