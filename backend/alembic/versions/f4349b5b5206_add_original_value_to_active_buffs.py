"""add original_value to active_buffs

Revision ID: f4349b5b5206
Revises: 6aadafa6ae51
Create Date: 2025-12-30 01:07:53.660990

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f4349b5b5206'
down_revision = '6aadafa6ae51'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add original_value column to active_buffs table
    op.add_column('active_buffs', sa.Column('original_value', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove original_value column from active_buffs table
    op.drop_column('active_buffs', 'original_value')
