from datetime import date

from app.services.satellite_service import SatelliteService


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError("HTTP error")

    def json(self):
        return self._payload


def test_satellite_analysis_uses_real_scene_metadata(monkeypatch):
    scene = {
        "id": "S2A_TEST_SCENE",
        "properties": {"datetime": "2026-08-20T05:10:00Z", "eo:cloud_cover": 8.5},
        "bbox": [79.6, 21.4, 79.8, 21.6],
        "assets": {"B02": {}, "B03": {}, "B04": {}, "B08": {}, "B11": {}, "B12": {}},
    }

    def fake_post(*args, **kwargs):
        return FakeResponse({"features": [scene]})

    def fake_get(*args, **kwargs):
        return FakeResponse({
            "B02": {"mean": 100}, "B03": {"mean": 120}, "B04": {"mean": 160},
            "B08": {"mean": 200}, "B11": {"mean": 150}, "B12": {"mean": 120},
        })

    monkeypatch.setattr("app.services.satellite_service.requests.post", fake_post)
    monkeypatch.setattr("app.services.satellite_service.requests.get", fake_get)

    result = SatelliteService().analyze(
        latitude=21.53,
        longitude=79.69,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 8, 31),
    )

    assert result["scene_found"] is True
    assert result["scene"]["id"] == "S2A_TEST_SCENE"
    assert result["spectral_screening"]["available"] is True
    assert 0 <= result["spectral_screening"]["spectral_screening_score"] <= 100
