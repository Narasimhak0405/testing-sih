"""Service layer for production predictions and production history."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.database_models import ProductionHistory, ProductionPrediction
from app.schemas.production import ProductionPredictionRequest
from app.services.ml_interface import get_ml_interface, MLServiceUnavailableError


class ProductionService:
    """Orchestrates production forecasting and history retrieval."""

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    def predict(
        self,
        db: Session,
        request: ProductionPredictionRequest,
    ) -> Dict[str, Any]:
        """Run a production forecast and store the result.

        Raises
        ------
        MLServiceUnavailableError
            If the ML integration is not yet connected.
        """
        ml = get_ml_interface()

        input_data: Dict[str, Any] = {
            "previous_production": request.previous_production,
            "rolling_2yr_production": request.rolling_2yr_production,
            "rainfall_mm": request.rainfall_mm,
            "soil_moisture": request.soil_moisture,
            "temperature_c": request.temperature_c,
            "downtime": request.downtime,
            "equipment_efficiency": request.equipment_efficiency,
            "blasting_delay_hours": request.blasting_delay_hours,
            "working_hours_per_day": request.working_hours_per_day,
            "number_of_equipment": request.number_of_equipment,
            "mineral_value_tonnes": request.mineral_value_tonnes,
            "planned_production": request.planned_production,
            "prediction_year": request.prediction_year,
            "mining_zone_id": request.mining_zone_id,
        }

        # The final ExtraTrees model predicts MONTHLY production. Reject an
        # obvious annual/monthly target mismatch so the dashboard never shows
        # a misleading ~95% shortfall caused by incompatible units.
        if request.planned_production > 500_000 and request.previous_production < 500_000:
            raise ValueError(
                "planned_production appears to be annual while the ExtraTrees model "
                "expects monthly production. Enter the monthly target in tonnes."
            )

        result = ml.predict_production(input_data)

        pred = result.get("predicted_production")
        planned = request.planned_production

        expected_shortfall = result.get("expected_shortfall")
        shortfall_pct = result.get("shortfall_percentage")
        shortfall_risk = result.get("shortfall_risk")
        recommended_action = result.get("recommended_action")

        if pred is not None and planned is not None and expected_shortfall is None:
            expected_shortfall = max(0.0, round(planned - pred, 2))
            shortfall_pct = round((expected_shortfall / planned) * 100.0, 2) if planned > 0 else 0.0
            if shortfall_risk is None:
                if shortfall_pct > 10.0:
                    shortfall_risk = "HIGH"
                    recommended_action = "Critical shortfall risk: optimize drill & blast cycle, deploy auxiliary haulers"
                elif shortfall_pct > 2.0:
                    shortfall_risk = "MEDIUM"
                    recommended_action = "Review equipment allocation and mine schedule"
                else:
                    shortfall_risk = "LOW"
                    recommended_action = "Operations on track: maintain regular fleet maintenance cycle"

        record = ProductionPrediction(
            mining_zone_id=request.mining_zone_id,
            predicted_production=pred,
            planned_production=planned,
            shortfall_risk=shortfall_risk,
            expected_shortfall=expected_shortfall,
            shortfall_percentage=shortfall_pct,
            confidence=result.get("confidence"),
            prediction_year=result.get("prediction_year", request.prediction_year),
            recommended_action=recommended_action,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "predicted_production": pred,
            "shortfall_risk": shortfall_risk,
            "expected_shortfall": expected_shortfall,
            "shortfall_percentage": shortfall_pct,
            "confidence": result.get("confidence"),
            "prediction_year": result.get("prediction_year", request.prediction_year),
            "recommended_action": recommended_action,
        }

    # ------------------------------------------------------------------
    # History
    # ------------------------------------------------------------------

    def get_history(
        self,
        db: Session,
        mining_zone_id: Optional[int] = None,
        start_year: Optional[int] = None,
        end_year: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Query production history with optional filters.

        Returns
        -------
        list[dict]
            Each dict has ``year`` and ``production``.
        """
        query = db.query(ProductionHistory)

        if mining_zone_id is not None:
            query = query.filter(ProductionHistory.mining_zone_id == mining_zone_id)
        if start_year is not None:
            query = query.filter(ProductionHistory.year >= start_year)
        if end_year is not None:
            query = query.filter(ProductionHistory.year <= end_year)

        query = query.order_by(ProductionHistory.year)
        rows = query.all()

        return [{"year": r.year, "production": r.production} for r in rows]


# Module-level convenience instance.
production_service = ProductionService()
