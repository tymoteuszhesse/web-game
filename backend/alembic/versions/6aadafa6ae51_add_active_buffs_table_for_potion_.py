"""Add active buffs table for potion effects

Revision ID: 6aadafa6ae51
Revises: 7722f7210712
Create Date: 2025-12-29 22:03:02.881735

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6aadafa6ae51'
down_revision = '7722f7210712'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create active_buffs table
    op.create_table(
        'active_buffs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=False),
        sa.Column('buff_type', sa.String(), nullable=False),
        sa.Column('effect_value', sa.Integer(), nullable=False),
        sa.Column('applied_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('source_id', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_active_buffs_id'), 'active_buffs', ['id'], unique=False)


def downgrade() -> None:
    # Drop active_buffs table
    op.drop_index(op.f('ix_active_buffs_id'), table_name='active_buffs')
    op.drop_table('active_buffs')
