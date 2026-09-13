"""Comprehensive System Test Verdict Suite.

Validates all 6 core subsystems:
1. Health & Documentation
2. Database layer & Data queries
3. ML Prediction boundary (honesty check, 503 unavailable)
4. Centralized Error Envelope & Validation (400/404/422/503)
5. CORS policy across all development ports
6. Information leakage prevention
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def e2e_client():
    return TestClient(app)


def test_v1_health_and_docs(e2e_client):
    r1 = e2e_client.get("/health")
    assert r1.status_code == 200
    assert r1.json().get("status") == "healthy"

    r2 = e2e_client.get("/api/v1/health")
    assert r2.status_code == 200
    assert r2.json().get("database") == "connected"
    assert r2.json().get("ml_service") in ("available", "unavailable")

    r3 = e2e_client.get("/docs")
    assert r3.status_code == 200

    r4 = e2e_client.get("/redoc")
    assert r4.status_code == 200

    r5 = e2e_client.get("/openapi.json")
    assert r5.status_code == 200
    assert "AI-Based Manganese" in r5.json().get("info", {}).get("title", "")


def test_v2_mining_zones_data(e2e_client):
    resp = e2e_client.get("/api/v1/mining-zones")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 2
    for zone in body["data"]:
        assert "latitude" in zone
        assert "longitude" in zone
        assert isinstance(zone["latitude"], float)
        assert isinstance(zone["longitude"], float)


def test_v3_equipment_status_data(e2e_client):
    resp = e2e_client.get("/api/v1/equipment/status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 3
    valid_statuses = {"OPERATIONAL", "WARNING", "MAINTENANCE", "OFFLINE"}
    for eq in body["data"]:
        assert eq["status"] in valid_statuses
        assert "operating_hours" in eq


def test_v4_production_history_and_filtering(e2e_client):
    resp = e2e_client.get("/api/v1/production/history")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 5

    # Filtered query
    resp_filtered = e2e_client.get(
        "/api/v1/production/history?mining_zone_id=1&start_year=2021&end_year=2023"
    )
    assert resp_filtered.status_code == 200
    f_body = resp_filtered.json()
    assert len(f_body["data"]) == 3
    years = [item["year"] for item in f_body["data"]]
    assert years == [2021, 2022, 2023]


def test_v5_ml_prediction_boundary_honesty(e2e_client):
    # Reserve predict — if ML is available returns 200, otherwise 503
    r_res = e2e_client.post(
        "/api/v1/reserve/predict",
        json={
            "ore_grade": 42.5,
            "depth": 85.0,
            "density": 3.8,
            "rock_type": "sedimentary",
            "mining_zone_id": 1,
        },
    )
    if r_res.status_code == 503:
        assert r_res.json()["success"] is False
        assert r_res.json()["error"]["code"] == "ML_SERVICE_UNAVAILABLE"
    else:
        assert r_res.status_code == 200
        assert r_res.json()["success"] is True
        assert "estimated_reserve" in r_res.json()["data"]

    # Production predict — if ML is available returns 200, otherwise 503
    r_prod = e2e_client.post(
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
    if r_prod.status_code == 503:
        assert r_prod.json()["success"] is False
        assert r_prod.json()["error"]["code"] == "ML_SERVICE_UNAVAILABLE"
    else:
        assert r_prod.status_code == 200
        assert r_prod.json()["success"] is True


def test_v6_validation_and_error_envelope(e2e_client):
    # Invalid validation (422)
    resp_val = e2e_client.post(
        "/api/v1/reserve/predict",
        json={"ore_grade": 42.5, "depth": -10.0, "density": 3.8, "rock_type": ""},
    )
    assert resp_val.status_code == 422
    b_val = resp_val.json()
    assert b_val["success"] is False
    assert b_val["error"]["code"] == "VALIDATION_ERROR"
    assert "message" in b_val["error"]

    # 404 Not Found
    resp_404 = e2e_client.get("/api/v1/nonexistent-route")
    assert resp_404.status_code == 404
    b_404 = resp_404.json()
    assert b_404["success"] is False
    assert b_404["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_v7_multi_port_cors(e2e_client):
    test_ports = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:9000",
    ]
    for origin in test_ports:
        resp = e2e_client.options(
            "/api/v1/reserve/predict",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == origin
        assert resp.headers.get("access-control-allow-credentials") == "true"

    # Disallowed origin
    disallowed = e2e_client.get(
        "/health", headers={"Origin": "http://unauthorized-domain.com"}
    )
    assert "access-control-allow-origin" not in disallowed.headers


def test_v8_leakage_prevention(e2e_client):
    # Check that error responses do not leak system internals
    resp = e2e_client.post(
        "/api/v1/reserve/predict",
        json={
            "ore_grade": 42.5,
            "depth": 85.0,
            "density": 3.8,
            "rock_type": "sedimentary",
        },
    )
    content = str(resp.json())
    assert "traceback" not in content.lower()
    assert "c:\\users" not in content.lower()
    assert "password" not in content.lower()
