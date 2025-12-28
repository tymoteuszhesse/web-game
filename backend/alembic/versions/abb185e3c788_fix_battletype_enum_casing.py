"""fix_battletype_enum_casing

Revision ID: abb185e3c788
Revises: 25d6442e04a5
Create Date: 2025-12-12 22:36:10.295604

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'abb185e3c788'
down_revision = '25d6442e04a5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update battletype enum values from lowercase to uppercase to match other enums
    op.execute("ALTER TYPE battletype RENAME VALUE 'standard' TO 'STANDARD'")
    op.execute("ALTER TYPE battletype RENAME VALUE 'boss_raid' TO 'BOSS_RAID'")


def downgrade() -> None:
    # Revert battletype enum values back to lowercase
    op.execute("ALTER TYPE battletype RENAME VALUE 'STANDARD' TO 'standard'")
    op.execute("ALTER TYPE battletype RENAME VALUE 'BOSS_RAID' TO 'boss_raid'")
