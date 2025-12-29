"""add_chat_messages_and_battle_logs_tables

Revision ID: 7722f7210712
Revises: 0eb7e7c62d47
Create Date: 2025-12-29 17:01:01.799453

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7722f7210712'
down_revision = '0eb7e7c62d47'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_id'), 'chat_messages', ['id'], unique=False)
    op.create_index(op.f('ix_chat_messages_created_at'), 'chat_messages', ['created_at'], unique=False)

    # Create battle_logs table
    op.create_table(
        'battle_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('battle_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('log_type', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('enemy_id', sa.Integer(), nullable=True),
        sa.Column('enemy_name', sa.String(), nullable=True),
        sa.Column('damage', sa.BigInteger(), nullable=True),
        sa.Column('enemy_hp_remaining', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['battle_id'], ['battles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_battle_logs_id'), 'battle_logs', ['id'], unique=False)
    op.create_index(op.f('ix_battle_logs_created_at'), 'battle_logs', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_battle_logs_created_at'), table_name='battle_logs')
    op.drop_index(op.f('ix_battle_logs_id'), table_name='battle_logs')
    op.drop_index(op.f('ix_chat_messages_created_at'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_id'), table_name='chat_messages')

    # Drop tables
    op.drop_table('battle_logs')
    op.drop_table('chat_messages')
