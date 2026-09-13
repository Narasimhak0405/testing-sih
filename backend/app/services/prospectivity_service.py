"""Explainable manganese prospectivity screening over a study-area grid.

This is a competition-ready screening layer, not a certified reserve estimator.
It combines the best available Sentinel-2 scene-level spectral evidence with
known/reference manganese occurrences and their geological grade/resource
context. It deliberately exposes the component scores so a reviewer can see
why a cell is ranked HIGH/MODERATE/LOW.
"""
from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.database_models import MiningZone
from app.services.satellite_service import SatelliteService, SatelliteServiceError


class ProspectivityServiceError(RuntimeError):
    pass


class ProspectivityService:
    def __init__(self) -> None:
        self.satellite = SatelliteService()

    def build_grid(
        self,
        db: Session,
        *,
        latitude: float,
        longitude: float,
        half_size_km: float = 12.0,
        grid_size: int = 7,
        max_cloud_cover: float = 20.0,
    ) -> Dict[str, Any]:
        # Query only India reference zones. The existing seed data contains
        # international examples, which must never influence an Indian study area.
        zones = (
            db.query(MiningZone)
            .filter(MiningZone.mineral_type.ilike("%manganese%"))
            .filter(MiningZone.latitude >= 6, MiningZone.latitude <= 38)
            .filter(MiningZone.longitude >= 68, MiningZone.longitude <= 98)
            .all()
        )
        if not zones:
            raise ProspectivityServiceError("No Indian manganese reference locations are available.")

        try:
            sat = self.satellite.analyze(
                latitude=latitude,
                longitude=longitude,
                max_cloud_cover=max_cloud_cover,
            )
        except SatelliteServiceError as exc:
            # Do not invent satellite observations. The map can still be useful
            # as a geological-reference screen, but the response says exactly why.
            sat = {
                "scene_found": False,
                "message": str(exc),
                "spectral_screening": {"available": False},
            }

        sat_score = None
        if sat.get("spectral_screening", {}).get("available"):
            sat_score = float(sat["spectral_screening"]["spectral_screening_score"])

        # Cell spacing. 1 degree latitude is ~111.32 km; longitude is scaled by cos(lat).
        lat_half_deg = half_size_km / 111.32
        lon_half_deg = half_size_km / (111.32 * max(math.cos(math.radians(latitude)), 0.15))
        step_lat = (2 * lat_half_deg) / grid_size
        step_lon = (2 * lon_half_deg) / grid_size

        cells: List[Dict[str, Any]] = []
        for row in range(grid_size):
            for col in range(grid_size):
                c_lat = latitude - lat_half_deg + (row + 0.5) * step_lat
                c_lon = longitude - lon_half_deg + (col + 0.5) * step_lon
                dists = [self._haversine_km(c_lat, c_lon, z.latitude, z.longitude) for z in zones]
                nearest_idx = min(range(len(zones)), key=lambda i: dists[i])
                nearest = zones[nearest_idx]
                nearest_dist = dists[nearest_idx]

                occurrence_score = 100.0 * math.exp(-nearest_dist / 8.0)
                grade = float(nearest.ore_grade or 0.0)
                reserve = float(nearest.estimated_reserve or 0.0)
                # Geological context is intentionally bounded and transparent.
                geology_score = min(100.0, 0.7 * max(0.0, min(100.0, grade * 2.0)) + 0.3 * min(100.0, reserve * 10.0))

                # If actual satellite statistics exist, use them for 45% of the score.
                # Otherwise redistribute weight to geology/reference evidence and say so.
                if sat_score is not None:
                    score = 0.45 * sat_score + 0.30 * geology_score + 0.25 * occurrence_score
                else:
                    score = 0.55 * geology_score + 0.45 * occurrence_score

                score = round(max(0.0, min(100.0, score)), 1)
                class_name = "HIGH" if score >= 70 else "MODERATE" if score >= 45 else "LOW"
                evidence = [f"Nearest manganese reference: {nearest.zone_name} ({nearest_dist:.1f} km)"]
                evidence.append(f"Geological context score: {geology_score:.1f}/100")
                if sat_score is not None:
                    evidence.append(f"Sentinel-2 scene screening score: {sat_score:.1f}/100")
                else:
                    evidence.append("Sentinel-2 scene statistics unavailable; satellite weight was not fabricated")

                bounds = [
                    [c_lat - step_lat / 2, c_lon - step_lon / 2],
                    [c_lat - step_lat / 2, c_lon + step_lon / 2],
                    [c_lat + step_lat / 2, c_lon + step_lon / 2],
                    [c_lat + step_lat / 2, c_lon - step_lon / 2],
                ]
                cells.append({
                    "id": f"R{row + 1}C{col + 1}",
                    "row": row,
                    "col": col,
                    "center": [round(c_lat, 6), round(c_lon, 6)],
                    "bounds": [[round(a, 6), round(b, 6)] for a, b in bounds],
                    "score": score,
                    "class_name": class_name,
                    "satellite_score": round(sat_score, 1) if sat_score is not None else None,
                    "geology_score": round(geology_score, 1),
                    "occurrence_score": round(occurrence_score, 1),
                    "nearest_reference": nearest.zone_name,
                    "distance_to_reference_km": round(nearest_dist, 2),
                    "evidence": evidence,
                })

        counts = {k: sum(1 for c in cells if c["class_name"] == k) for k in ("HIGH", "MODERATE", "LOW")}
        return {
            "study_area": {
                "center": [latitude, longitude],
                "half_size_km": half_size_km,
                "grid_size": grid_size,
            },
            "method": "Explainable remote-sensing + geological-reference prospectivity screening",
            "satellite": sat,
            "reference_locations": [
                {"name": z.zone_name, "latitude": z.latitude, "longitude": z.longitude, "ore_grade": z.ore_grade}
                for z in zones
            ],
            "cells": cells,
            "summary": {
                "total_cells": len(cells),
                "high": counts["HIGH"],
                "moderate": counts["MODERATE"],
                "low": counts["LOW"],
                "validated_reserve": False,
                "note": "Prospectivity screening guides field investigation; it is not a certified reserve estimate or Mn-grade measurement.",
            },
        }

    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0088
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        return 2 * r * math.asin(math.sqrt(a))


prospectivity_service = ProspectivityService()
