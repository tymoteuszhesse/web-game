"""
Pet System Schemas

Pydantic models for pet API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.pet import PetSpecies, PetFocus
from app.models.inventory import SetType


# Request schemas
class HatchPetRequest(BaseModel):
    """Request to hatch a pet egg"""
    pet_id: int = Field(..., description="ID of the pet egg to hatch")
    name: str = Field(..., min_length=1, max_length=20, description="Name for the pet")


class FeedPetRequest(BaseModel):
    """Request to feed a pet"""
    pet_id: int = Field(..., description="ID of the pet to feed")
    xp_amount: int = Field(..., gt=0, description="Amount of XP to give (must be positive)")


class EquipPetRequest(BaseModel):
    """Request to equip a pet"""
    pet_id: int = Field(..., description="ID of the pet to equip")
    set_type: SetType = Field(..., description="Which set to equip to (attack/defense)")
    slot: int = Field(..., ge=1, le=3, description="Slot number (1, 2, or 3)")


class UnequipPetRequest(BaseModel):
    """Request to unequip a pet"""
    set_type: SetType = Field(..., description="Which set to unequip from (attack/defense)")
    slot: int = Field(..., ge=1, le=3, description="Slot number (1, 2, or 3)")


# Response schemas
class PetResponse(BaseModel):
    """Pet information"""
    id: int
    species: Optional[PetSpecies] = None  # Hidden if not hatched
    focus: Optional[PetFocus] = None  # Hidden if not hatched
    name: Optional[str] = None
    is_egg: bool
    level: int
    exp: int
    exp_max: int
    attack_bonus: int
    defense_bonus: int
    hp_bonus: int
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_pet(cls, pet):
        """Create response from Pet model, hiding info for unhatched eggs"""
        data = {
            "id": pet.id,
            "is_egg": pet.is_egg,
            "level": pet.level,
            "exp": pet.exp,
            "exp_max": pet.exp_max,
            "attack_bonus": pet.attack_bonus if not pet.is_egg else 0,
            "defense_bonus": pet.defense_bonus if not pet.is_egg else 0,
            "hp_bonus": pet.hp_bonus if not pet.is_egg else 0,
            "created_at": pet.created_at,
        }

        # Only reveal species, focus, and name if hatched
        if not pet.is_egg:
            data["species"] = pet.species
            data["focus"] = pet.focus
            data["name"] = pet.name
        else:
            data["species"] = None
            data["focus"] = None
            data["name"] = "Mystery Egg"

        return cls(**data)


class PetSetResponse(BaseModel):
    """Pet set information"""
    id: int
    set_type: SetType
    pet_1: Optional[PetResponse] = None
    pet_2: Optional[PetResponse] = None
    pet_3: Optional[PetResponse] = None

    class Config:
        from_attributes = True


class PetCollectionResponse(BaseModel):
    """All pets and sets for a player"""
    pets: List[PetResponse]
    attack_set: PetSetResponse
    defense_set: PetSetResponse


class PetStatsResponse(BaseModel):
    """Pet set stats"""
    attack: int
    defense: int
    hp: int


class FeedResultResponse(BaseModel):
    """Result of feeding a pet"""
    message: str
    levels_gained: int
    new_level: int
    exp: int
    exp_max: int
    stats: PetStatsResponse
    pet: PetResponse


class EquipResultResponse(BaseModel):
    """Result of equipping a pet"""
    message: str
    pet_set: PetSetResponse
    stats: PetStatsResponse


class UnequipResultResponse(BaseModel):
    """Result of unequipping a pet"""
    message: str
    pet_set: PetSetResponse
    stats: PetStatsResponse
