"""End-to-End Integration Test Suite.

Validates that all backend API routes, database models, ML model loader,
and service integrations work seamlessly together.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.dependencies import get_db
from app.services.ml_interface import get_ml_interface, set_ml_interface
from app.services.ml_model_loader import ProductionMLInterface
from app.config import get_settings


from tests.conftest import TestSessionLocal, override_get_db
from app.models.database_models import Equipment, MiningZone, ProductionHistory


@pytest.fixture
def live_client():
    """Client configured with the real ProductionMLInterface and test DB."""
    settings = get_settings()
    real_ml = ProductionMLInterface(model_dir=settings.ML_MODEL_DIR)
    set_ml_interface(real_ml)

    # Seed test database with clean fixture data
    db = TestSessionLocal()
    try:
        db.query(Equipment).delete()
        db.query(ProductionHistory).delete()
        db.query(MiningZone).delete()
        db.commit()

        zones = [
            MiningZone(
                id=1,
                zone_name="Dongri Buzurg Sector 1",
                latitude=21.5312,
                longitude=79.6945,
                district="Bhandara",
                state="Maharashtra",
                mineral_type="Manganese",
                ore_grade=43.2,
                estimated_reserve=1.24,
                potential_level="HIGH",
            ),
            MiningZone(
                id=2,
                zone_name="Tirodi Deep Deposit",
                latitude=21.6789,
                longitude=79.7123,
                district="Balaghat",
                state="Madhya Pradesh",
                mineral_type="Manganese",
                ore_grade=41.5,
                estimated_reserve=0.88,
                potential_level="HIGH",
            ),
            MiningZone(
                id=3,
                zone_name="Ukwa East Horizon",
                latitude=21.9612,
                longitude=80.4631,
                district="Balaghat",
                state="Madhya Pradesh",
                mineral_type="Manganese",
                ore_grade=37.8,
                estimated_reserve=0.42,
                potential_level="MEDIUM",
            ),
        ]
        db.add_all(zones)
        db.commit()

        history = []
        for z in zones:
            for y in (2021, 2022, 2023, 2024, 2025):
                history.append(
                    ProductionHistory(
                        mining_zone_id=z.id,
                        year=y,
                        production=70000.0 + y,
                        ore_grade=z.ore_grade,
                    )
                )
        db.add_all(history)

        eqs = [
            Equipment(
                equipment_name="CAT 6020B Excavator",
                equipment_type="Excavator",
                mining_zone_id=1,
                status="OPERATIONAL",
                operating_hours=4280,
                efficiency=0.915,
                last_maintenance="2026-01-12",
            ),
            Equipment(
                equipment_name="Epiroc Pit Viper Drill",
                equipment_type="Drill Rig",
                mining_zone_id=2,
                status="WARNING",
                operating_hours=6120,
                efficiency=0.742,
                last_maintenance="2025-12-04",
            ),
            Equipment(
                equipment_name="Metso Crusher C160",
                equipment_type="Crusher",
                mining_zone_id=3,
                status="MAINTENANCE",
                operating_hours=5300,
                efficiency=0.65,
                last_maintenance="2026-08-30",
            ),
        ]
        db.add_all(eqs)
        db.commit()
    finally:
        db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    set_ml_interface(None)
    app.dependency_overrides.clear()


def test_e2e_health_checks(live_client):
    """Test both minimal and detailed health checks with live ML service."""
    r_liveness = live_client.get("/health")
    assert r_liveness.status_code == 200
    assert r_liveness.json()["status"] == "healthy"

    r_readiness = live_client.get("/api/v1/health")
    assert r_readiness.status_code == 200
    body = r_readiness.json()
    assert body["status"] == "healthy"
    assert body["database"] == "connected"
    assert body["ml_service"] == "available"


def test_e2e_mining_zones(live_client):
    """Test mining zones retrieval for geospatial mapping."""
    resp = live_client.get("/api/v1/mining-zones")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 3
    first_zone = body["data"][0]
    assert "zone_name" in first_zone
    assert "latitude" in first_zone
    assert "longitude" in first_zone
    assert "ore_grade" in first_zone
    assert first_zone["mineral_type"] == "Manganese"


def test_e2e_equipment_status_with_zones(live_client):
    """Test equipment telemetry returns assigned mining zone info."""
    resp = live_client.get("/api/v1/equipment/status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 3
    for eq in body["data"]:
        assert "equipment_name" in eq
        assert "status" in eq
        assert "operating_hours" in eq
        assert "efficiency" in eq
        # Confirm mining zone enrichment is present
        assert "mining_zone_id" in eq
        assert "zone_name" in eq
        if eq["mining_zone_id"] is not None:
            assert eq["zone_name"] is not None


def test_e2e_production_history(live_client):
    """Test production history queries and year range filtering."""
    resp = live_client.get("/api/v1/production/history")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 5

    # Filter by zone and years
    resp_filtered = live_client.get(
        "/api/v1/production/history?mining_zone_id=1&start_year=2022&end_year=2024"
    )
    assert resp_filtered.status_code == 200
    f_body = resp_filtered.json()
    assert len(f_body["data"]) == 3
    years = [item["year"] for item in f_body["data"]]
    assert years == [2022, 2023, 2024]


def test_e2e_production_predict_ml_live(live_client):
    """Test that live production ML model inference runs and predicts tonnages."""
    payload = {
        "previous_production": 1751000.0,
        "rolling_2yr_production": 1575500.0,
        "rainfall_mm": 1231.0,
        "soil_moisture": 0.563,
        "temperature_c": 28.9,
        "downtime": 660.1,
        "equipment_efficiency": 81.9,
        "blasting_delay_hours": 71.8,
        "working_hours_per_day": 9.1,
        "number_of_equipment": 7,
        "mineral_value_tonnes": 13100000.0,
        "planned_production": 33000.0,
        "prediction_year": 2027,
        "mining_zone_id": 1,
    }
    resp = live_client.post("/api/v1/predict/production", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["predicted_production"] is not None
    assert data["predicted_production"] > 0
    assert data["shortfall_risk"] in ("LOW", "MEDIUM", "HIGH")
    assert data["expected_shortfall"] is not None
    assert data["prediction_year"] == 2027
    assert data["recommended_action"] is not None


def test_e2e_reserve_predict_live(live_client):
    """Test reserve prediction returns volumetric & potential estimation."""
    payload = {
        "ore_grade": 43.2,
        "depth": 145.0,
        "density": 3.85,
        "rock_type": "sedimentary",
        "mining_zone_id": 1,
    }
    resp = live_client.post("/api/v1/predict/reserve", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["estimated_reserve"] is not None
    assert data["estimated_reserve"] > 0
    assert data["potential"] in ("LOW", "MEDIUM", "HIGH")
    assert data["confidence"] is not None


def test_e2e_ai_insights(live_client):
    """Test synthesized Explainable AI insights endpoint."""
    resp = live_client.get("/api/v1/insights")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    insights = body["data"]
    assert len(insights) >= 3
    for ins in insights:
        assert "id" in ins
        assert "zoneId" in ins
        assert "zoneName" in ins
        assert "title" in ins
        assert "type" in ins
        assert "confidence" in ins
        assert "summary" in ins
        assert "contributingFactors" in ins
        assert len(ins["contributingFactors"]) > 0
        assert "recommendation" in ins
