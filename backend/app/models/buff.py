from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
import enum


class BuffType(str, enum.Enum):
    """Types of buffs/effects"""
    STAMINA_BOOST = "stamina_boost"
    ATTACK_BOOST = "attack_boost"
    DEFENSE_BOOST = "defense_boost"


class ActiveBuff(Base):
    """Active buffs/effects on a player"""
    __tablename__ = "active_buffs"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Buff details
    buff_type = Column(SQLEnum(BuffType), nullable=False)
    effect_value = Column(Integer, nullable=False)  # Multiplier or flat value
    original_value = Column(Integer, nullable=True)  # Original value to restore when buff expires (for stamina_max, etc.)

    # Timing
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    # Source
    source = Column(String, nullable=False)  # "potion", "skill", "item", etc.
    source_id = Column(String, nullable=True)  # ID of the potion/item that created this

    # Relationships
    player = relationship("Player", back_populates="active_buffs")

    def is_expired(self) -> bool:
        """Check if buff has expired"""
        return datetime.utcnow() >= self.expires_at
