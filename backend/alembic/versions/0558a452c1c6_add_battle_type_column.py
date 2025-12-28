"""add_battle_type_column

Revision ID: 0558a452c1c6
Revises: abb185e3c788
Create Date: 2025-12-13 00:21:39.377431

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0558a452c1c6'
down_revision = 'abb185e3c788'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add battle_type column with default value STANDARD
    op.execute("""
        ALTER TABLE battles
        ADD COLUMN IF NOT EXISTS battle_type battletype NOT NULL DEFAULT 'STANDARD'
    """)


def downgrade() -> None:
    # Remove battle_type column
    op.drop_column('battles', 'battle_type')
