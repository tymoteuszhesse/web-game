"""Change battle_id to string in duels table

Revision ID: 0eb7e7c62d47
Revises: 9344acbba28d
Create Date: 2025-12-27 00:19:46.064253

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0eb7e7c62d47'
down_revision = '9344acbba28d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop foreign key constraint first (if it exists)
    with op.batch_alter_table('duels') as batch_op:
        batch_op.drop_constraint('duels_battle_id_fkey', type_='foreignkey')
        # Change column type from Integer to String
        batch_op.alter_column('battle_id',
                              existing_type=sa.Integer(),
                              type_=sa.String(),
                              existing_nullable=True)


def downgrade() -> None:
    # Revert back to Integer
    with op.batch_alter_table('duels') as batch_op:
        batch_op.alter_column('battle_id',
                              existing_type=sa.String(),
                              type_=sa.Integer(),
                              existing_nullable=True)
        # Re-add foreign key
        batch_op.create_foreign_key('duels_battle_id_fkey', 'battles', ['battle_id'], ['id'])
