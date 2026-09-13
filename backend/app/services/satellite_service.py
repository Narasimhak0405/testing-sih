"""Sentinel-2 scene discovery and transparent remote-sensing screening.

This module deliberately does NOT claim that satellite imagery alone proves a
manganese deposit. It discovers real Sentinel-2 L2A scenes, exposes their
true-colour imagery, and computes simple spectral screening indicators when
band statistics are available. Final reserve confirmation still requires
geological/field and laboratory validation (for example XRF).
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict

import requests


STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
DATA_API = "https://planetarycomputer.microsoft.com/api/data/v1"
COLLECTION = "sentinel-2-l2a"
TIMEOUT = 20


class SatelliteServiceError(RuntimeError):
    pass


class SatelliteService:
    def analyze(self, *, latitude: float, longitude: float,
                start_date: date | None = None,
                end_date: date | None = None,
                max_cloud_cover: float = 20.0,
                search_radius_degrees: float = 0.08) -> Dict[str, Any]:
        end = end_date or date.today()
        start = start_date or (end - timedelta(days=180))
        if start > end:
            raise SatelliteServiceError("start_date must be before end_date")

        bbox = [
            longitude - search_radius_degrees,
            latitude - search_radius_degrees,
            longitude + search_radius_degrees,
            latitude + search_radius_degrees,
        ]

        payload = {
            "collections": [COLLECTION],
            "bbox": bbox,
            "datetime": f"{start.isoformat()}T00:00:00Z/{end.isoformat()}T23:59:59Z",
            "limit": 5,
            "query": {"eo:cloud_cover": {"lt": max_cloud_cover}},
        }

        try:
            response = requests.post(STAC_URL, json=payload, timeout=TIMEOUT)
            response.raise_for_status()
            features = response.json().get("features", [])
        except requests.RequestException as exc:
            raise SatelliteServiceError(f"Sentinel-2 catalogue unavailable: {exc}") from exc

        if not features:
            return {
                "source": "Microsoft Planetary Computer / Sentinel-2 L2A",
                "scene_found": False,
                "message": "No Sentinel-2 scene met the requested date and cloud filters.",
                "search": {"latitude": latitude, "longitude": longitude,
                           "start_date": start.isoformat(), "end_date": end.isoformat(),
                           "max_cloud_cover": max_cloud_cover},
            }

        # STAC results are returned in catalogue order; choose the least cloudy
        # scene, then the newest acquisition when cloud cover ties.
        def sort_key(item: Dict[str, Any]):
            props = item.get("properties", {})
            cloud = float(props.get("eo:cloud_cover", 100.0))
            dt = props.get("datetime", "")
            return (cloud, -_date_rank(dt))

        item = sorted(features, key=sort_key)[0]
        item_id = item["id"]
        props = item.get("properties", {})
        assets = item.get("assets", {})

        preview_url = (
            f"{DATA_API}/item/preview.png?collection={COLLECTION}"
            f"&item={item_id}&assets=B04&assets=B03&assets=B02&nodata=0&format=png"
        )

        tile_url = (
            f"{DATA_API}/item/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}@1x"
            f"?collection={COLLECTION}&item={item_id}"
            f"&assets=B04&assets=B03&assets=B02&nodata=0&format=png"
        )

        band_stats = self._band_statistics(item_id, ["B02", "B03", "B04", "B08", "B11", "B12"])
        screening = self._screening_indices(band_stats)

        return {
            "source": "Microsoft Planetary Computer / Sentinel-2 L2A",
            "scene_found": True,
            "scene": {
                "id": item_id,
                "acquired": props.get("datetime"),
                "cloud_cover_percent": props.get("eo:cloud_cover"),
                "bbox": item.get("bbox"),
                "preview_url": preview_url,
                "tile_url": tile_url,
                "available_bands": sorted(list(assets.keys()))[:30],
            },
            "band_statistics": band_stats,
            "spectral_screening": screening,
            "limitations": [
                "This is a remote-sensing screening layer, not a certified manganese-grade measurement.",
                "Surface cover, vegetation, atmospheric effects and mixed pixels can affect spectral signals.",
                "Potential zones must be validated using geological evidence, field sampling and laboratory analysis such as XRF.",
            ],
        }

    def _band_statistics(self, item_id: str, bands: list[str]) -> Dict[str, Any]:
        url = f"{DATA_API}/item/statistics"
        params: list[tuple[str, str]] = [
            ("collection", COLLECTION),
            ("item", item_id),
            ("max_size", "512"),
            ("p", "50"),
        ]
        params.extend(("assets", band) for band in bands)
        try:
            response = requests.get(url, params=params, timeout=TIMEOUT)
            if response.status_code >= 400:
                return {"available": False, "reason": f"Statistics API returned HTTP {response.status_code}"}
            raw = response.json()
            result: Dict[str, Any] = {"available": True}
            for key, value in raw.items():
                result[key.upper()] = {
                    k: value.get(k) for k in ("mean", "median", "std", "valid_percent") if k in value
                }
            return result
        except requests.RequestException as exc:
            return {"available": False, "reason": str(exc)}

    @staticmethod
    def _screening_indices(stats: Dict[str, Any]) -> Dict[str, Any]:
        if not stats.get("available"):
            return {"available": False, "message": "Band statistics were not available."}

        def mean(band: str):
            value = stats.get(band, {}).get("mean")
            return float(value) if value is not None else None

        b02, b04, b08, b11, b12 = map(mean, ["B02", "B04", "B08", "B11", "B12"])
        if any(v is None for v in (b02, b04, b08, b11, b12)):
            return {"available": False, "message": "Required Sentinel-2 bands were unavailable."}

        # These are generic spectral indicators, not a trained manganese classifier.
        iron_oxide_ratio = b04 / max(b02, 1e-9)
        vegetation_suppression = 1.0 - ((b08 - b04) / max(b08 + b04, 1e-9))
        swir_ratio = b11 / max(b12, 1e-9)

        # Normalize to a bounded screening score. It is intentionally labelled
        # as a screening proxy rather than a manganese probability.
        raw = 0.45 * _clamp01(iron_oxide_ratio / 2.5) + \
              0.30 * _clamp01(vegetation_suppression) + \
              0.25 * _clamp01(swir_ratio / 1.5)
        score = round(100 * raw, 1)

        return {
            "available": True,
            "iron_oxide_ratio_b04_b02": round(iron_oxide_ratio, 4),
            "vegetation_suppression_proxy": round(vegetation_suppression, 4),
            "swir_b11_b12_ratio": round(swir_ratio, 4),
            "spectral_screening_score": score,
            "interpretation": "Higher score = stronger generic surface spectral screening signal; not a manganese grade or probability.",
        }


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _date_rank(value: str) -> int:
    try:
        return int(value[:10].replace("-", ""))
    except Exception:
        return 0


satellite_service = SatelliteService()
