from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.models.inventory import InventoryItem, EquipmentSet, SetType, EquipmentSlot
from app.core.security import get_current_active_user
from app.schemas.inventory import (
    InventoryResponse,
    InventoryItemResponse,
    EquipmentSetResponse,
    EquipItemRequest,
    UnequipItemRequest,
    EquipmentStatsResponse
)
from app.services.inventory_service import (
    get_or_create_equipment_set,
    equip_item_to_slot,
    unequip_item_from_slot,
    calculate_equipment_stats,
    create_item_for_player,
    give_starter_items
)

router = APIRouter()


def build_equipment_set_response(equipment_set: EquipmentSet, db: Session) -> EquipmentSetResponse:
    """Build equipment set response with all equipped items"""

    # Get all equipped items
    item_ids = [
        equipment_set.weapon_id,
        equipment_set.helmet_id,
        equipment_set.armor_id,
        equipment_set.boots_id,
        equipment_set.gloves_id,
        equipment_set.ring_id,
        equipment_set.ring2_id,
        equipment_set.amulet_id
    ]

    # Filter None and fetch items
    item_ids = [id for id in item_ids if id is not None]
    items = {}

    if item_ids:
        items_list = db.query(InventoryItem).filter(InventoryItem.id.in_(item_ids)).all()
        items = {item.id: item for item in items_list}

    return EquipmentSetResponse(
        id=equipment_set.id,
        set_type=equipment_set.set_type,
        weapon=items.get(equipment_set.weapon_id),
        helmet=items.get(equipment_set.helmet_id),
        armor=items.get(equipment_set.armor_id),
        boots=items.get(equipment_set.boots_id),
        gloves=items.get(equipment_set.gloves_id),
        ring=items.get(equipment_set.ring_id),
        ring2=items.get(equipment_set.ring2_id),
        amulet=items.get(equipment_set.amulet_id)
    )


@router.get("/", response_model=InventoryResponse)
async def get_inventory(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get player's complete inventory with equipped items"""

    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    # Get all inventory items
    items = db.query(InventoryItem).filter(InventoryItem.player_id == player.id).all()

    # Get or create equipment sets
    attack_set = get_or_create_equipment_set(db, player.id, SetType.ATTACK)
    defense_set = get_or_create_equipment_set(db, player.id, SetType.DEFENSE)

    return InventoryResponse(
        items=items,
        attack_set=build_equipment_set_response(attack_set, db),
        defense_set=build_equipment_set_response(defense_set, db)
    )


@router.post("/equip")
async def equip_item(
    request: EquipItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Equip an item to a specific slot"""

    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    # Get the item
    item = db.query(InventoryItem).filter(
        InventoryItem.id == request.item_id,
        InventoryItem.player_id == player.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in inventory"
        )

    try:
        equipment_set = equip_item_to_slot(db, player, item, request.set_type, request.slot)

        # Calculate new stats
        stats = calculate_equipment_stats(equipment_set, db)

        return {
            "message": "Item equipped successfully",
            "equipment_set": build_equipment_set_response(equipment_set, db),
            "stats": stats
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/unequip")
async def unequip_item(
    request: UnequipItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unequip an item from a specific slot"""

    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    try:
        equipment_set = unequip_item_from_slot(db, player, request.set_type, request.slot)

        # Calculate new stats
        stats = calculate_equipment_stats(equipment_set, db)

        return {
            "message": "Item unequipped successfully",
            "equipment_set": build_equipment_set_response(equipment_set, db),
            "stats": stats
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stats/{set_type}", response_model=EquipmentStatsResponse)
async def get_equipment_stats(
    set_type: SetType,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get total stats for an equipment set"""

    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    equipment_set = get_or_create_equipment_set(db, player.id, set_type)
    stats = calculate_equipment_stats(equipment_set, db)

    return EquipmentStatsResponse(**stats)


@router.post("/starter-items")
async def get_starter_items(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Give player starter items (one-time only)"""

    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    # Check if player already has items
    existing_items = db.query(InventoryItem).filter(InventoryItem.player_id == player.id).count()
    if existing_items > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Player already has items"
        )

    give_starter_items(db, player.id)

    return {"message": "Starter items added to inventory"}
