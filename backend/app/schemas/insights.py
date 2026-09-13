"""Pydantic schemas for the AI insights API."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel


class ContributingFactor(BaseModel):
    """Key factor contributing to an AI insight."""

    factor: str
    weight: int
    description: str


class InsightItem(BaseModel):
    """Single AI-generated geological or operational insight."""

    id: str
    zoneId: str
    zoneName: str
    title: str
    type: str
    confidence: float
    reservePotential: Optional[str] = None
    estimatedReserveMT: Optional[float] = None
    summary: str
    contributingFactors: List[ContributingFactor] = []
    recommendation: str


class ErrorDetail(BaseModel):
    """Structured error detail."""

    code: str
    message: str


class InsightsResponse(BaseModel):
    """Envelope returned by ``GET /api/v1/insights``."""

    success: bool
    data: List[InsightItem] = []
    error: Optional[ErrorDetail] = None
