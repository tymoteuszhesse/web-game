import random
from typing import Dict, Optional
from sqlalchemy.orm import Session
from app.models.inventory import InventoryItem, EquipmentSet, ItemType, ItemRarity, EquipmentSlot, SetType
from app.models.player import Player


# Item generation tables based on rarity
RARITY_STATS = {
    ItemRarity.COMMON: {"min": 5, "max": 15},
    ItemRarity.UNCOMMON: {"min": 15, "max": 30},
    ItemRarity.RARE: {"min": 30, "max": 50},
    ItemRarity.EPIC: {"min": 50, "max": 80},
    ItemRarity.LEGENDARY: {"min": 80, "max": 120}
}

RARITY_LEVEL_REQ = {
    ItemRarity.COMMON: 1,
    ItemRarity.UNCOMMON: 5,
    ItemRarity.RARE: 10,
    ItemRarity.EPIC: 20,
    ItemRarity.LEGENDARY: 30
}

ITEM_NAME_PREFIXES = {
    ItemRarity.COMMON: ["Worn", "Old", "Simple", "Basic", "Rusty"],
    ItemRarity.UNCOMMON: ["Sturdy", "Fine", "Quality", "Enhanced", "Improved"],
    ItemRarity.RARE: ["Superior", "Exceptional", "Master", "Forged", "Crafted"],
    ItemRarity.EPIC: ["Legendary", "Ancient", "Mystic", "Enchanted", "Blessed"],
    ItemRarity.LEGENDARY: ["Divine", "Godly", "Celestial", "Ethereal", "Supreme"]
}

ITEM_NAMES = {
    ItemType.WEAPON: ["Sword", "Axe", "Mace", "Dagger", "Spear", "Bow"],
    ItemType.HELMET: ["Helm", "Crown", "Hood", "Cap", "Circlet"],
    ItemType.ARMOR: ["Plate", "Mail", "Robe", "Vest", "Cuirass"],
    ItemType.BOOTS: ["Boots", "Greaves", "Shoes", "Sabatons"],
    ItemType.GLOVES: ["Gauntlets", "Gloves", "Bracers", "Handwraps"],
    ItemType.RING: ["Ring", "Band", "Circle", "Loop"],
    ItemType.AMULET: ["Amulet", "Pendant", "Necklace", "Charm"]
}


