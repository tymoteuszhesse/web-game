from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from app.db.database import Base


class ItemRarity(str, Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class ItemType(str, Enum):
    WEAPON = "weapon"
    HELMET = "helmet"
    ARMOR = "armor"
    BOOTS = "boots"
    GLOVES = "gloves"
    RING = "ring"
    AMULET = "amulet"
    PET_EQUIPMENT = "pet_equipment"
    CONSUMABLE = "consumable"


class EquipmentSlot(str, Enum):
    WEAPON = "weapon"
    HELMET = "helmet"
    ARMOR = "armor"
    BOOTS = "boots"
    GLOVES = "gloves"
    RING = "ring"
    RING2 = "ring2"
    AMULET = "amulet"


class SetType(str, Enum):
    ATTACK = "attack"
    DEFENSE = "defense"


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Item properties
    item_type = Column(SQLEnum(ItemType), nullable=False)
    name = Column(String, nullable=False)
    rarity = Column(SQLEnum(ItemRarity), nullable=False)
    level_requirement = Column(Integer, default=1)

    # Stats
    attack_bonus = Column(Integer, default=0)
    defense_bonus = Column(Integer, default=0)
    hp_bonus = Column(Integer, default=0)

    # Additional properties stored as JSON
    properties = Column(JSON, default={})

    # Stack info (for consumables)
    quantity = Column(Integer, default=1)

    # Relationships
    player = relationship("Player", back_populates="inventory_items")


class EquipmentSet(Base):
    __tablename__ = "equipment_sets"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    set_type = Column(SQLEnum(SetType), nullable=False)

    # Equipment slots (foreign keys to inventory items)
    weapon_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    helmet_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    armor_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    boots_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    gloves_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    ring_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    ring2_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    amulet_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)

    # Relationships
    player = relationship("Player", back_populates="equipment_sets")
    weapon = relationship("InventoryItem", foreign_keys=[weapon_id])
    helmet = relationship("InventoryItem", foreign_keys=[helmet_id])
    armor = relationship("InventoryItem", foreign_keys=[armor_id])
    boots = relationship("InventoryItem", foreign_keys=[boots_id])
    gloves = relationship("InventoryItem", foreign_keys=[gloves_id])
    ring = relationship("InventoryItem", foreign_keys=[ring_id])
    ring2 = relationship("InventoryItem", foreign_keys=[ring2_id])
    amulet = relationship("InventoryItem", foreign_keys=[amulet_id])
