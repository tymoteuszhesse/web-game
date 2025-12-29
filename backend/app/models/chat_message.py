from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class ChatMessage(Base):
    """
    Persistent storage for global chat messages
    Stores all messages in the tavern chat
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Message Content
    username = Column(String, nullable=False)  # Cached username for faster retrieval
    text = Column(Text, nullable=False)
    message_type = Column(String, default="message")  # "message", "system", "join", "leave"

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User")

    def to_dict(self):
        """Convert to dictionary for WebSocket transmission"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "username": self.username,
            "text": self.text,
            "type": self.message_type,
            "timestamp": self.created_at.isoformat()
        }
