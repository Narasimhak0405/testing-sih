"""Secure server-side maps proxy and configuration.

This service proxies map tile requests so that the MAPS_API_KEY stays
strictly on the server and is NEVER exposed to the frontend or browser.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List
import httpx
from fastapi import APIRouter, Response
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maps", tags=["Maps"])

# Layer endpoints for the secure proxy
UPSTREAM_LAYERS: Dict[str, str] = {
    "dark": "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
    "satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    "terrain": "https://tile.opentopomap.org/{z}/{x}/{y}.png",
}

# Async HTTP client for streaming tiles
_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "ManganAI-GIS/1.0"},
        )
    return _http_client


class LayerInfo(BaseModel):
    id: str
    name: str
    active: bool


class MapsConfigData(BaseModel):
    provider: str
    default_layer: str
    tile_template: str
    layers: List[LayerInfo]
    attribution: str
    authenticated: bool


class MapsConfigResponse(BaseModel):
    success: bool
    data: MapsConfigData


@router.get(
    "/config",
    response_model=MapsConfigResponse,
    summary="Get Maps Configuration (No API Key Exposed)",
    description="Returns secure server-proxy endpoints for map rendering without exposing the server-side API key.",
)
def get_maps_config() -> MapsConfigResponse:
    settings = get_settings()
    has_key = bool(settings.MAPS_API_KEY)

    return MapsConfigResponse(
        success=True,
        data=MapsConfigData(
            provider="secure_server_proxy",
            default_layer="dark",
            tile_template="/api/v1/maps/tiles/{layer}/{z}/{x}/{y}.png",
            layers=[
                LayerInfo(id="dark", name="Dark GIS (High Contrast)", active=True),
                LayerInfo(id="satellite", name="Satellite & Spectral", active=False),
                LayerInfo(id="terrain", name="Topographic Relief", active=False),
            ],
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & MOIL GIS',
            authenticated=has_key,
        ),
    )


@router.get(
    "/tiles/{z}/{x}/{y}.png",
    summary="Fetch default dark GIS tile via server proxy",
    response_class=Response,
)
async def proxy_default_tile(z: int, x: int, y: int) -> Response:
    """Proxy default dark GIS tile."""
    return await proxy_layer_tile("dark", z, x, y)


@router.get(
    "/tiles/{layer}/{z}/{x}/{y}.png",
    summary="Proxy map tile with server-side API key injection",
    response_class=Response,
)
async def proxy_layer_tile(layer: str, z: int, x: int, y: int) -> Response:
    """Securely fetch and return upstream tile image using server-side credentials."""
    settings = get_settings()
    template = UPSTREAM_LAYERS.get(layer, UPSTREAM_LAYERS["dark"])
    target_url = template.format(z=z, x=x, y=y)

    # Attach server-side key as query parameter for providers that accept key query param
    if settings.MAPS_API_KEY:
        sep = "&" if "?" in target_url else "?"
        target_url = f"{target_url}{sep}key={settings.MAPS_API_KEY}"

    client = _get_http_client()
    try:
        upstream_resp = await client.get(target_url)
        content_type = upstream_resp.headers.get("content-type", "image/png")
        if upstream_resp.status_code == 200 and upstream_resp.content:
            return Response(
                content=upstream_resp.content,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=86400"},
            )
    except Exception as exc:
        logger.warning("Tile proxy failed for %s (%s): %s", layer, target_url, exc)

    # Fallback to Carto dark basemap directly if custom upstream failed
    fallback_url = f"https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
    try:
        fallback_resp = await client.get(fallback_url)
        return Response(
            content=fallback_resp.content,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except Exception:
        # Return transparent 1x1 PNG if completely unreachable
        transparent_1x1 = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00"
            b"\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        return Response(content=transparent_1x1, media_type="image/png")
