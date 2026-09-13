"""Concrete ML prediction implementation — loads trained models and runs inference.

This module replaces the placeholder interface with a real implementation that:
- Loads the production model (.pkl) from the ml/model/ directory
- Maps backend field names to ML feature names
- Runs predictions using scikit-learn via joblib
- Provides a heuristic-based reserve estimator (no trained model available yet)

The model is loaded in a background thread so the server starts accepting
requests immediately (parallel startup).
"""

from __future__ import annotations

import json
import logging
import os
import threading
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from app.services.ml_interface import MLPredictionInterface, MLServiceUnavailableError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature name mapping: backend schema → ML model feature names
# ---------------------------------------------------------------------------

PRODUCTION_FIELD_MAP: Dict[str, str] = {
    "previous_production": "previous_year_production",
    "rolling_2yr_production": "rolling_2yr_production",
    "rainfall_mm": "rainfall_mm",
    "soil_moisture": "soil_moisture",
    "temperature_c": "temperature_c",
    "downtime": "equipment_downtime_hours",
    "equipment_efficiency": "equipment_efficiency_pct",
    "blasting_delay_hours": "blasting_delay_hours",
    "working_hours_per_day": "working_hours_per_day",
    "number_of_equipment": "number_of_equipment",
    "mineral_value_tonnes": "mineral_value_tonnes",
}


class ProductionMLInterface(MLPredictionInterface):
    """Concrete ML interface that loads and runs the production .pkl model.

    The model is loaded lazily or via ``load_models()`` so the FastAPI
    lifespan hook can call it in a background thread.
    """

    def __init__(self, model_dir: str | Path) -> None:
        self._model_dir = Path(model_dir).resolve()
        self._production_model: Optional[Any] = None
        self._feature_names: Optional[list[str]] = None
        self._loaded = threading.Event()
        self._load_error: Optional[str] = None

    # ------------------------------------------------------------------
    # Model loading
    # ------------------------------------------------------------------

    def load_models(self) -> None:
        """Load all ML artefacts from disk.

        Safe to call from a background thread — sets ``_loaded`` event when
        done so prediction methods can wait for it.
        """
        try:
            model_path = self._model_dir / "production_model.pkl"
            features_path = self._model_dir / "production_features.json"

            if not model_path.exists():
                raise FileNotFoundError(f"Production model not found: {model_path}")

            logger.info("Loading production model from %s …", model_path)
            self._production_model = joblib.load(model_path)

            if features_path.exists():
                with open(features_path) as f:
                    self._feature_names = json.load(f)
                logger.info("Feature names loaded: %s", self._feature_names)
            else:
                # Fall back to the mapping keys in model order
                self._feature_names = list(PRODUCTION_FIELD_MAP.values())
                logger.warning(
                    "production_features.json not found — using default feature order"
                )

            logger.info("✅ Production model loaded successfully")
        except Exception as exc:
            self._load_error = str(exc)
            logger.error("❌ Failed to load ML models: %s", exc)
        finally:
            self._loaded.set()

    def _wait_for_model(self, timeout: float = 30.0) -> None:
        """Block until models are loaded (or load immediately if not yet started)."""
        if not self._loaded.is_set():
            self.load_models()
        if self._load_error:
            raise MLServiceUnavailableError(
                f"ML model failed to load: {self._load_error}"
            )

    # ------------------------------------------------------------------
    # Production prediction
    # ------------------------------------------------------------------

    def predict_production(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run production forecast using the trained model."""
        self._wait_for_model()

        if self._production_model is None:
            raise MLServiceUnavailableError("Production model is not loaded.")

        # Map backend field names → ML feature names
        ml_features: Dict[str, Any] = {}
        for backend_key, ml_key in PRODUCTION_FIELD_MAP.items():
            if backend_key in input_data:
                ml_features[ml_key] = input_data[backend_key]

        if "equipment_efficiency_pct" in ml_features:
            eff = float(ml_features["equipment_efficiency_pct"])
            # API may send a 0–1 ratio; the trained model uses percent (e.g. 83.1)
            if 0 < eff <= 1.0:
                ml_features["equipment_efficiency_pct"] = eff * 100.0

        feature_names = self._feature_names or list(PRODUCTION_FIELD_MAP.values())
        row = {name: float(ml_features.get(name, 0)) for name in feature_names}
        X = pd.DataFrame([row], columns=feature_names)

        # Run prediction
        prediction = self._production_model.predict(X)[0]

        # Attempt to get confidence from tree-based models
        confidence = self._get_confidence(X)

        return {
            "predicted_production": round(float(prediction), 2),
            "confidence": confidence,
            "prediction_year": input_data.get("prediction_year"),
        }

    def _get_confidence(self, X: pd.DataFrame) -> Optional[float]:
        """Try to extract a confidence score from tree-ensemble models.

        For RandomForest / GradientBoosting, computes the coefficient of
        variation across individual tree predictions.  Lower variance →
        higher confidence.
        """
        try:
            model = self._production_model
            # RandomForest: access individual estimators
            if hasattr(model, "estimators_"):
                x_vals = X.values if hasattr(X, "values") else X
                preds = np.array([t.predict(x_vals)[0] for t in model.estimators_])
                mean = np.mean(preds)
                std = np.std(preds)
                if mean != 0:
                    cv = std / abs(mean)
                    # Map CV → confidence: CV=0 → 1.0, CV≥0.5 → 0.0
                    confidence = max(0.0, min(1.0, 1.0 - 2.0 * cv))
                    return round(confidence, 4)
            return None
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Reserve prediction (heuristic — no trained model available)
    # ------------------------------------------------------------------

    def predict_reserve(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Heuristic reserve estimation based on geological features.

        Since no trained reserve model (.pkl) is available, this uses a
        simplified volumetric estimation:
            estimated_reserve = ore_grade/100 × depth × density × scaling_factor

        This will be replaced once the ML team provides a trained model.
        """
        ore_grade = input_data.get("ore_grade", 0)
        depth = input_data.get("depth", 0)
        density = input_data.get("density", 0)

        # Simple volumetric heuristic (scaled to million tonnes)
        SCALING_FACTOR = 0.001
        estimated_reserve = round(
            (ore_grade / 100.0) * depth * density * SCALING_FACTOR, 4
        )

        # Classify potential
        if estimated_reserve > 0.5:
            potential = "HIGH"
        elif estimated_reserve > 0.1:
            potential = "MEDIUM"
        else:
            potential = "LOW"

        return {
            "estimated_reserve": estimated_reserve,
            "potential": potential,
            "confidence": 0.6,  # heuristic — fixed moderate confidence
        }

    # ------------------------------------------------------------------
    # Availability
    # ------------------------------------------------------------------

    def is_available(self) -> bool:
        """Return True once models have loaded successfully."""
        if not self._loaded.is_set():
            self.load_models()
        return self._loaded.is_set() and self._load_error is None
