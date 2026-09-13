"""Tests for centralized error handling."""


def test_404_unknown_route(client):
    """Unknown routes return 404 with structured error envelope."""
    resp = client.get("/api/v1/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_ml_unavailable_reserve(client_no_ml):
    """Reserve predict returns 503 when ML is unavailable."""
    resp = client_no_ml.post(
        "/api/v1/reserve/predict",
        json={
            "ore_grade": 42.5,
            "depth": 85.0,
            "density": 3.8,
            "rock_type": "sedimentary",
        },
    )
    assert resp.status_code == 503
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "ML_SERVICE_UNAVAILABLE"
    assert "message" in body["error"]


def test_ml_unavailable_production(client_no_ml):
    """Production predict returns 503 when ML is unavailable."""
    resp = client_no_ml.post(
        "/api/v1/production/predict",
        json={
            "previous_production": 1500000.0,
            "rolling_2yr_production": 1600000.0,
            "rainfall_mm": 1200.0,
            "soil_moisture": 0.55,
            "temperature_c": 28.0,
            "downtime": 400.0,
            "equipment_efficiency": 0.85,
            "blasting_delay_hours": 30.0,
            "working_hours_per_day": 9.0,
            "number_of_equipment": 7,
            "mineral_value_tonnes": 10000000.0,
            "planned_production": 33000.0,
            "prediction_year": 2027,
            "mining_zone_id": 1,
        },
    )
    assert resp.status_code == 503
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "ML_SERVICE_UNAVAILABLE"


def test_validation_error_format(client):
    """Pydantic validation errors return 422 with structured envelope."""
    resp = client.post(
        "/api/v1/reserve/predict",
        json={"ore_grade": "not_a_number"},
    )
    assert resp.status_code == 422
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_error_does_not_expose_internals(client_no_ml):
    """Error responses must not leak stack traces or internal paths."""
    resp = client_no_ml.post(
        "/api/v1/reserve/predict",
        json={
            "ore_grade": 42.5,
            "depth": 85.0,
            "density": 3.8,
            "rock_type": "sedimentary",
        },
    )
    body = resp.json()
    text = str(body)
    assert "Traceback" not in text
    assert "\\Users" not in text
    assert "password" not in text.lower()
