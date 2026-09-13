"""Tests for the reserve prediction API."""


VALID_PAYLOAD = {
    "ore_grade": 42.5,
    "depth": 85.0,
    "density": 3.8,
    "rock_type": "sedimentary",
}


def test_reserve_predict_success(client):
    """POST /api/v1/reserve/predict returns a prediction with the mock ML."""
    resp = client.post("/api/v1/reserve/predict", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["estimated_reserve"] is not None
    assert body["data"]["potential"] is not None
    assert body["data"]["confidence"] is not None


def test_reserve_predict_invalid_depth(client):
    """Depth must be positive — Pydantic rejects zero or negative."""
    payload = {**VALID_PAYLOAD, "depth": -10}
    resp = client.post("/api/v1/reserve/predict", json=payload)
    assert resp.status_code == 422


def test_reserve_predict_missing_field(client):
    """Missing required field returns 422."""
    payload = {"ore_grade": 42.5, "depth": 85.0}
    resp = client.post("/api/v1/reserve/predict", json=payload)
    assert resp.status_code == 422


def test_reserve_predict_invalid_type(client):
    """Wrong data type returns 422."""
    payload = {**VALID_PAYLOAD, "ore_grade": "not_a_number"}
    resp = client.post("/api/v1/reserve/predict", json=payload)
    assert resp.status_code == 422


def test_reserve_predict_ml_unavailable(client_no_ml):
    """Returns 503 when the ML interface is not connected."""
    resp = client_no_ml.post("/api/v1/reserve/predict", json=VALID_PAYLOAD)
    assert resp.status_code == 503
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "ML_SERVICE_UNAVAILABLE"
