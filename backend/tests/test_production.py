"""Tests for the production prediction and history APIs."""

from app.models.database_models import ProductionHistory
from tests.conftest import TestSessionLocal


VALID_PAYLOAD = {
    "previous_production": 1500000.0,
    "rolling_2yr_production": 1600000.0,
    "rainfall_mm": 1200.0,
    "soil_moisture": 0.55,
    "temperature_c": 28.0,
    "downtime": 400.0,
    "equipment_efficiency": 85.0,
    "blasting_delay_hours": 30.0,
    "working_hours_per_day": 9.0,
    "number_of_equipment": 7,
    "mineral_value_tonnes": 10000000.0,
    "planned_production": 33000.0,
    "prediction_year": 2027,
    "mining_zone_id": 1,
}


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

def test_production_predict_success(client):
    """POST /api/v1/production/predict returns a forecast with the mock ML."""
    resp = client.post("/api/v1/production/predict", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["predicted_production"] == 1600000.0
    assert body["data"]["shortfall_risk"] == "MEDIUM"
    assert body["data"]["expected_shortfall"] == 50000.0
    assert body["data"]["shortfall_percentage"] == 3.03
    assert body["data"]["prediction_year"] == 2027
    assert "recommended_action" in body["data"]


def test_production_predict_invalid_efficiency(client):
    """equipment_efficiency must be in (0, 100]."""
    payload = {**VALID_PAYLOAD, "equipment_efficiency": 150}
    resp = client.post("/api/v1/production/predict", json=payload)
    assert resp.status_code == 422


def test_production_predict_missing_field(client):
    """Missing required field returns 422."""
    payload = {"previous_production": 72000}
    resp = client.post("/api/v1/production/predict", json=payload)
    assert resp.status_code == 422


def test_production_predict_ml_unavailable(client_no_ml):
    """Returns 503 when ML interface is not connected."""
    resp = client_no_ml.post("/api/v1/production/predict", json=VALID_PAYLOAD)
    assert resp.status_code == 503
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "ML_SERVICE_UNAVAILABLE"


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

def test_production_history_empty(client):
    """GET /api/v1/production/history returns empty list when no data."""
    resp = client.get("/api/v1/production/history")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_production_history_with_data(client, db_session):
    """GET /api/v1/production/history returns seeded data."""
    db_session.add(ProductionHistory(mining_zone_id=None, year=2020, production=62000))
    db_session.add(ProductionHistory(mining_zone_id=None, year=2021, production=66500))
    db_session.commit()

    resp = client.get("/api/v1/production/history")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 2


def test_production_history_filter_year(client, db_session):
    """GET /api/v1/production/history filters by start_year and end_year."""
    db_session.add(ProductionHistory(mining_zone_id=None, year=2019, production=55000))
    db_session.commit()

    resp = client.get("/api/v1/production/history?start_year=2020&end_year=2021")
    assert resp.status_code == 200
    for item in resp.json()["data"]:
        assert 2020 <= item["year"] <= 2021
