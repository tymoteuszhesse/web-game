from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.models.inventory import InventoryItem, EquipmentSet, SetType, EquipmentSlot, ItemType
from app.models.buff import ActiveBuff, BuffType
from app.core.security import get_current_active_user
from app.schemas.inventory import (
    InventoryResponse,
    InventoryItemResponse,
    EquipmentSetResponse,
    EquipItemRequest,
    UnequipItemRequest,
    EquipmentStatsResponse,
    UsePotionResponse,
    ActiveBuffResponse
)
import structlog
from app.services.inventory_service import (
    get_or_create_equipment_set,
    equip_item_to_slot,
    unequip_item_from_slot,
    calculate_equipment_stats,
    create_item_for_player,
    give_starter_items
)

router = APIRouter()
logger = structlog.get_logger()


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


@router.post("/use-potion/{item_id}", response_model=UsePotionResponse)
async def use_potion(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Use a potion from inventory"""

    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    # Get the potion
    potion = db.query(InventoryItem).filter(
        InventoryItem.id == item_id,
        InventoryItem.player_id == player.id,
        InventoryItem.item_type == ItemType.CONSUMABLE
    ).first()

    if not potion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Potion not found in inventory"
        )

    if potion.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Potion quantity is 0"
        )

    # Get potion properties
    properties = potion.properties or {}
    potion_type = properties.get("potion_type")
    effect_value = properties.get("effect_value", 0)
    duration = properties.get("duration")

    if not potion_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid potion - missing potion_type"
        )

    buff_applied = None
    response_data = {
        "success": True,
        "message": "",
        "remaining_quantity": potion.quantity - 1
    }

    # Apply potion effect based on type
    if potion_type == "STAMINA_RESTORE":
        # Restore stamina (full restore if effect_value >= 9999)
        if effect_value >= 9999:
            player.stamina = player.stamina_max
            response_data["message"] = "Stamina fully restored!"
        else:
            player.stamina = min(player.stamina_max, player.stamina + effect_value)
            response_data["message"] = f"Restored {effect_value} stamina!"

        response_data["stamina"] = player.stamina
        response_data["stamina_max"] = player.stamina_max

    elif potion_type == "STAMINA_BOOST":
        # Temporary stamina max increase
        if not duration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stamina boost potion missing duration"
            )

        # Clean up expired buffs first
        db.query(ActiveBuff).filter(
            ActiveBuff.player_id == player.id,
            ActiveBuff.expires_at <= datetime.utcnow()
        ).delete()
        db.commit()

        # Check if player already has a stamina boost active
        existing_boost = db.query(ActiveBuff).filter(
            ActiveBuff.player_id == player.id,
            ActiveBuff.buff_type == BuffType.STAMINA_BOOST,
            ActiveBuff.expires_at > datetime.utcnow()
        ).first()

        if existing_boost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active stamina boost!"
            )

        # Create stamina boost buff
        expires_at = datetime.utcnow() + timedelta(seconds=duration)
        buff = ActiveBuff(
            player_id=player.id,
            buff_type=BuffType.STAMINA_BOOST,
            effect_value=effect_value,
            applied_at=datetime.utcnow(),
            expires_at=expires_at,
            source="potion",
            source_id=str(item_id)
        )
        db.add(buff)
        db.flush()

        buff_applied = ActiveBuffResponse(
            id=buff.id,
            buff_type=buff.buff_type.value,
            effect_value=buff.effect_value,
            applied_at=buff.applied_at,
            expires_at=buff.expires_at,
            source=buff.source
        )

        response_data["message"] = f"Stamina boosted to {effect_value} for {duration // 60} minutes!"
        response_data["stamina"] = player.stamina
        response_data["stamina_max"] = effect_value

    elif potion_type == "ATTACK_BOOST":
        # Temporary attack multiplier
        if not duration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attack boost potion missing duration"
            )

        # Clean up expired buffs first
        db.query(ActiveBuff).filter(
            ActiveBuff.player_id == player.id,
            ActiveBuff.expires_at <= datetime.utcnow()
        ).delete()
        db.commit()

        # Check if player already has an attack boost active
        existing_boost = db.query(ActiveBuff).filter(
            ActiveBuff.player_id == player.id,
            ActiveBuff.buff_type == BuffType.ATTACK_BOOST,
            ActiveBuff.expires_at > datetime.utcnow()
        ).first()

        if existing_boost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active attack boost!"
            )

        # Create attack boost buff
        expires_at = datetime.utcnow() + timedelta(seconds=duration)
        buff = ActiveBuff(
            player_id=player.id,
            buff_type=BuffType.ATTACK_BOOST,
            effect_value=effect_value,
            applied_at=datetime.utcnow(),
            expires_at=expires_at,
            source="potion",
            source_id=str(item_id)
        )
        db.add(buff)
        db.flush()

        buff_applied = ActiveBuffResponse(
            id=buff.id,
            buff_type=buff.buff_type.value,
            effect_value=buff.effect_value,
            applied_at=buff.applied_at,
            expires_at=buff.expires_at,
            source=buff.source
        )

        response_data["message"] = f"Attack multiplied by {effect_value}x for {duration // 60} minutes!"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown potion type: {potion_type}"
        )

    # Decrease potion quantity
    potion.quantity -= 1
    if potion.quantity <= 0:
        db.delete(potion)

    db.commit()

    # Refresh player to get latest data
    if potion.quantity > 0:
        db.refresh(potion)
    db.refresh(player)

    logger.info(
        "potion_used",
        player_id=player.id,
        potion_id=item_id,
        potion_name=potion.name,
        potion_type=potion_type,
        effect_value=effect_value,
        buff_applied=buff_applied is not None
    )

    response_data["buff_applied"] = buff_applied
    return UsePotionResponse(**response_data)


@router.post("/cleanup-expired-buffs")
async def cleanup_expired_buffs(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Clean up all expired buffs for current player"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Delete expired buffs
    now = datetime.utcnow()
    deleted_count = db.query(ActiveBuff).filter(
        ActiveBuff.player_id == player.id,
        ActiveBuff.expires_at <= now
    ).delete()
    db.commit()

    return {
        "message": f"Cleaned up {deleted_count} expired buffs",
        "deleted_count": deleted_count
    }
