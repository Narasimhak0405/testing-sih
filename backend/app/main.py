"""FastAPI application entry-point.

Responsibilities:
- CORS configuration
- Central exception handlers
- Health-check endpoints
- Router inclusion
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

import asyncio
import logging
import threading

from app.api.router import api_router
from app.config import get_settings
from app.database.connection import Base, engine
from app.database.dependencies import get_db
import app.models.database_models  # noqa: F401
from app.services.ml_interface import MLServiceUnavailableError, get_ml_interface
from app.services.seed import seed_if_empty

logger = logging.getLogger(__name__)


def _load_ml_models_sync() -> None:
    """Load ML models — runs in a background thread."""
    try:
        ml = get_ml_interface()
        if hasattr(ml, "load_models"):
            ml.load_models()
            logger.info("ML models loaded successfully (background thread)")
        else:
            logger.info("ML interface has no load_models method — skipping")
    except Exception as exc:
        logger.error("Failed to load ML models: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database tables exist on startup and load ML models in parallel."""
    try:
        Base.metadata.create_all(bind=engine)
        seed_if_empty()
    except Exception:
        pass

    # Load ML models in a background thread so the server starts immediately
    ml_thread = threading.Thread(target=_load_ml_models_sync, daemon=True)
    ml_thread.start()
    logger.info("ML model loading started in background thread")

    yield


# ---------------------------------------------------------------------------
# OpenAPI / Swagger Tags Metadata
# ---------------------------------------------------------------------------

tags_metadata = [
    {
        "name": "Health",
        "description": "Liveness and readiness probes to check API, database, and ML service status.",
    },
    {
        "name": "ML Predict",
        "description": "Direct POST endpoints that forward feature vectors to the loaded ML models and return predictions.",
    },
    {
        "name": "Reserve Prediction",
        "description": "Geological exploration feature ingestion and manganese reserve estimation via ML integration interface.",
    },
    {
        "name": "Production",
        "description": "Operational metric processing for manganese production forecasting, shortfall risk calculation, and historical trend retrieval.",
    },
    {
        "name": "Equipment",
        "description": "Heavy machinery and mining equipment operational monitoring, hours logged, and maintenance status.",
    },
    {
        "name": "Mining Zones",
        "description": "Geographical and geological data for mining zones, suitable for map rendering (e.g., Leaflet).",
    },
    {
        "name": "AI Insights",
        "description": "Explainable AI geological and operational decision support insights.",
    },
]

app = FastAPI(
    title="AI-Based Manganese Exploration & Production Forecasting API",
    description="""
## Overview
Single REST API layer connecting the **React Frontend**, **PostgreSQL/SQLite Database**, and **Machine Learning Predictor Models**.

### Key Capabilities
- **Reserve Estimation**: Predicts manganese reserve volume, deposit potential, and confidence scores based on geological exploration data.
- **Production Forecasting**: Forecasts monthly output, evaluates production shortfall risk, and tracks historical metrics.
- **Equipment Telemetry**: Monitors operational statuses, run hours, and maintenance dates.
- **Mining Zone Geospatial Data**: Serves GPS coordinates and ore grades for interactive mapping.

### Base Path
All operational endpoints are prefixed under `/api/v1`.
    """,
    version="1.0.0",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------

settings = get_settings()

# Parse origins from environment variable (supports comma-separated list)
cors_origins = [o.strip() for o in settings.FRONTEND_URL.split(",") if o.strip()]
for dev_url in ("http://localhost:5173", "http://127.0.0.1:5173"):
    if dev_url not in cors_origins:
        cors_origins.append(dev_url)

# Configure CORS: allow explicit origins plus any port on localhost / 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(MLServiceUnavailableError)
async def ml_unavailable_handler(
    request: Request, exc: MLServiceUnavailableError
) -> JSONResponse:
    """Return 503 when the ML integration is not connected."""
    return JSONResponse(
        status_code=503,
        content={
            "success": False,
            "error": {
                "code": "ML_SERVICE_UNAVAILABLE",
                "message": str(exc),
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return 422 for schema validation errors."""
    errors = exc.errors()
    msg = "; ".join(
        f"{' -> '.join(str(loc) for loc in e.get('loc', []))}: {e.get('msg')}"
        for e in errors
    ) if errors else "Validation error"
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
            },
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Return structured JSON for standard HTTP errors (e.g. 404)."""
    code = "RESOURCE_NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": str(exc.detail),
            },
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(
    request: Request, exc: ValueError
) -> JSONResponse:
    """Return 400 for value-related validation issues."""
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": str(exc),
            },
        },
    )


@app.exception_handler(Exception)
async def generic_error_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Catch-all — never expose internal details."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred.",
            },
        },
    )


# ---------------------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Health"], summary="Quick liveness check")
def health() -> dict:
    """Minimal liveness probe."""
    return {"status": "healthy"}


@app.get(
    "/api/v1/health",
    tags=["Health"],
    summary="Detailed health check",
    description="Checks API, database connectivity, and ML interface availability.",
)
def health_detailed(db: Session = Depends(get_db)) -> dict:
    """Detailed readiness probe."""
    # Database check
    db_status = "disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    # ML interface check
    ml = get_ml_interface()
    ml_status = "available" if ml.is_available() else "unavailable"

    return {
        "status": "healthy",
        "database": db_status,
        "ml_service": ml_status,
    }


@app.get(
    "/api/v1/health/health",
    include_in_schema=False,
)
def health_double_alias(db: Session = Depends(get_db)) -> dict:
    """Gracefully handle double /health suffix if user configured /api/v1/health as base URL."""
    return health_detailed(db)


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

app.include_router(api_router)
