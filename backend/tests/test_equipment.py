"""Tests for the equipment status API."""

from app.models.database_models import Equipment
from tests.conftest import TestSessionLocal


def test_equipment_status_empty(client):
    """GET /api/v1/equipment/status returns empty list when no data."""
    resp = client.get("/api/v1/equipment/status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_equipment_status_with_data(client, db_session):
    """GET /api/v1/equipment/status returns seeded equipment data."""
    db_session.add(
        Equipment(
            equipment_name="Excavator E01",
            equipment_type="Excavator",
            status="OPERATIONAL",
            operating_hours=6840,
            efficiency=0.87,
            last_maintenance="2026-08-20",
        )
    )
    db_session.commit()

    resp = client.get("/api/v1/equipment/status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    eq = body["data"][-1]
    assert eq["equipment_name"] == "Excavator E01"
    assert eq["status"] == "OPERATIONAL"
    assert eq["efficiency"] == 0.87
