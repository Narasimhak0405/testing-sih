"""Train the production forecasting model from the SIH feature CSV."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "manganese_production_training.csv"
MODEL_DIR = ROOT / "model"
FEATURES_PATH = MODEL_DIR / "production_features.json"
MODEL_PATH = MODEL_DIR / "production_model.pkl"


def main() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    if FEATURES_PATH.exists():
        feature_names = json.loads(FEATURES_PATH.read_text(encoding="utf-8"))
    else:
        feature_names = [
            "previous_year_production",
            "rolling_2yr_production",
            "rainfall_mm",
            "soil_moisture",
            "temperature_c",
            "equipment_downtime_hours",
            "equipment_efficiency_pct",
            "blasting_delay_hours",
            "working_hours_per_day",
            "number_of_equipment",
            "mineral_value_tonnes",
        ]
        FEATURES_PATH.write_text(json.dumps(feature_names, indent=4), encoding="utf-8")

    df = pd.read_csv(DATA_PATH)
    X = df[feature_names]
    y = df["ore_mined_tonnes"]

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
        min_samples_leaf=2,
    )
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print(f"Wrote {MODEL_PATH}  (n={len(df)}, features={len(feature_names)})")


if __name__ == "__main__":
    main()
