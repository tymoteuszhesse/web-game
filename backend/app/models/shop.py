from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class ShopPurchase(Base):
    """Track shop purchases for analytics and anti-cheat"""
    __tablename__ = "shop_purchases"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Purchase Info
    item_type = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    cost_gold = Column(BigInteger, default=0)
    cost_gems = Column(Integer, default=0)
    purchased_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    player = relationship("Player", back_populates="shop_purchases")
