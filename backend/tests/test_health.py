"""Tests for health-check endpoints."""


def test_health(client):
    """GET /health returns 200 with healthy status."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_health_detailed(client):
    """GET /api/v1/health returns API, DB, and ML status."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "ml_service" in data
