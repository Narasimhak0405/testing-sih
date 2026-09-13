"""Shared pytest fixtures for the Manganese backend test suite.

Uses an in-memory SQLite database and mocked ML interface so tests run
without PostgreSQL or any ML model files.
"""

from typing import Any, Dict, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.connection import Base
from app.database.dependencies import get_db
from app.main import app
from app.services.ml_interface import (
    MLPredictionInterface,
    MLServiceUnavailableError,
    set_ml_interface,
)

# ---------------------------------------------------------------------------
# In-memory SQLite for tests
# ---------------------------------------------------------------------------

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

test_engine = create_engine(
    SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db() -> Generator[Session, None, None]:
    """Provide a test database session."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Mock ML interface that returns canned responses
# ---------------------------------------------------------------------------


class MockMLInterface(MLPredictionInterface):
    """Deterministic ML interface for testing."""

    def predict_reserve(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "estimated_reserve": 2.4,
            "potential": "HIGH",
            "confidence": 0.87,
        }

    def predict_production(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "predicted_production": 1600000.0,
            "shortfall_risk": "MEDIUM",
            "expected_shortfall": 50000.0,
            "shortfall_percentage": 3.03,
            "confidence": 0.84,
            "prediction_year": input_data.get("prediction_year", 2027),
            "recommended_action": "Review equipment allocation and mine schedule",
        }

    def is_available(self) -> bool:
        return True


class UnavailableMLInterface(MLPredictionInterface):
    """ML interface that always raises MLServiceUnavailableError."""

    def predict_reserve(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        raise MLServiceUnavailableError("Reserve model unavailable")

    def predict_production(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        raise MLServiceUnavailableError("Production model unavailable")

    def is_available(self) -> bool:
        return False


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables once for the entire test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Provide a fresh DB session for each test."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture()
def client() -> TestClient:
    """TestClient with mocked DB and **available** ML interface."""
    app.dependency_overrides[get_db] = override_get_db
    set_ml_interface(MockMLInterface())
    yield TestClient(app)
    set_ml_interface(None)
    app.dependency_overrides.clear()


@pytest.fixture()
def client_no_ml() -> TestClient:
    """TestClient with mocked DB and **unavailable** ML interface."""
    app.dependency_overrides[get_db] = override_get_db
    set_ml_interface(UnavailableMLInterface())
    yield TestClient(app)
    set_ml_interface(None)
    app.dependency_overrides.clear()
