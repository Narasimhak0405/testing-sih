"""Service layer for equipment status retrieval."""

from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.models.database_models import Equipment, MiningZone


class EquipmentService:
    """Provides equipment operational data from the database."""

    def get_all(self, db: Session) -> List[Dict[str, Any]]:
        """Return all equipment records enriched with mining zone details."""
        rows = (
            db.query(Equipment, MiningZone.zone_name)
            .outerjoin(MiningZone, Equipment.mining_zone_id == MiningZone.id)
            .all()
        )
        return [
            {
                "id": eq.id,
                "equipment_name": eq.equipment_name,
                "equipment_type": eq.equipment_type,
                "status": eq.status,
                "operating_hours": eq.operating_hours,
                "efficiency": eq.efficiency,
                "mining_zone_id": eq.mining_zone_id,
                "zone_name": zone_name,
                "last_maintenance": (
                    eq.last_maintenance.isoformat()
                    if hasattr(eq.last_maintenance, "isoformat")
                    else eq.last_maintenance
                ),
            }
            for eq, zone_name in rows
        ]


# Module-level convenience instance.
equipment_service = EquipmentService()