def generate_item(
    item_type: ItemType,
    rarity: ItemRarity,
    level_requirement: Optional[int] = None
) -> Dict:
    """Generate item stats and name"""

    # Generate name
    prefix = random.choice(ITEM_NAME_PREFIXES[rarity])
    base_name = random.choice(ITEM_NAMES[item_type])
    name = f"{prefix} {base_name}"

    # Calculate stats based on rarity
    stats = RARITY_STATS[rarity]

    # Weapons focus on attack
    if item_type == ItemType.WEAPON:
        attack_bonus = random.randint(stats["min"], stats["max"])
        defense_bonus = random.randint(0, stats["min"] // 2)
        hp_bonus = 0
    # Armor focuses on defense and HP
    elif item_type == ItemType.ARMOR:
        attack_bonus = 0
        defense_bonus = random.randint(stats["min"], stats["max"])
        hp_bonus = random.randint(stats["min"] * 2, stats["max"] * 2)
    # Helmets and boots balanced defense/hp
    elif item_type in [ItemType.HELMET, ItemType.BOOTS]:
        attack_bonus = 0
        defense_bonus = random.randint(stats["min"] // 2, stats["max"] // 2)
        hp_bonus = random.randint(stats["min"], stats["max"])
    # Gloves can have attack or defense
    elif item_type == ItemType.GLOVES:
        attack_bonus = random.randint(0, stats["max"] // 2)
        defense_bonus = random.randint(0, stats["max"] // 2)
        hp_bonus = random.randint(0, stats["min"])
    # Rings and amulets are balanced
    else:
        attack_bonus = random.randint(stats["min"] // 3, stats["max"] // 3)
        defense_bonus = random.randint(stats["min"] // 3, stats["max"] // 3)
        hp_bonus = random.randint(stats["min"] // 2, stats["max"] // 2)

    return {
        "name": name,
        "item_type": item_type,
        "rarity": rarity,
        "level_requirement": level_requirement or RARITY_LEVEL_REQ[rarity],
        "attack_bonus": attack_bonus,
        "defense_bonus": defense_bonus,
        "hp_bonus": hp_bonus
    }


def create_item_for_player(db: Session, player_id: int, item_type: ItemType, rarity: ItemRarity) -> InventoryItem:
    """Create and add an item to player's inventory"""
    item_data = generate_item(item_type, rarity)

    item = InventoryItem(
        player_id=player_id,
        **item_data
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def get_or_create_equipment_set(db: Session, player_id: int, set_type: SetType) -> EquipmentSet:
    """Get or create an equipment set for a player"""
    equipment_set = db.query(EquipmentSet).filter(
        EquipmentSet.player_id == player_id,
        EquipmentSet.set_type == set_type
    ).first()

    if not equipment_set:
        equipment_set = EquipmentSet(
            player_id=player_id,
            set_type=set_type
        )
        db.add(equipment_set)
        db.commit()
        db.refresh(equipment_set)

    return equipment_set


def calculate_equipment_stats(equipment_set: EquipmentSet, db: Session) -> Dict[str, int]:
    """Calculate total stats from equipped items"""
    total_attack = 0
    total_defense = 0
    total_hp = 0

    # Get all equipped item IDs
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

    # Filter out None values
    item_ids = [id for id in item_ids if id is not None]

    if item_ids:
        items = db.query(InventoryItem).filter(InventoryItem.id.in_(item_ids)).all()

        for item in items:
            total_attack += item.attack_bonus
            total_defense += item.defense_bonus
            total_hp += item.hp_bonus

    return {
        "attack": total_attack,
        "defense": total_defense,
        "hp": total_hp
    }


def equip_item_to_slot(
    db: Session,
    player: Player,
    item: InventoryItem,
    set_type: SetType,
    slot: EquipmentSlot
) -> EquipmentSet:
    """Equip an item to a specific slot"""

    # Validate item belongs to player
    if item.player_id != player.id:
        raise ValueError("Item does not belong to player")

    # Validate level requirement
    if item.level_requirement > player.level:
        raise ValueError(f"Player level {player.level} too low. Required: {item.level_requirement}")

    # Validate item type matches slot
    slot_item_type_map = {
        EquipmentSlot.WEAPON: ItemType.WEAPON,
        EquipmentSlot.HELMET: ItemType.HELMET,
        EquipmentSlot.ARMOR: ItemType.ARMOR,
        EquipmentSlot.BOOTS: ItemType.BOOTS,
        EquipmentSlot.GLOVES: ItemType.GLOVES,
        EquipmentSlot.RING: ItemType.RING,
        EquipmentSlot.RING2: ItemType.RING,
        EquipmentSlot.AMULET: ItemType.AMULET
    }

    expected_type = slot_item_type_map.get(slot)
    if expected_type and item.item_type != expected_type:
        raise ValueError(f"Cannot equip {item.item_type.value} in {slot.value} slot")

    # Get or create equipment set
    equipment_set = get_or_create_equipment_set(db, player.id, set_type)

    # Check if item is already equipped elsewhere
    all_sets = db.query(EquipmentSet).filter(EquipmentSet.player_id == player.id).all()
    for eq_set in all_sets:
        for slot_name in ['weapon_id', 'helmet_id', 'armor_id', 'boots_id',
                         'gloves_id', 'ring_id', 'ring2_id', 'amulet_id']:
            if getattr(eq_set, slot_name) == item.id:
                # Unequip from current slot
                setattr(eq_set, slot_name, None)

    # Equip to new slot
    slot_id_map = {
        EquipmentSlot.WEAPON: 'weapon_id',
        EquipmentSlot.HELMET: 'helmet_id',
        EquipmentSlot.ARMOR: 'armor_id',
        EquipmentSlot.BOOTS: 'boots_id',
        EquipmentSlot.GLOVES: 'gloves_id',
        EquipmentSlot.RING: 'ring_id',
        EquipmentSlot.RING2: 'ring2_id',
        EquipmentSlot.AMULET: 'amulet_id'
    }

    slot_field = slot_id_map[slot]
    setattr(equipment_set, slot_field, item.id)

    db.commit()
    db.refresh(equipment_set)

    return equipment_set


def unequip_item_from_slot(
    db: Session,
    player: Player,
    set_type: SetType,
    slot: EquipmentSlot
) -> EquipmentSet:
    """Unequip an item from a specific slot"""

    equipment_set = get_or_create_equipment_set(db, player.id, set_type)

    slot_id_map = {
        EquipmentSlot.WEAPON: 'weapon_id',
        EquipmentSlot.HELMET: 'helmet_id',
        EquipmentSlot.ARMOR: 'armor_id',
        EquipmentSlot.BOOTS: 'boots_id',
        EquipmentSlot.GLOVES: 'gloves_id',
        EquipmentSlot.RING: 'ring_id',
        EquipmentSlot.RING2: 'ring2_id',
        EquipmentSlot.AMULET: 'amulet_id'
    }

    slot_field = slot_id_map[slot]
    setattr(equipment_set, slot_field, None)

    db.commit()
    db.refresh(equipment_set)

    return equipment_set


def give_starter_items(db: Session, player_id: int):
    """Give new players some starter items"""
    starter_items = [
        (ItemType.WEAPON, ItemRarity.COMMON),
        (ItemType.ARMOR, ItemRarity.COMMON),
        (ItemType.HELMET, ItemRarity.COMMON),
    ]

    for item_type, rarity in starter_items:
        create_item_for_player(db, player_id, item_type, rarity)
