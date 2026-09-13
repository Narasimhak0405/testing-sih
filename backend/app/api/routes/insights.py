"""AI Insights route."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.insights import InsightItem, InsightsResponse
from app.services.insights_service import insights_service

router = APIRouter(prefix="/insights", tags=["AI Insights"])


@router.get(
    "",
    response_model=InsightsResponse,
    summary="Get Explainable AI insights",
    description=(
        "Return dynamically synthesized geological and operational insights, "
        "including confidence scores, contributing factors, and action recommendations."
    ),
)
def get_insights(
    db: Session = Depends(get_db),
) -> InsightsResponse:
    """Retrieve synthesized AI insights from database telemetry and model outputs."""
    rows = insights_service.get_insights(db)
    return InsightsResponse(
        success=True,
        data=[InsightItem(**r) for r in rows],
    )
