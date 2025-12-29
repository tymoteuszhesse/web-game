from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PlayerBase(BaseModel):
    username: str


class PlayerStats(BaseModel):
    level: int
    exp: int
    exp_max: int
    gold: int
    gems: int
    stamina: int
    stamina_max: int
    base_attack: int
    base_defense: int
    base_hp: int
    unspent_stat_points: int


class ActiveBuffSchema(BaseModel):
    """Active buff information"""
    id: int
    buff_type: str
    effect_value: int
    applied_at: datetime
    expires_at: datetime
    source: str

    class Config:
        from_attributes = True
        use_enum_values = True


class PlayerResponse(PlayerBase, PlayerStats):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    active_buffs: List[ActiveBuffSchema] = []

    class Config:
        from_attributes = True


class StatAllocation(BaseModel):
    attack: int = Field(0, ge=0)
    defense: int = Field(0, ge=0)
    max_stamina: int = Field(0, ge=0)


class GainXPRequest(BaseModel):
    """Request to award XP to player (for testing/admin)"""
    xp_amount: int = Field(..., gt=0, description="Amount of XP to award")
    source: str = Field("manual", description="Source of XP (e.g., 'battle', 'quest', 'manual')")


class LevelUpInfo(BaseModel):
    """Information about a level up event"""
    leveled_up: bool
    old_level: int
    new_level: int
    levels_gained: int
    stat_points_earned: int
    total_xp: int
    xp_gained: int


class ProgressionInfo(BaseModel):
    """Detailed progression information for UI display"""
    current_level: int
    total_xp: int
    xp_in_current_level: int
    xp_for_next_level: int
    xp_to_next_level: int
    progress_percent: float
    max_level_reached: bool
    unspent_stat_points: int
    next_level_rewards: dict


class LevelProgressionEntry(BaseModel):
    """Single entry in level progression table"""
    level: int
    xp_required: int
    total_xp: int
    stat_points_reward: int
