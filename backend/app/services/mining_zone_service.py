"""Service layer for mining-zone retrieval."""

from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.models.database_models import MiningZone
from app.schemas.mining_zone import MiningZoneCreate


class MiningZoneService:
    """Provides mining-zone data and creation from the database."""

    def get_all(self, db: Session) -> List[Dict[str, Any]]:
        """Return all mining zones."""
        rows = db.query(MiningZone).all()
        return [
            {
                "id": r.id,
                "zone_name": r.zone_name,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "district": r.district,
                "state": r.state,
                "mineral_type": r.mineral_type,
                "ore_grade": r.ore_grade,
                "estimated_reserve": r.estimated_reserve,
                "potential_level": r.potential_level,
            }
            for r in rows
        ]

    def create(self, db: Session, data: MiningZoneCreate) -> Dict[str, Any]:
        """Create and persist a new mining zone."""
        zone = MiningZone(
            zone_name=data.zone_name.strip(),
            latitude=data.latitude,
            longitude=data.longitude,
            district=data.district.strip() if data.district else None,
            state=data.state.strip() if data.state else None,
            mineral_type=data.mineral_type.strip() if data.mineral_type else "Manganese",
            ore_grade=data.ore_grade,
            estimated_reserve=data.estimated_reserve,
            potential_level=data.potential_level.strip().upper() if data.potential_level else "MEDIUM",
        )
        db.add(zone)
        db.commit()
        db.refresh(zone)
        return {
            "id": zone.id,
            "zone_name": zone.zone_name,
            "latitude": zone.latitude,
            "longitude": zone.longitude,
            "district": zone.district,
            "state": zone.state,
            "mineral_type": zone.mineral_type,
            "ore_grade": zone.ore_grade,
            "estimated_reserve": zone.estimated_reserve,
            "potential_level": zone.potential_level,
        }

    def delete(self, db: Session, zone_id: int) -> bool:
        """Delete a mining zone by ID, cleanly disassociating relations."""
        zone = db.query(MiningZone).filter(MiningZone.id == zone_id).first()
        if not zone:
            return False

        from app.models.database_models import (
            Equipment,
            ExplorationData,
            ProductionHistory,
            ProductionPrediction,
            ReservePrediction,
        )

        db.query(Equipment).filter(Equipment.mining_zone_id == zone_id).update({"mining_zone_id": None})
        db.query(ExplorationData).filter(ExplorationData.mining_zone_id == zone_id).delete()
        db.query(ProductionHistory).filter(ProductionHistory.mining_zone_id == zone_id).delete()
        db.query(ProductionPrediction).filter(ProductionPrediction.mining_zone_id == zone_id).delete()
        db.query(ReservePrediction).filter(ReservePrediction.mining_zone_id == zone_id).delete()

        db.delete(zone)
        db.commit()
        return True


# Module-level convenience instance.
mining_zone_service = MiningZoneService()
