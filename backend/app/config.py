"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

import os

_possible_dirs = [
    # Direct path from backend app (most common)
    Path(__file__).resolve().parents[1] / "ml" / "model",
    # From repo root
    Path(__file__).resolve().parents[2] / "backend" / "ml" / "model",
    # Lambda or other serverless
    Path(os.environ.get("LAMBDA_TASK_ROOT", "/var/task")) / "ml" / "model",
    Path(os.environ.get("LAMBDA_TASK_ROOT", "/var/task")) / "backend" / "ml" / "model",
]

# Find directory with ExtraTrees model, fall back to production model
_REPO_ML_MODEL_DIR = str(next(
    (d for d in _possible_dirs if (d / "extra_trees_model.joblib").exists() or (d / "production_model.pkl").exists()), 
    _possible_dirs[0]
))


class Settings(BaseSettings):
    """Application settings.

    Values are read from environment variables or a ``.env`` file.
    """

    DATABASE_URL: str = "sqlite:////tmp/manganese.db" if os.environ.get("VERCEL") else "sqlite:///./manganese.db"
    FRONTEND_URL: str = "http://localhost:5173"
    ML_MODEL_DIR: str = _REPO_ML_MODEL_DIR
    MAPS_API_KEY: str = ""
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
