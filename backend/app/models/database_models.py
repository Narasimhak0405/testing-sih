"""SQLAlchemy ORM models for all database tables."""

from datetime import date, datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)

from app.database.connection import Base


class MiningZone(Base):
    """Mining zone locations and basic geological information."""

    __tablename__ = "mining_zones"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    district = Column(String(255), nullable=True)
    state = Column(String(255), nullable=True)
    mineral_type = Column(String(100), nullable=True, default="Manganese")
    ore_grade = Column(Float, nullable=True)
    estimated_reserve = Column(Float, nullable=True)
    potential_level = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class ExplorationData(Base):
    """Raw exploration / geological survey data linked to a mining zone."""

    __tablename__ = "exploration_data"

    id = Column(Integer, primary_key=True, index=True)
    mining_zone_id = Column(
        Integer, ForeignKey("mining_zones.id"), nullable=True, index=True
    )
    ore_grade = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    density = Column(Float, nullable=True)
    rock_type = Column(String(100), nullable=True)
    geological_features = Column(Text, nullable=True)
    satellite_features = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class ReservePrediction(Base):
    """Stored results of reserve predictions made through the API."""

    __tablename__ = "reserve_predictions"

    id = Column(Integer, primary_key=True, index=True)
    mining_zone_id = Column(
        Integer, ForeignKey("mining_zones.id"), nullable=True, index=True
    )
    ore_grade = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    density = Column(Float, nullable=True)
    estimated_reserve = Column(Float, nullable=True)
    potential = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class ProductionHistory(Base):
    """Historical production data for mining zones."""

    __tablename__ = "production_history"

    id = Column(Integer, primary_key=True, index=True)
    mining_zone_id = Column(
        Integer, ForeignKey("mining_zones.id"), nullable=True, index=True
    )
    year = Column(Integer, nullable=False)
    production = Column(Float, nullable=True)
    ore_grade = Column(Float, nullable=True)
    operating_hours = Column(Float, nullable=True)
    downtime = Column(Float, nullable=True)
    equipment_efficiency = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class ProductionPrediction(Base):
    """Stored results of production predictions made through the API."""

    __tablename__ = "production_predictions"

    id = Column(Integer, primary_key=True, index=True)
    mining_zone_id = Column(
        Integer, ForeignKey("mining_zones.id"), nullable=True, index=True
    )
    predicted_production = Column(Float, nullable=True)
    planned_production = Column(Float, nullable=True)
    shortfall_risk = Column(String(50), nullable=True)
    expected_shortfall = Column(Float, nullable=True)
    shortfall_percentage = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    prediction_year = Column(Integer, nullable=True)
    recommended_action = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class Equipment(Base):
    """Equipment inventory and operational status."""

    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    equipment_name = Column(String(255), nullable=False)
    equipment_type = Column(String(100), nullable=True)
    mining_zone_id = Column(
        Integer, ForeignKey("mining_zones.id"), nullable=True, index=True
    )
    status = Column(String(50), nullable=True, default="OPERATIONAL")
    operating_hours = Column(Float, nullable=True)
    efficiency = Column(Float, nullable=True)
    last_maintenance = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
