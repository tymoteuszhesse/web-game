"""
Pet System Business Logic

Handles pet egg generation, hatching, feeding, leveling, and equipment.
"""
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
import random
from datetime import datetime

from app.models.pet import Pet, PetSpecies, PetFocus, PetSet
from app.models.inventory import SetType
from app.models.player import Player


# Pet species generation weights (rarity)
SPECIES_WEIGHTS = {
    PetSpecies.WOLF: 15,
    PetSpecies.BEAR: 15,
    PetSpecies.FOX: 15,
    PetSpecies.TIGER: 12,
    PetSpecies.LION: 12,
    PetSpecies.EAGLE: 10,
    PetSpecies.SERPENT: 8,
    PetSpecies.DRAGON: 3,
    PetSpecies.PHOENIX: 2,
    PetSpecies.GRIFFIN: 2,
    PetSpecies.UNICORN: 2,
    PetSpecies.HYDRA: 1,
    PetSpecies.CERBERUS: 1,
    PetSpecies.PEGASUS: 2,
}

# Pet focus generation weights
FOCUS_WEIGHTS = {
    PetFocus.ATTACK: 20,
    PetFocus.DEFENSE: 20,
    PetFocus.HP: 20,
    PetFocus.DAMAGE: 15,
    PetFocus.MIXED: 15,
    PetFocus.BALANCED: 10,
}

# Base stat multipliers per focus type (at level 1)
FOCUS_STATS = {
    PetFocus.ATTACK: {"attack": 15, "defense": 3, "hp": 10},
    PetFocus.DEFENSE: {"attack": 3, "defense": 15, "hp": 10},
    PetFocus.HP: {"attack": 3, "defense": 3, "hp": 30},
    PetFocus.DAMAGE: {"attack": 20, "defense": 1, "hp": 5},
    PetFocus.MIXED: {"attack": 10, "defense": 10, "hp": 10},
    PetFocus.BALANCED: {"attack": 8, "defense": 8, "hp": 15},
}

# XP required per level (exponential growth)
def calculate_xp_for_level(level: int) -> int:
    """Calculate XP required to reach the next level"""
    return int(100 * (1.5 ** (level - 1)))

# Stat growth per level
STAT_GROWTH = {
    PetFocus.ATTACK: {"attack": 3, "defense": 0.5, "hp": 2},
    PetFocus.DEFENSE: {"attack": 0.5, "defense": 3, "hp": 2},
    PetFocus.HP: {"attack": 0.5, "defense": 0.5, "hp": 5},
    PetFocus.DAMAGE: {"attack": 4, "defense": 0.2, "hp": 1},
    PetFocus.MIXED: {"attack": 2, "defense": 2, "hp": 2},
    PetFocus.BALANCED: {"attack": 1.5, "defense": 1.5, "hp": 3},
}


def generate_pet_egg(player_id: int) -> Dict:
    """
    Generate a random pet egg (species and focus are hidden until hatched)
    Returns egg data to be stored
    """
    # Randomly select species based on weights
    species_list = list(SPECIES_WEIGHTS.keys())
    species_weights_list = list(SPECIES_WEIGHTS.values())
    species = random.choices(species_list, weights=species_weights_list, k=1)[0]

    # Randomly select focus based on weights
    focus_list = list(FOCUS_WEIGHTS.keys())
    focus_weights_list = list(FOCUS_WEIGHTS.values())
    focus = random.choices(focus_list, weights=focus_weights_list, k=1)[0]

    return {
        "player_id": player_id,
        "species": species,
        "focus": focus,
        "is_egg": True,
        "level": 1,
        "exp": 0,
        "exp_max": calculate_xp_for_level(1),
        "name": None,  # Named during hatching
        "attack_bonus": 0,
        "defense_bonus": 0,
        "hp_bonus": 0,
    }


def create_pet_egg(db: Session, player_id: int) -> Pet:
    """Create a new pet egg for a player"""
    egg_data = generate_pet_egg(player_id)

    pet = Pet(**egg_data)
    db.add(pet)
    db.commit()
    db.refresh(pet)

    return pet


def hatch_pet(db: Session, pet: Pet, name: str) -> Pet:
    """
    Hatch a pet egg and reveal its species/stats
    """
    if not pet.is_egg:
        raise ValueError("Pet is already hatched")

    if not name or len(name.strip()) == 0:
        raise ValueError("Pet name is required")

    if len(name) > 20:
        raise ValueError("Pet name must be 20 characters or less")

    # Set name and mark as hatched
    pet.name = name.strip()
    pet.is_egg = False
    pet.hatched_at = datetime.utcnow()

    # Calculate initial stats based on focus
    # If focus is None, default to BALANCED
    focus = pet.focus or PetFocus.BALANCED
    base_stats = FOCUS_STATS[focus]
    pet.attack_bonus = base_stats["attack"]
    pet.defense_bonus = base_stats["defense"]
    pet.hp_bonus = base_stats["hp"]

    # Ensure focus is set
    if pet.focus is None:
        pet.focus = focus

    db.commit()
    db.refresh(pet)

    return pet


