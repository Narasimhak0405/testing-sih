"""Tests for the secure server-side maps proxy and config."""

def test_maps_config_does_not_leak_key(client):
    """Confirm /api/v1/maps/config returns proxy template and NEVER leaks api_key."""
    resp = client.get("/api/v1/maps/config")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["provider"] == "secure_server_proxy"
    assert "tile_template" in data
    assert "api_key" not in data  # Security check: must NOT leak API key
    assert "layers" in data
    assert len(data["layers"]) >= 3


def test_maps_tile_proxy_response(client):
    """Confirm /api/v1/maps/tiles endpoint returns image bytes."""
    resp = client.get("/api/v1/maps/tiles/dark/5/23/14.png")
    assert resp.status_code == 200
    assert "image" in resp.headers.get("content-type", "")
    assert len(resp.content) > 0
