"""Service layer for reserve predictions."""

from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.models.database_models import ReservePrediction
from app.schemas.reserve import ReservePredictionRequest
from app.services.ml_interface import get_ml_interface, MLServiceUnavailableError


class ReserveService:
    """Orchestrates reserve prediction: validate → predict → persist → return."""

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def predict(
        self,
        db: Session,
        request: ReservePredictionRequest,
    ) -> Dict[str, Any]:
        """Run a reserve prediction and store the result.

        Parameters
        ----------
        db : Session
            Active SQLAlchemy session (injected via FastAPI dependency).
        request : ReservePredictionRequest
            Validated input from the API layer.

        Returns
        -------
        dict
            ``{"estimated_reserve": ..., "potential": ..., "confidence": ...}``

        Raises
        ------
        MLServiceUnavailableError
            If the ML integration is not yet connected.
        """
        ml = get_ml_interface()

        # Build the payload the ML interface expects.
        input_data: Dict[str, Any] = {
            "ore_grade": request.ore_grade,
            "depth": request.depth,
            "density": request.density,
            "rock_type": request.rock_type,
        }

        # Call the ML interface (may raise MLServiceUnavailableError).
        result = ml.predict_reserve(input_data)

        # Persist the prediction.
        record = ReservePrediction(
            mining_zone_id=request.mining_zone_id,
            ore_grade=request.ore_grade,
            depth=request.depth,
            density=request.density,
            estimated_reserve=result.get("estimated_reserve"),
            potential=result.get("potential"),
            confidence=result.get("confidence"),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "estimated_reserve": result.get("estimated_reserve"),
            "potential": result.get("potential"),
            "confidence": result.get("confidence"),
        }


# Module-level convenience instance.
reserve_service = ReserveService()
