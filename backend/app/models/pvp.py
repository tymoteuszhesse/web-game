"""
PVP Duel System Models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.db.database import Base


class DuelStatus(str, Enum):
    """Status of a PVP duel"""
    PENDING = "pending"  # Challenge sent, awaiting response
    ACCEPTED = "accepted"  # Challenge accepted, ready to fight
    IN_PROGRESS = "in_progress"  # Battle is ongoing
    COMPLETED = "completed"  # Battle finished
    DECLINED = "declined"  # Challenge declined
    CANCELLED = "cancelled"  # Challenge cancelled by challenger
    EXPIRED = "expired"  # Challenge expired (no response)


class Duel(Base):
    """PVP Duel Challenge and Match"""
    __tablename__ = "duels"

    id = Column(Integer, primary_key=True, index=True)

    # Participants
    challenger_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    defender_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Duel Configuration
    gold_stake = Column(BigInteger, nullable=False)  # Amount wagered by each player
    status = Column(SQLEnum(DuelStatus), default=DuelStatus.PENDING, nullable=False)

    # Battle Result (when completed)
    winner_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    battle_id = Column(String, nullable=True)  # In-memory battle ID from PvPBattleManager

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # Challenge expiration time

    # Relationships
    challenger = relationship("Player", foreign_keys=[challenger_id], backref="challenges_sent")
    defender = relationship("Player", foreign_keys=[defender_id], backref="challenges_received")
    winner = relationship("Player", foreign_keys=[winner_id], backref="duels_won")


class PvPStats(Base):
    """Player PVP Statistics"""
    __tablename__ = "pvp_stats"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), unique=True, nullable=False)

    # Win/Loss Record
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)

    # Gold Statistics
    gold_won = Column(BigInteger, default=0)
    gold_lost = Column(BigInteger, default=0)
    gold_wagered = Column(BigInteger, default=0)  # Total gold wagered across all duels

    # Streak
    current_win_streak = Column(Integer, default=0)
    best_win_streak = Column(Integer, default=0)

    # Rating (for matchmaking - future feature)
    rating = Column(Integer, default=1000)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    player = relationship("Player", backref="pvp_stats")
