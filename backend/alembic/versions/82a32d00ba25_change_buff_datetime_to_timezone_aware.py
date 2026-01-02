"""change_buff_datetime_to_timezone_aware

Revision ID: 82a32d00ba25
Revises: f4349b5b5206
Create Date: 2026-01-02 13:42:05.901242

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '82a32d00ba25'
down_revision = 'f4349b5b5206'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change applied_at and expires_at columns to TIMESTAMPTZ (timezone-aware)
    op.execute('ALTER TABLE active_buffs ALTER COLUMN applied_at TYPE TIMESTAMPTZ USING applied_at AT TIME ZONE \'UTC\'')
    op.execute('ALTER TABLE active_buffs ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE \'UTC\'')


def downgrade() -> None:
    # Revert to TIMESTAMP (timezone-naive)
    op.execute('ALTER TABLE active_buffs ALTER COLUMN applied_at TYPE TIMESTAMP USING applied_at::TIMESTAMP')
    op.execute('ALTER TABLE active_buffs ALTER COLUMN expires_at TYPE TIMESTAMP USING expires_at::TIMESTAMP')
