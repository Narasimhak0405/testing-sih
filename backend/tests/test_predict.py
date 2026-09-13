"""Tests for POST /api/v1/predict/* ML alias endpoints."""

from tests.test_production import VALID_PAYLOAD as PRODUCTION_PAYLOAD
from tests.test_reserve import VALID_PAYLOAD as RESERVE_PAYLOAD


def test_predict_production_alias(client):
    resp = client.post("/api/v1/predict/production", json=PRODUCTION_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["predicted_production"] == 1600000.0
    assert body["data"]["shortfall_risk"] == "MEDIUM"


def test_predict_reserve_alias(client):
    resp = client.post("/api/v1/predict/reserve", json=RESERVE_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["estimated_reserve"] == 2.4
    assert body["data"]["potential"] == "HIGH"


def test_predict_production_alias_ml_unavailable(client_no_ml):
    resp = client_no_ml.post("/api/v1/predict/production", json=PRODUCTION_PAYLOAD)
    assert resp.status_code == 503
    assert resp.json()["error"]["code"] == "ML_SERVICE_UNAVAILABLE"