def feed_pet(db: Session, pet: Pet, xp_amount: int) -> Dict:
    """
    Feed a pet to give it XP (can trigger level ups)
    Returns level up information
    """
    if pet.is_egg:
        raise ValueError("Cannot feed an unhatched egg")

    if xp_amount <= 0:
        raise ValueError("XP amount must be positive")

    pet.exp += xp_amount
    levels_gained = 0

    # Check for level ups (can level up multiple times)
    while pet.exp >= pet.exp_max and pet.level < 100:  # Max level 100
        pet.exp -= pet.exp_max
        pet.level += 1
        levels_gained += 1

        # Calculate stat increases
        growth = STAT_GROWTH[pet.focus]
        pet.attack_bonus += int(growth["attack"])
        pet.defense_bonus += int(growth["defense"])
        pet.hp_bonus += int(growth["hp"])

        # Update XP requirement for next level
        pet.exp_max = calculate_xp_for_level(pet.level)

    db.commit()
    db.refresh(pet)

    return {
        "levels_gained": levels_gained,
        "new_level": pet.level,
        "xp": pet.exp,
        "xp_max": pet.exp_max,
        "stats": {
            "attack": pet.attack_bonus,
            "defense": pet.defense_bonus,
            "hp": pet.hp_bonus,
        }
    }


def get_or_create_pet_set(db: Session, player_id: int, set_type: SetType) -> PetSet:
    """Get or create a pet set for a player"""
    pet_set = db.query(PetSet).filter(
        and_(
            PetSet.player_id == player_id,
            PetSet.set_type == set_type
        )
    ).first()

    if not pet_set:
        pet_set = PetSet(
            player_id=player_id,
            set_type=set_type
        )
        db.add(pet_set)
        db.commit()
        db.refresh(pet_set)

    return pet_set


def equip_pet(db: Session, player: Player, pet: Pet, set_type: SetType, slot: int) -> PetSet:
    """
    Equip a pet to a specific slot in a pet set (1, 2, or 3)
    """
    if pet.is_egg:
        raise ValueError("Cannot equip an unhatched egg")

    # Validate ownership
    if pet.player_id != player.id:
        raise ValueError("You don't own this pet")

    # Validate slot
    if slot not in [1, 2, 3]:
        raise ValueError("Slot must be 1, 2, or 3")

    # Get or create the pet set
    pet_set = get_or_create_pet_set(db, player.id, set_type)

    # Unequip pet from any other slot first
    unequip_pet_from_all_slots(db, player.id, pet.id)

    # Equip to the specified slot
    if slot == 1:
        pet_set.pet_1_id = pet.id
    elif slot == 2:
        pet_set.pet_2_id = pet.id
    elif slot == 3:
        pet_set.pet_3_id = pet.id

    db.commit()
    db.refresh(pet_set)

    return pet_set


def unequip_pet(db: Session, player: Player, set_type: SetType, slot: int) -> PetSet:
    """Unequip a pet from a specific slot"""
    if slot not in [1, 2, 3]:
        raise ValueError("Slot must be 1, 2, or 3")

    pet_set = get_or_create_pet_set(db, player.id, set_type)

    # Unequip from the specified slot
    if slot == 1:
        pet_set.pet_1_id = None
    elif slot == 2:
        pet_set.pet_2_id = None
    elif slot == 3:
        pet_set.pet_3_id = None

    db.commit()
    db.refresh(pet_set)

    return pet_set


def unequip_pet_from_all_slots(db: Session, player_id: int, pet_id: int):
    """Unequip a pet from all slots in all sets"""
    pet_sets = db.query(PetSet).filter(PetSet.player_id == player_id).all()

    for pet_set in pet_sets:
        if pet_set.pet_1_id == pet_id:
            pet_set.pet_1_id = None
        if pet_set.pet_2_id == pet_id:
            pet_set.pet_2_id = None
        if pet_set.pet_3_id == pet_id:
            pet_set.pet_3_id = None

    db.commit()


def calculate_pet_set_stats(pet_set: PetSet, db: Session) -> Dict[str, int]:
    """Calculate total stats from all equipped pets in a set"""
    total_attack = 0
    total_defense = 0
    total_hp = 0

    # Get all equipped pets
    pet_ids = [pet_set.pet_1_id, pet_set.pet_2_id, pet_set.pet_3_id]
    pet_ids = [pid for pid in pet_ids if pid is not None]

    if pet_ids:
        pets = db.query(Pet).filter(Pet.id.in_(pet_ids)).all()
        for pet in pets:
            if not pet.is_egg:
                total_attack += pet.attack_bonus
                total_defense += pet.defense_bonus
                total_hp += pet.hp_bonus

    return {
        "attack": total_attack,
        "defense": total_defense,
        "hp": total_hp
    }


def get_player_pets(db: Session, player_id: int, include_unhatched: bool = True) -> List[Pet]:
    """Get all pets for a player"""
    query = db.query(Pet).filter(Pet.player_id == player_id)

    if not include_unhatched:
        query = query.filter(Pet.is_egg == False)

    return query.order_by(Pet.created_at.desc()).all()


def get_pet_by_id(db: Session, pet_id: int, player_id: int) -> Optional[Pet]:
    """Get a specific pet by ID (with ownership validation)"""
    return db.query(Pet).filter(
        and_(
            Pet.id == pet_id,
            Pet.player_id == player_id
        )
    ).first()
