from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class BattleLog(Base):
    """
    Persistent storage for battle event logs
    Stores all battle events (attacks, defeats, player joins/leaves, etc.)
    """
    __tablename__ = "battle_logs"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for system messages

    # Log Content
    username = Column(String, nullable=True)  # Cached username for faster retrieval
    log_type = Column(String, nullable=False)  # "attack", "enemy_defeated", "player_joined", "player_left", "system", "death", "resurrection"
    message = Column(Text, nullable=False)  # Human-readable log message

    # Battle Event Data (for rich log display)
    enemy_id = Column(Integer, nullable=True)  # Enemy involved in the event
    enemy_name = Column(String, nullable=True)  # Cached enemy name
    damage = Column(BigInteger, nullable=True)  # Damage dealt (for attacks)
    enemy_hp_remaining = Column(BigInteger, nullable=True)  # Enemy HP after event

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    battle = relationship("Battle")
    user = relationship("User")

    def to_dict(self):
        """Convert to dictionary for WebSocket transmission"""
        result = {
            "id": self.id,
            "battle_id": self.battle_id,
            "type": self.log_type,
            "message": self.message,
            "timestamp": self.created_at.isoformat()
        }

        # Add optional fields if present
        if self.user_id:
            result["userId"] = self.user_id
        if self.username:
            result["username"] = self.username
            result["player_name"] = self.username  # Backend uses player_name
        if self.enemy_id:
            result["enemy_id"] = self.enemy_id
        if self.enemy_name:
            result["enemy_name"] = self.enemy_name
        if self.damage is not None:
            result["damage"] = self.damage
        if self.enemy_hp_remaining is not None:
            result["enemy_hp_remaining"] = self.enemy_hp_remaining

        return result
