from app.services.prospectivity_service import ProspectivityService


class FakeZone:
    def __init__(self, name, lat, lon, grade, reserve):
        self.zone_name = name
        self.latitude = lat
        self.longitude = lon
        self.ore_grade = grade
        self.estimated_reserve = reserve


class FakeQuery:
    def __init__(self, zones): self.zones = zones
    def filter(self, *args, **kwargs): return self
    def all(self): return self.zones


class FakeDB:
    def __init__(self, zones): self.zones = zones
    def query(self, model): return FakeQuery(self.zones)


def test_prospectivity_grid_is_bounded_and_explainable(monkeypatch):
    service = ProspectivityService()
    monkeypatch.setattr(service.satellite, "analyze", lambda **kwargs: {
        "scene_found": True,
        "scene": {"id": "S2_TEST"},
        "spectral_screening": {"available": True, "spectral_screening_score": 62.0},
    })
    db = FakeDB([FakeZone("Test Manganese Zone", 21.53, 79.69, 43.2, 1.24)])
    result = service.build_grid(db, latitude=21.53, longitude=79.69, half_size_km=4, grid_size=5)
    assert len(result["cells"]) == 25
    assert result["summary"]["total_cells"] == 25
    assert all(0 <= c["score"] <= 100 for c in result["cells"])
    assert {c["class_name"] for c in result["cells"]} <= {"HIGH", "MODERATE", "LOW"}
    assert all(c["satellite_score"] == 62.0 for c in result["cells"])
    assert all(c["evidence"] for c in result["cells"])
