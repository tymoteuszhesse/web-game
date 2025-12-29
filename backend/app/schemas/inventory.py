from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.inventory import ItemType, ItemRarity, EquipmentSlot, SetType


class InventoryItemResponse(BaseModel):
    id: int
    item_type: ItemType
    name: str
    rarity: ItemRarity
    level_requirement: int
    attack_bonus: int
    defense_bonus: int
    hp_bonus: int
    quantity: int
    properties: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
        use_enum_values = True


class EquipmentSetResponse(BaseModel):
    id: int
    set_type: SetType
    weapon: Optional[InventoryItemResponse] = None
    helmet: Optional[InventoryItemResponse] = None
    armor: Optional[InventoryItemResponse] = None
    boots: Optional[InventoryItemResponse] = None
    gloves: Optional[InventoryItemResponse] = None
    ring: Optional[InventoryItemResponse] = None
    ring2: Optional[InventoryItemResponse] = None
    amulet: Optional[InventoryItemResponse] = None

    class Config:
        from_attributes = True


class InventoryResponse(BaseModel):
    items: List[InventoryItemResponse]
    attack_set: EquipmentSetResponse
    defense_set: EquipmentSetResponse


class EquipItemRequest(BaseModel):
    item_id: int
    set_type: SetType
    slot: EquipmentSlot


class UnequipItemRequest(BaseModel):
    set_type: SetType
    slot: EquipmentSlot


class EquipmentStatsResponse(BaseModel):
    attack: int
    defense: int
    hp: int


class ActiveBuffResponse(BaseModel):
    """Response for an active buff"""
    id: int
    buff_type: str
    effect_value: int
    applied_at: datetime
    expires_at: datetime
    source: str

    class Config:
        from_attributes = True


class UsePotionResponse(BaseModel):
    """Response after using a potion"""
    success: bool
    message: str
    stamina: Optional[int] = None
    stamina_max: Optional[int] = None
    buff_applied: Optional[ActiveBuffResponse] = None
    remaining_quantity: int
