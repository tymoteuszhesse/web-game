from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, BigInteger, JSON, TypeDecorator
from sqlalchemy.orm import relationship
from enum import Enum
from datetime import datetime
from app.db.database import Base


class EnumAsString(TypeDecorator):
    """
    Custom SQLAlchemy type that stores Python Enum values as strings.
    Uses the enum's .value attribute instead of .name to ensure lowercase strings.
    """
    impl = String
    cache_ok = True

    def __init__(self, enum_class, *args, **kwargs):
        self.enum_class = enum_class
        super().__init__(*args, **kwargs)

    def process_bind_param(self, value, dialect):
        """Convert Python enum to string value for database"""
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value.value  # Use .value to get lowercase string
        return value

    def process_result_value(self, value, dialect):
        """Convert database string back to Python enum"""
        if value is None:
            return None
        return self.enum_class(value)


class BattleStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class EnemyType(str, Enum):
    GOBLIN = "GOBLIN"
    ORC = "ORC"
    TROLL = "TROLL"
    LIZARDMAN = "LIZARDMAN"
    DEMON = "DEMON"
    DRAGON = "DRAGON"
    UNDEAD = "UNDEAD"


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EPIC = "epic"
    LEGENDARY = "legendary"


class BattleType(str, Enum):
    STANDARD = "standard"
    BOSS_RAID = "boss_raid"


class AttackType(str, Enum):
    """
    Different attack types with varying power and stamina costs
    """
    QUICK = "quick"          # Fast, low damage, low stamina (5)
    NORMAL = "normal"        # Balanced damage, medium stamina (10)
    POWER = "power"          # High damage, high stamina (20)
    CRITICAL = "critical"    # Very high damage, very high stamina (35)
    ULTIMATE = "ultimate"    # Massive damage, massive stamina (50)


class Battle(Base):
    __tablename__ = "battles"

    id = Column(Integer, primary_key=True, index=True)

    # Battle Info
    name = Column(String, nullable=False)
    difficulty = Column(EnumAsString(DifficultyLevel), nullable=False)
    wave_number = Column(Integer, nullable=False)
    battle_type = Column(EnumAsString(BattleType), default=BattleType.STANDARD, nullable=False)
    is_boss_raid = Column(Boolean, default=False)

    # Battle Configuration
    max_players = Column(Integer, default=10)
    required_level = Column(Integer, default=1)
    stamina_cost = Column(Integer, default=10)

    # Boss Raid Configuration
    boss_phase_count = Column(Integer, default=3)
    boss_current_phase = Column(Integer, default=1)
    boss_phase_thresholds = Column(JSON, default=[75, 50, 25])  # HP % thresholds for phases
    min_players = Column(Integer, default=1)  # Minimum players required (for boss raids)

    # Status
    status = Column(EnumAsString(BattleStatus), default=BattleStatus.WAITING)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Rewards
    gold_reward = Column(BigInteger, default=100)
    exp_reward = Column(BigInteger, default=50)
    loot_table = Column(JSON, default=[])  # Array of possible item drops

    # Relationships
    enemies = relationship("BattleEnemy", back_populates="battle", cascade="all, delete-orphan")
    participants = relationship("BattleParticipant", back_populates="battle", cascade="all, delete-orphan")


class BattleEnemy(Base):
    __tablename__ = "battle_enemies"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=False)

    # Enemy Info
    enemy_type = Column(EnumAsString(EnemyType), nullable=False)
    name = Column(String, nullable=False)
    level = Column(Integer, nullable=False)
    icon = Column(String, nullable=True)  # Icon filename (e.g., "Icon1.png")

    # Stats
    hp_max = Column(BigInteger, nullable=False)
    hp_current = Column(BigInteger, nullable=False)
    attack = Column(Integer, nullable=False)
    defense = Column(Integer, nullable=False)

    # Status
    is_defeated = Column(Boolean, default=False)
    defeated_at = Column(DateTime, nullable=True)

    # Relationships
    battle = relationship("Battle", back_populates="enemies")


class BattleParticipant(Base):
    __tablename__ = "battle_participants"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Participation Info
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Combat Stats
    total_damage_dealt = Column(BigInteger, default=0)
    attacks_count = Column(Integer, default=0)

    # Death Mechanics (for boss raids)
    is_dead = Column(Boolean, default=False)
    death_timestamp = Column(DateTime, nullable=True)
    resurrection_count = Column(Integer, default=0)

    # Rewards
    has_claimed_loot = Column(Boolean, default=False)
    claimed_at = Column(DateTime, nullable=True)
    rewards = Column(JSON, default={})  # Store received gold, exp, items

    # Relationships
    battle = relationship("Battle", back_populates="participants")
    player = relationship("Player", back_populates="battle_participations")
