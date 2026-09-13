"""Tests for the mining-zones API."""

from app.models.database_models import MiningZone
from tests.conftest import TestSessionLocal


def test_mining_zones_empty(client):
    """GET /api/v1/mining-zones returns empty list when no data."""
    resp = client.get("/api/v1/mining-zones")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_mining_zones_with_data(client, db_session):
    """GET /api/v1/mining-zones returns seeded zone data."""
    db_session.add(
        MiningZone(
            zone_name="Zone Test",
            latitude=22.57,
            longitude=88.36,
            district="TestDistrict",
            state="TestState",
            mineral_type="Manganese",
            ore_grade=42.5,
        )
    )
    db_session.commit()

    resp = client.get("/api/v1/mining-zones")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    zone = body["data"][-1]
    assert zone["zone_name"] == "Zone Test"
    assert zone["latitude"] == 22.57
    assert zone["longitude"] == 88.36


def test_create_mining_zone(client):
    """POST /api/v1/mining-zones creates and returns a new zone."""
    payload = {
        "zone_name": "Balaghat South Extension",
        "latitude": 21.7512,
        "longitude": 80.1245,
        "district": "Balaghat",
        "state": "Madhya Pradesh",
        "mineral_type": "Manganese",
        "ore_grade": 44.2,
        "estimated_reserve": 1.15,
        "potential_level": "HIGH",
    }
    resp = client.post("/api/v1/mining-zones", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["zone_name"] == "Balaghat South Extension"
    assert data["latitude"] == 21.7512
    assert data["potential_level"] == "HIGH"
    assert data["id"] is not None


def test_delete_mining_zone(client):
    """DELETE /api/v1/mining-zones/{id} removes the zone."""
    # First create a zone to delete
    payload = {
        "zone_name": "Temporary Mining Zone",
        "latitude": 21.8,
        "longitude": 79.9,
        "district": "Bhandara",
        "state": "Maharashtra",
        "mineral_type": "Manganese",
        "ore_grade": 40.0,
        "estimated_reserve": 0.5,
        "potential_level": "MEDIUM",
    }
    c_resp = client.post("/api/v1/mining-zones", json=payload)
    assert c_resp.status_code == 201
    zone_id = c_resp.json()["data"]["id"]

    # Delete the zone
    d_resp = client.delete(f"/api/v1/mining-zones/{zone_id}")
    assert d_resp.status_code == 200
    body = d_resp.json()
    assert body["success"] is True
    assert body["data"]["deleted"] is True
    assert body["data"]["id"] == zone_id

    # Deleting again should return 404
    d2_resp = client.delete(f"/api/v1/mining-zones/{zone_id}")
    assert d2_resp.status_code == 404
