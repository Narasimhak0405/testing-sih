"""Initial tables — all 6 domain models.

Revision ID: 001_initial
Revises: None
Create Date: 2026-09-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- mining_zones ---
    op.create_table(
        "mining_zones",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("zone_name", sa.String(255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("district", sa.String(255), nullable=True),
        sa.Column("state", sa.String(255), nullable=True),
        sa.Column("mineral_type", sa.String(100), nullable=True, server_default="Manganese"),
        sa.Column("ore_grade", sa.Float(), nullable=True),
        sa.Column("estimated_reserve", sa.Float(), nullable=True),
        sa.Column("potential_level", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_mining_zones_id", "mining_zones", ["id"])

    # --- exploration_data ---
    op.create_table(
        "exploration_data",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("mining_zone_id", sa.Integer(), sa.ForeignKey("mining_zones.id"), nullable=True),
        sa.Column("ore_grade", sa.Float(), nullable=True),
        sa.Column("depth", sa.Float(), nullable=True),
        sa.Column("density", sa.Float(), nullable=True),
        sa.Column("rock_type", sa.String(100), nullable=True),
        sa.Column("geological_features", sa.Text(), nullable=True),
        sa.Column("satellite_features", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_exploration_data_id", "exploration_data", ["id"])
    op.create_index("ix_exploration_data_mining_zone_id", "exploration_data", ["mining_zone_id"])

    # --- reserve_predictions ---
    op.create_table(
        "reserve_predictions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("mining_zone_id", sa.Integer(), sa.ForeignKey("mining_zones.id"), nullable=True),
        sa.Column("ore_grade", sa.Float(), nullable=True),
        sa.Column("depth", sa.Float(), nullable=True),
        sa.Column("density", sa.Float(), nullable=True),
        sa.Column("estimated_reserve", sa.Float(), nullable=True),
        sa.Column("potential", sa.String(50), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reserve_predictions_id", "reserve_predictions", ["id"])
    op.create_index("ix_reserve_predictions_mining_zone_id", "reserve_predictions", ["mining_zone_id"])

    # --- production_history ---
    op.create_table(
        "production_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("mining_zone_id", sa.Integer(), sa.ForeignKey("mining_zones.id"), nullable=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("production", sa.Float(), nullable=True),
        sa.Column("ore_grade", sa.Float(), nullable=True),
        sa.Column("operating_hours", sa.Float(), nullable=True),
        sa.Column("downtime", sa.Float(), nullable=True),
        sa.Column("equipment_efficiency", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_production_history_id", "production_history", ["id"])
    op.create_index("ix_production_history_mining_zone_id", "production_history", ["mining_zone_id"])

    # --- production_predictions ---
    op.create_table(
        "production_predictions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("mining_zone_id", sa.Integer(), sa.ForeignKey("mining_zones.id"), nullable=True),
        sa.Column("predicted_production", sa.Float(), nullable=True),
        sa.Column("planned_production", sa.Float(), nullable=True),
        sa.Column("shortfall_risk", sa.String(50), nullable=True),
        sa.Column("expected_shortfall", sa.Float(), nullable=True),
        sa.Column("shortfall_percentage", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("prediction_year", sa.Integer(), nullable=True),
        sa.Column("recommended_action", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_production_predictions_id", "production_predictions", ["id"])
    op.create_index("ix_production_predictions_mining_zone_id", "production_predictions", ["mining_zone_id"])

    # --- equipment ---
    op.create_table(
        "equipment",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("equipment_name", sa.String(255), nullable=False),
        sa.Column("equipment_type", sa.String(100), nullable=True),
        sa.Column("mining_zone_id", sa.Integer(), sa.ForeignKey("mining_zones.id"), nullable=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="OPERATIONAL"),
        sa.Column("operating_hours", sa.Float(), nullable=True),
        sa.Column("efficiency", sa.Float(), nullable=True),
        sa.Column("last_maintenance", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_equipment_id", "equipment", ["id"])
    op.create_index("ix_equipment_mining_zone_id", "equipment", ["mining_zone_id"])


def downgrade() -> None:
    op.drop_table("equipment")
    op.drop_table("production_predictions")
    op.drop_table("production_history")
    op.drop_table("reserve_predictions")
    op.drop_table("exploration_data")
    op.drop_table("mining_zones")
