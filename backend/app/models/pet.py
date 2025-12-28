from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, Boolean, DateTime
from sqlalchemy.orm import relationship
from enum import Enum
from datetime import datetime
from app.db.database import Base
from app.models.inventory import SetType


class PetSpecies(str, Enum):
    DRAGON = "dragon"
    WOLF = "wolf"
    BEAR = "bear"
    FOX = "fox"
    PHOENIX = "phoenix"
    TIGER = "tiger"
    LION = "lion"
    EAGLE = "eagle"
    SERPENT = "serpent"
    GRIFFIN = "griffin"
    UNICORN = "unicorn"
    HYDRA = "hydra"
    CERBERUS = "cerberus"
    PEGASUS = "pegasus"
    WYVERN = "wyvern"
    SPIDER = "spider"
    MYSTERY = "mystery"  # For unhatched eggs with unknown species


class PetFocus(str, Enum):
    ATTACK = "attack"
    DEFENSE = "defense"
    HP = "hp"
    DAMAGE = "damage"
    MIXED = "mixed"
    BALANCED = "balanced"


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Pet Info
    name = Column(String, nullable=True)  # Null for eggs, set during hatching
    species = Column(SQLEnum(PetSpecies), nullable=True)  # Can be null for mystery eggs
    focus = Column(SQLEnum(PetFocus), nullable=True)  # Set during hatching

    # Progression
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    exp_max = Column(Integer, default=100)

    # Stats
    base_attack = Column(Integer, default=5)
    base_defense = Column(Integer, default=5)
    base_hp = Column(Integer, default=20)
    attack_bonus = Column(Integer, default=5)  # Bonus from level/focus
    defense_bonus = Column(Integer, default=5)
    hp_bonus = Column(Integer, default=20)

    # Equipment slots (simplified - 3 slots per set)
    attack_equip_1 = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    attack_equip_2 = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    attack_equip_3 = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    defense_equip_1 = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    defense_equip_2 = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    defense_equip_3 = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)

    # Status
    is_egg = Column(Boolean, default=False)
    hatched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    player = relationship("Player", back_populates="pets")


class PetSet(Base):
    __tablename__ = "pet_sets"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    set_type = Column(SQLEnum(SetType), nullable=False)

    # 3 pet slots per set
    pet_1_id = Column(Integer, ForeignKey("pets.id"), nullable=True)
    pet_2_id = Column(Integer, ForeignKey("pets.id"), nullable=True)
    pet_3_id = Column(Integer, ForeignKey("pets.id"), nullable=True)

    # Relationships
    player = relationship("Player", back_populates="pet_sets")
    pet_1 = relationship("Pet", foreign_keys=[pet_1_id])
    pet_2 = relationship("Pet", foreign_keys=[pet_2_id])
    pet_3 = relationship("Pet", foreign_keys=[pet_3_id])
