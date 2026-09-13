"""ML Prediction Interface — abstraction boundary for ML model integration.

This module defines the contract between the backend services and the ML
models.  The backend **never** owns or loads ML models directly.  Instead it
calls methods on ``MLPredictionInterface``.

The ML team will provide a concrete implementation that replaces the
placeholder ``_PlaceholderMLInterface``.  Until then every call raises
``MLServiceUnavailableError`` so the API honestly returns HTTP 503.

Integration checklist for the ML team
--------------------------------------
1. Create a subclass of ``MLPredictionInterface``.
2. Implement ``predict_reserve`` and ``predict_production``.
3. Assign an instance to ``ml_prediction_interface`` in this module, or
   replace the ``get_ml_interface()`` factory.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------

class MLServiceUnavailableError(Exception):
    """Raised when the ML prediction service is not available."""

    pass


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------

class MLPredictionInterface(ABC):
    """Contract that every ML backend must satisfy."""

    @abstractmethod
    def predict_reserve(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Return reserve prediction for the given geological features.

        Parameters
        ----------
        input_data : dict
            Keys expected (initial contract):
            ``ore_grade``, ``depth``, ``density``, ``rock_type``.

        Returns
        -------
        dict
            Must contain at least:
            ``estimated_reserve`` (float | None),
            ``potential`` (str | None),
            ``confidence`` (float | None).
        """
        raise NotImplementedError

    @abstractmethod
    def predict_production(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Return production forecast for the given environmental & operational metrics.

        Parameters
        ----------
        input_data : dict
            Keys expected (SIH 11-feature model contract):
            ``previous_production``, ``rolling_2yr_production``,
            ``rainfall_mm``, ``soil_moisture``, ``temperature_c``,
            ``downtime``, ``equipment_efficiency``,
            ``blasting_delay_hours``, ``working_hours_per_day``,
            ``number_of_equipment``, ``mineral_value_tonnes``,
            ``planned_production``, ``prediction_year``.

        Returns
        -------
        dict
            Must contain at least:
            ``predicted_production`` (float | None),
            ``shortfall_risk`` (str | None),
            ``expected_shortfall`` (float | None),
            ``shortfall_percentage`` (float | None),
            ``confidence`` (float | None),
            ``prediction_year`` (int | None),
            ``recommended_action`` (str | None).
        """
        raise NotImplementedError

    def is_available(self) -> bool:
        """Return ``True`` if the ML service is ready to accept predictions."""
        return False


# ---------------------------------------------------------------------------
# Placeholder implementation — replaced once the ML team connects models
# ---------------------------------------------------------------------------

class _PlaceholderMLInterface(MLPredictionInterface):
    """Placeholder that always signals unavailability.

    **No fake predictions are returned.**
    """

    def predict_reserve(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        raise MLServiceUnavailableError(
            "Reserve prediction model is not currently available. "
            "The ML team has not yet connected a model implementation."
        )

    def predict_production(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        raise MLServiceUnavailableError(
            "Production prediction model is not currently available. "
            "The ML team has not yet connected a model implementation."
        )

    def is_available(self) -> bool:
        return False


# ---------------------------------------------------------------------------
# Singleton instance — uses real ML model loader when available
# ---------------------------------------------------------------------------

_ml_interface_instance: Optional[MLPredictionInterface] = None


def _create_ml_interface() -> MLPredictionInterface:
    """Create the ML interface — FINAL ExtraTrees model or fallback."""
    try:
        from app.services.ml_model_loader_final import FinalProductionMLInterface
        from app.config import get_settings

        settings = get_settings()
        interface = FinalProductionMLInterface(model_dir=settings.ML_MODEL_DIR)
        return interface
    except Exception as exc:
        logger.exception("Falling back to placeholder ML interface: %s", exc)
        return _PlaceholderMLInterface()


def set_ml_interface(instance: Optional[MLPredictionInterface]) -> None:
    """Override the singleton (used by tests)."""
    global _ml_interface_instance
    _ml_interface_instance = instance


def get_ml_interface() -> MLPredictionInterface:
    """Return the active ML prediction interface.

    Services should call this rather than accessing the module-level variable
    directly so that a future DI framework or test mock can override it.
    """
    global _ml_interface_instance
    if _ml_interface_instance is None:
        _ml_interface_instance = _create_ml_interface()
    return _ml_interface_instance
