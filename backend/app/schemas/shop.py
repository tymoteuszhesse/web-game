from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime


class ShopItemStats(BaseModel):
    """Stats for shop items"""
    attack: int = 0
    defense: int = 0
    hp: int = 0


class ShopItemBase(BaseModel):
    """Base shop item schema"""
    id: str
    name: str
    type: str  # WEAPON, HELMET, ARMOR, BOOTS, GLOVES, RING, AMULET, EGG, FOOD
    rarity: str  # COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
    level: int = 1
    price: int  # Gold price
    gem_price: Optional[int] = None  # Optional gem price
    description: str
    icon: Optional[str] = None  # Icon filename (e.g., "Icon1.png")


class ShopEquipmentItem(ShopItemBase):
    """Equipment item in shop"""
    stats: ShopItemStats


class ShopEggItem(ShopItemBase):
    """Pet egg item in shop"""
    pet_type: Optional[str] = None  # Species (dragon, phoenix, etc.) - None for mystery eggs
    pet_stats: ShopItemStats


class ShopFoodItem(ShopItemBase):
    """Pet food item in shop"""
    pet_exp: int  # How much XP this food gives


class PurchaseRequest(BaseModel):
    """Request to purchase an item"""
    item_id: str = Field(..., description="ID of the item to purchase")
    use_gems: bool = Field(default=False, description="Whether to use gems instead of gold")


class PurchaseResponse(BaseModel):
    """Response after purchasing an item"""
    success: bool
    message: str
    item_id: Optional[str] = None  # ID of the newly created inventory/pet item
    gold_remaining: Optional[int] = None
    gems_remaining: Optional[int] = None


class ShopCatalogResponse(BaseModel):
    """Response containing all shop items"""
    equipment: list[ShopEquipmentItem]
    eggs: list[ShopEggItem]
    food: list[ShopFoodItem]


class PurchaseHistoryItem(BaseModel):
    """Single purchase history entry"""
    id: int
    item_type: str
    item_name: str
    cost_gold: int
    cost_gems: int
    purchased_at: datetime

    class Config:
        from_attributes = True
