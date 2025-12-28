"""
Pet System API Endpoints

Handles pet eggs, hatching, feeding, leveling, and equipment.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.core.security import get_current_active_user
from app.schemas.pet import (
    PetResponse,
    PetCollectionResponse,
    PetSetResponse,
    PetStatsResponse,
    HatchPetRequest,
    FeedPetRequest,
    EquipPetRequest,
    UnequipPetRequest,
    FeedResultResponse,
    EquipResultResponse,
    UnequipResultResponse,
)
from app.services import pet_service
from app.models.inventory import SetType

router = APIRouter()


@router.get("/", response_model=PetCollectionResponse)
async def get_pets(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get player's complete pet collection with equipped pets"""
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get all pets
    pets = pet_service.get_player_pets(db, player.id, include_unhatched=True)

    # Get pet sets
    attack_set = pet_service.get_or_create_pet_set(db, player.id, SetType.ATTACK)
    defense_set = pet_service.get_or_create_pet_set(db, player.id, SetType.DEFENSE)

    # Convert to response models
    pet_responses = [PetResponse.from_pet(pet) for pet in pets]

    # Build pet set responses with actual pet data
    attack_set_response = PetSetResponse(
        id=attack_set.id,
        set_type=attack_set.set_type,
        pet_1=PetResponse.from_pet(attack_set.pet_1) if attack_set.pet_1 else None,
        pet_2=PetResponse.from_pet(attack_set.pet_2) if attack_set.pet_2 else None,
        pet_3=PetResponse.from_pet(attack_set.pet_3) if attack_set.pet_3 else None,
    )

    defense_set_response = PetSetResponse(
        id=defense_set.id,
        set_type=defense_set.set_type,
        pet_1=PetResponse.from_pet(defense_set.pet_1) if defense_set.pet_1 else None,
        pet_2=PetResponse.from_pet(defense_set.pet_2) if defense_set.pet_2 else None,
        pet_3=PetResponse.from_pet(defense_set.pet_3) if defense_set.pet_3 else None,
    )

    return PetCollectionResponse(
        pets=pet_responses,
        attack_set=attack_set_response,
        defense_set=defense_set_response
    )


@router.post("/egg", status_code=status.HTTP_201_CREATED)
async def create_egg(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a new pet egg for the player"""
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Create egg
    egg = pet_service.create_pet_egg(db, player.id)

    return {
        "message": "Pet egg created successfully",
        "egg": PetResponse.from_pet(egg)
    }


@router.post("/hatch")
async def hatch_pet(
    request: HatchPetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Hatch a pet egg and give it a name"""
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get pet
    pet = pet_service.get_pet_by_id(db, request.pet_id, player.id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Hatch the egg
    try:
        hatched_pet = pet_service.hatch_pet(db, pet, request.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": f"Congratulations! Your {hatched_pet.species.value} has hatched!",
        "pet": PetResponse.from_pet(hatched_pet)
    }


@router.post("/feed", response_model=FeedResultResponse)
async def feed_pet(
    request: FeedPetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Feed a pet to give it XP (may trigger level ups)"""
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get pet
    pet = pet_service.get_pet_by_id(db, request.pet_id, player.id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Feed the pet
    try:
        result = pet_service.feed_pet(db, pet, request.xp_amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Reload pet to get updated data
    db.refresh(pet)

    # Build message
    if result["levels_gained"] > 0:
        message = f"{pet.name} gained {result['levels_gained']} level(s)! Now level {result['new_level']}!"
    else:
        message = f"{pet.name} gained {request.xp_amount} XP!"

    return FeedResultResponse(
        message=message,
        levels_gained=result["levels_gained"],
        new_level=result["new_level"],
        exp=result["xp"],
        exp_max=result["xp_max"],
        stats=PetStatsResponse(**result["stats"]),
        pet=PetResponse.from_pet(pet)
    )


@router.post("/equip", response_model=EquipResultResponse)
async def equip_pet(
    request: EquipPetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Equip a pet to a specific slot in a pet set"""
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get pet
    pet = pet_service.get_pet_by_id(db, request.pet_id, player.id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Equip the pet
    try:
        pet_set = pet_service.equip_pet(db, player, pet, request.set_type, request.slot)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Calculate stats
    stats = pet_service.calculate_pet_set_stats(pet_set, db)

    # Build response
    pet_set_response = PetSetResponse(
        id=pet_set.id,
        set_type=pet_set.set_type,
        pet_1=PetResponse.from_pet(pet_set.pet_1) if pet_set.pet_1 else None,
        pet_2=PetResponse.from_pet(pet_set.pet_2) if pet_set.pet_2 else None,
        pet_3=PetResponse.from_pet(pet_set.pet_3) if pet_set.pet_3 else None,
    )

    return EquipResultResponse(
        message=f"{pet.name} equipped to {request.set_type.value} set slot {request.slot}",
        pet_set=pet_set_response,
        stats=PetStatsResponse(**stats)
    )


@router.post("/unequip", response_model=UnequipResultResponse)
async def unequip_pet(
    request: UnequipPetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unequip a pet from a specific slot"""
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Unequip the pet
    try:
        pet_set = pet_service.unequip_pet(db, player, request.set_type, request.slot)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Calculate stats
    stats = pet_service.calculate_pet_set_stats(pet_set, db)

    # Build response
    pet_set_response = PetSetResponse(
        id=pet_set.id,
        set_type=pet_set.set_type,
        pet_1=PetResponse.from_pet(pet_set.pet_1) if pet_set.pet_1 else None,
        pet_2=PetResponse.from_pet(pet_set.pet_2) if pet_set.pet_2 else None,
        pet_3=PetResponse.from_pet(pet_set.pet_3) if pet_set.pet_3 else None,
    )

    return UnequipResultResponse(
        message=f"Pet unequipped from {request.set_type.value} set slot {request.slot}",
        pet_set=pet_set_response,
        stats=PetStatsResponse(**stats)
    )


@router.get("/stats/{set_type}", response_model=PetStatsResponse)
async def get_pet_set_stats(
    set_type: SetType,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get total stats for a pet set"""
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get pet set
    pet_set = pet_service.get_or_create_pet_set(db, player.id, set_type)

    # Calculate stats
    stats = pet_service.calculate_pet_set_stats(pet_set, db)

    return PetStatsResponse(**stats)
