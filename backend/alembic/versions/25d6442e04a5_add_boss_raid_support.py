"""add_boss_raid_support

Revision ID: 25d6442e04a5
Revises: bedad79ccf34
Create Date: 2025-12-12 13:39:15.355987

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '25d6442e04a5'
down_revision = 'bedad79ccf34'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create BattleType enum
    battle_type_enum = postgresql.ENUM('standard', 'boss_raid', name='battletype', create_type=False)
    battle_type_enum.create(op.get_bind(), checkfirst=True)

    # Add boss raid fields to battles table
    op.add_column('battles', sa.Column('battle_type', sa.Enum('standard', 'boss_raid', name='battletype'), nullable=False, server_default='standard'))
    op.add_column('battles', sa.Column('is_boss_raid', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('battles', sa.Column('boss_phase_count', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('battles', sa.Column('boss_current_phase', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('battles', sa.Column('boss_phase_thresholds', sa.JSON(), nullable=True))
    op.add_column('battles', sa.Column('min_players', sa.Integer(), nullable=False, server_default='1'))

    # Set default phase thresholds for existing battles
    op.execute("UPDATE battles SET boss_phase_thresholds = '[75, 50, 25]' WHERE boss_phase_thresholds IS NULL")

    # Add death mechanics fields to battle_participants table
    op.add_column('battle_participants', sa.Column('is_dead', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('battle_participants', sa.Column('death_timestamp', sa.DateTime(), nullable=True))
    op.add_column('battle_participants', sa.Column('resurrection_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Remove columns from battle_participants
    op.drop_column('battle_participants', 'resurrection_count')
    op.drop_column('battle_participants', 'death_timestamp')
    op.drop_column('battle_participants', 'is_dead')

    # Remove columns from battles
    op.drop_column('battles', 'min_players')
    op.drop_column('battles', 'boss_phase_thresholds')
    op.drop_column('battles', 'boss_current_phase')
    op.drop_column('battles', 'boss_phase_count')
    op.drop_column('battles', 'is_boss_raid')
    op.drop_column('battles', 'battle_type')

    # Drop BattleType enum
    battle_type_enum = postgresql.ENUM('standard', 'boss_raid', name='battletype')
    battle_type_enum.drop(op.get_bind(), checkfirst=True)
