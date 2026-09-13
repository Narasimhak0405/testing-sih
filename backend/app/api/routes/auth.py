"""Backend authentication verification endpoints."""

from typing import Any

from fastapi import APIRouter, Depends

from app.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me")
def get_authenticated_user(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Return the Firebase identity associated with the bearer token."""
    return {
        "success": True,
        "data": {
            "uid": user.get("uid"),
            "email": user.get("email"),
            "email_verified": user.get("email_verified", False),
        },
    }
