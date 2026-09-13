"""Firebase ID-token verification for backend-facing authenticated features."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _firebase_app() -> Any:
    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError as exc:
        raise RuntimeError("firebase-admin is required for backend token verification") from exc

    settings = get_settings()
    if not settings.FIREBASE_PROJECT_ID:
        raise RuntimeError("FIREBASE_PROJECT_ID is not configured")

    options = {"projectId": settings.FIREBASE_PROJECT_ID}
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        credential = credentials.Certificate(json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON))
    else:
        credential = credentials.ApplicationDefault()
    return firebase_admin.initialize_app(credential, options)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Validate a Firebase bearer token and return its decoded claims."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A Firebase bearer token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        from firebase_admin import auth as firebase_auth

        _firebase_app()
        return firebase_auth.verify_id_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
