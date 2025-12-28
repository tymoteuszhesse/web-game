from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Character Info
    username = Column(String, unique=True, index=True, nullable=False)

    # Progression
    level = Column(Integer, default=1)
    exp = Column(BigInteger, default=0)
    exp_max = Column(BigInteger, default=100)

    # Resources
    gold = Column(BigInteger, default=1000)
    gems = Column(Integer, default=0)
    stamina = Column(Integer, default=100)
    stamina_max = Column(Integer, default=100)

    # Stats
    base_attack = Column(Integer, default=10)
    base_defense = Column(Integer, default=10)
    base_hp = Column(Integer, default=100)
    unspent_stat_points = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_stamina_regen = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="player")
    inventory_items = relationship("InventoryItem", back_populates="player", cascade="all, delete-orphan")
    equipment_sets = relationship("EquipmentSet", back_populates="player", cascade="all, delete-orphan")
    pets = relationship("Pet", back_populates="player", cascade="all, delete-orphan")
    pet_sets = relationship("PetSet", back_populates="player", cascade="all, delete-orphan")
    battle_participations = relationship("BattleParticipant", back_populates="player", cascade="all, delete-orphan")
    shop_purchases = relationship("ShopPurchase", back_populates="player", cascade="all, delete-orphan")

    def calculate_total_attack(self):
        """Calculate total attack including equipment and pets"""
        # This will be implemented with equipment/pet bonuses
        return self.base_attack

    def calculate_total_defense(self):
        """Calculate total defense including equipment and pets"""
        return self.base_defense

    def calculate_total_hp(self):
        """Calculate total HP including equipment and pets"""
        return self.base_hp
