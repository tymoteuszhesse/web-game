"""add_icon_to_battle_enemies

Revision ID: 471173850e43
Revises: 0558a452c1c6
Create Date: 2025-12-22 14:14:19.413315

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '471173850e43'
down_revision = '0558a452c1c6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add icon column to battle_enemies table
    op.add_column('battle_enemies', sa.Column('icon', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove icon column from battle_enemies table
    op.drop_column('battle_enemies', 'icon')
