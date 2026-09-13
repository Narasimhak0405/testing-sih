"""Tests for CORS middleware configuration."""


def test_cors_preflight_allowed_origin(client):
    """OPTIONS preflight request from allowed origin returns CORS headers."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
    resp = client.options("/api/v1/reserve/predict", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "POST" in resp.headers.get("access-control-allow-methods", "")
    assert resp.headers.get("access-control-allow-credentials") == "true"


def test_cors_simple_request_allowed_origin(client):
    """GET request with allowed origin includes access-control-allow-origin header."""
    resp = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_various_ports(client):
    """Any port on localhost or 127.0.0.1 is accepted by CORS."""
    test_origins = [
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:9000",
    ]
    for origin in test_origins:
        resp = client.options(
            "/api/v1/reserve/predict",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert resp.status_code == 200, f"Failed for {origin}"
        assert resp.headers.get("access-control-allow-origin") == origin, f"Origin mismatch for {origin}"
        assert resp.headers.get("access-control-allow-credentials") == "true"


def test_cors_disallowed_origin(client):
    """Requests from unauthorized origins do not receive CORS allow origin header."""
    headers = {
        "Origin": "http://malicious-site.example.com",
        "Access-Control-Request-Method": "GET",
    }
    resp = client.get("/health", headers=headers)
    assert resp.status_code == 200
    assert "access-control-allow-origin" not in resp.headers
