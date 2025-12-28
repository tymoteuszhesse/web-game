"""convert_enum_columns_to_string

Revision ID: 828a490a599b
Revises: 471173850e43
Create Date: 2025-12-24 01:28:07.885637

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '828a490a599b'
down_revision = '471173850e43'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert ENUM columns to VARCHAR in battles table
    op.execute("ALTER TABLE battles ALTER COLUMN difficulty TYPE VARCHAR USING difficulty::text")
    op.execute("ALTER TABLE battles ALTER COLUMN battle_type TYPE VARCHAR USING battle_type::text")
    op.execute("ALTER TABLE battles ALTER COLUMN status TYPE VARCHAR USING status::text")

    # Convert ENUM columns to VARCHAR in battle_enemies table
    op.execute("ALTER TABLE battle_enemies ALTER COLUMN enemy_type TYPE VARCHAR USING enemy_type::text")

    # Convert ENUM columns to VARCHAR in inventory_items table
    op.execute("ALTER TABLE inventory_items ALTER COLUMN item_type TYPE VARCHAR USING item_type::text")
    op.execute("ALTER TABLE inventory_items ALTER COLUMN rarity TYPE VARCHAR USING rarity::text")

    # Convert ENUM columns to VARCHAR in equipment_sets table
    op.execute("ALTER TABLE equipment_sets ALTER COLUMN set_type TYPE VARCHAR USING set_type::text")

    # Convert ENUM columns to VARCHAR in pets table
    op.execute("ALTER TABLE pets ALTER COLUMN species TYPE VARCHAR USING species::text")
    op.execute("ALTER TABLE pets ALTER COLUMN focus TYPE VARCHAR USING focus::text")

    # Drop the ENUM types after conversion (if they exist and aren't being used)
    # Note: These drops might fail if there are dependencies, which is fine
    op.execute("DROP TYPE IF EXISTS battlestatus CASCADE")
    op.execute("DROP TYPE IF EXISTS difficultytype CASCADE")
    op.execute("DROP TYPE IF EXISTS battletype CASCADE")
    op.execute("DROP TYPE IF EXISTS enemytype CASCADE")
    op.execute("DROP TYPE IF EXISTS itemtype CASCADE")
    op.execute("DROP TYPE IF EXISTS itemrarity CASCADE")
    op.execute("DROP TYPE IF EXISTS settype CASCADE")
    op.execute("DROP TYPE IF EXISTS petspecies CASCADE")
    op.execute("DROP TYPE IF EXISTS petfocus CASCADE")


def downgrade() -> None:
    # Recreate ENUM types
    op.execute("CREATE TYPE battlestatus AS ENUM ('waiting', 'in_progress', 'completed', 'abandoned')")
    op.execute("CREATE TYPE difficultytype AS ENUM ('easy', 'medium', 'hard', 'epic', 'legendary')")
    op.execute("CREATE TYPE battletype AS ENUM ('standard', 'boss_raid')")
    op.execute("CREATE TYPE enemytype AS ENUM ('GOBLIN', 'ORC', 'TROLL', 'LIZARDMAN', 'DEMON', 'DRAGON', 'UNDEAD')")
    op.execute("CREATE TYPE itemtype AS ENUM ('weapon', 'helmet', 'chest', 'legs', 'boots', 'shield', 'ring', 'amulet', 'consumable', 'material')")
    op.execute("CREATE TYPE itemrarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary')")
    op.execute("CREATE TYPE settype AS ENUM ('attack', 'defense')")
    op.execute("CREATE TYPE petspecies AS ENUM ('dragon', 'wyvern', 'wolf', 'bear', 'tiger', 'lion', 'fox', 'raven', 'owl', 'snake', 'turtle', 'spider', 'scorpion', 'unicorn', 'cat')")
    op.execute("CREATE TYPE petfocus AS ENUM ('attack', 'defense', 'hp', 'damage', 'mixed', 'balanced')")

    # Convert VARCHAR columns back to ENUM
    op.execute("ALTER TABLE battles ALTER COLUMN difficulty TYPE difficultytype USING difficulty::difficultytype")
    op.execute("ALTER TABLE battles ALTER COLUMN battle_type TYPE battletype USING battle_type::battletype")
    op.execute("ALTER TABLE battles ALTER COLUMN status TYPE battlestatus USING status::battlestatus")
    op.execute("ALTER TABLE battle_enemies ALTER COLUMN enemy_type TYPE enemytype USING enemy_type::enemytype")
    op.execute("ALTER TABLE inventory_items ALTER COLUMN item_type TYPE itemtype USING item_type::itemtype")
    op.execute("ALTER TABLE inventory_items ALTER COLUMN rarity TYPE itemrarity USING rarity::itemrarity")
    op.execute("ALTER TABLE equipment_sets ALTER COLUMN set_type TYPE settype USING set_type::settype")
    op.execute("ALTER TABLE pets ALTER COLUMN species TYPE petspecies USING species::petspecies")
    op.execute("ALTER TABLE pets ALTER COLUMN focus TYPE petfocus USING focus::petfocus")
