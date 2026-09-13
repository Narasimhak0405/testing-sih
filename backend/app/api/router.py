"""Central API router — aggregates all sub-routers under /api/v1."""

from fastapi import APIRouter

from app.api.routes import auth, equipment, insights, maps, mining_zones, predict, production, reserve, satellite, telemetry, prospectivity

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(reserve.router)
api_router.include_router(satellite.router)
api_router.include_router(prospectivity.router)
api_router.include_router(production.router)
api_router.include_router(predict.router)
api_router.include_router(equipment.router)
api_router.include_router(mining_zones.router)
api_router.include_router(insights.router)
api_router.include_router(maps.router)
api_router.include_router(auth.router)
api_router.include_router(telemetry.router)
