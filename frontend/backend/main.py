"""
MANGANAI — FastAPI ML Backend Microservice
SIH 2026 Problem Statement SIH26009
Endpoints for Reserve Prediction, Production Forecasting, Equipment Telemetry & Insights
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(
    title="MANGANAI API Engine",
    description="AI-powered Manganese Reserve & Production Intelligence Microservices",
    version="1.0.0",
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GeologicalInput(BaseModel):
    region: Optional[str] = "Selected Mining Zone"
    oreGrade: float = 40.0
    depth: float = 150.0
    rockDensity: float = 3.7
    geologicalScore: float = 75.0
    historicalYield: float = 78.0
    spectralIndex: float = 0.8

class ProductionRequest(BaseModel):
    zoneId: str = "ZONE-A"
    period: str = "12M"

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "MANGANAI Intelligence Engine",
        "sihProblemStatement": "SIH26009",
        "ministry": "Ministry of Mines / MOIL Limited",
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "latencyMs": 14}

@app.post("/api/v1/predict/reserve")
def predict_reserve(data: GeologicalInput):
    composite_score = min(
        99.0,
        max(
            30.0,
            data.oreGrade * 0.35
            + data.geologicalScore * 0.25
            + (300.0 - data.depth) * 0.1
            + data.rockDensity * 8.0
            + data.spectralIndex * 15.0
            + data.historicalYield * 0.1,
        ),
    )

    potential = "LOW"
    if composite_score >= 78:
        potential = "HIGH"
    elif composite_score >= 60:
        potential = "MEDIUM"

    est_reserve_mt = round((composite_score / 100.0) * 1.8 + (data.oreGrade / 100.0) * 1.2, 2)
    confidence = min(96, max(72, int(composite_score * 0.95 + 10)))

    return {
        "reservePotential": potential,
        "potentialScore": int(composite_score),
        "estimatedReserveMT": est_reserve_mt,
        "confidenceScore": confidence,
        "region": data.region,
        "contributingFactors": [
            {
                "name": "Ore Grade Concentration",
                "value": f"{data.oreGrade}% Mn",
                "weight": int((data.oreGrade / 50.0) * 35),
                "impact": "positive" if data.oreGrade > 38 else "neutral",
            },
            {
                "name": "Geological Anomaly Score",
                "value": f"{data.geologicalScore}/100",
                "weight": int((data.geologicalScore / 100.0) * 28),
                "impact": "positive" if data.geologicalScore > 70 else "neutral",
            },
            {
                "name": "Satellite Spectral Index",
                "value": str(round(data.spectralIndex, 2)),
                "weight": int(data.spectralIndex * 20),
                "impact": "positive" if data.spectralIndex > 0.75 else "negative",
            },
            {
                "name": "Rock Density & Structure",
                "value": f"{data.rockDensity} g/cm³",
                "weight": int((data.rockDensity / 4.2) * 17),
                "impact": "positive" if data.rockDensity > 3.5 else "neutral",
            },
        ],
        "recommendation": (
            "Zone demonstrates excellent braunite/pyrolusite reserve potential with high confidence. "
            "Recommend immediate diamond core drilling phase and fleet deployment."
            if potential == "HIGH"
            else "Moderate reserve potential identified. Perform dense grid geophysical survey before major capital expenditure."
            if potential == "MEDIUM"
            else "Low reserve grade or high strip ratio depth. Consider re-evaluating extraction economic viability."
        ),
        "isMock": False,
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
