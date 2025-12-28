from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from app.models.battle import AttackType


class EnemyInfo(BaseModel):
    """Enemy information in a battle"""
    id: int
    name: str
    type: str
    level: int
    icon: Optional[str] = None
    hp_current: int
    hp_max: int
    attack: int
    defense: int
    is_defeated: bool


class ParticipantSummary(BaseModel):
    """Summary info for a battle participant"""
    id: int
    player_id: int
    username: str
    level: int
    total_damage_dealt: int
    is_dead: bool = False

    class Config:
        from_attributes = True


class BattleInfo(BaseModel):
    """Detailed battle information"""
    id: int
    name: str
    difficulty: str
    wave_number: int
    status: str
    required_level: int
    stamina_cost: int
    max_players: int
    current_players: int
    gold_reward: int
    exp_reward: int
    enemies: List[EnemyInfo]
    participants: List[ParticipantSummary] = []
    is_boss_raid: bool = False
    battle_type: str = "standard"


class BattleListItem(BaseModel):
    """Condensed battle info for listing"""
    id: int
    name: str
    difficulty: str
    wave_number: int
    status: str
    required_level: int
    stamina_cost: int
    current_players: int
    max_players: int
    gold_reward: int
    exp_reward: int
    is_boss_raid: bool = False
    battle_type: str = "STANDARD"


class CreateBattleRequest(BaseModel):
    """Request to create a new battle"""
    difficulty: str = Field(..., description="easy, medium, hard, epic, or legendary")
    wave_number: int = Field(1, ge=1, le=100, description="Wave number (1-100)")
    required_level: int = Field(1, ge=1, le=100, description="Minimum level required")
    max_players: int = Field(10, ge=1, le=50, description="Maximum players allowed")


class JoinBattleResponse(BaseModel):
    """Response after joining a battle"""
    success: bool
    message: str
    battle_id: int
    participant_id: Optional[int] = None


class AttackRequest(BaseModel):
    """Request to attack an enemy"""
    enemy_id: int = Field(..., description="ID of the enemy to attack")
    attack_type: AttackType = Field(default=AttackType.NORMAL, description="Type of attack to perform")


class AttackResponse(BaseModel):
    """Response after attacking"""
    success: bool
    damage: Optional[int] = None
    is_critical: Optional[bool] = None
    enemy_id: Optional[int] = None
    enemy_hp_remaining: Optional[int] = None
    enemy_defeated: Optional[bool] = None
    battle_completed: Optional[bool] = None
    attack_type: Optional[str] = None
    stamina_cost: Optional[int] = None
    stamina_remaining: Optional[int] = None
    error: Optional[str] = None


class LootItem(BaseModel):
    """Item dropped as loot"""
    id: int
    name: str
    type: str
    rarity: str


class ClaimLootResponse(BaseModel):
    """Response after claiming loot"""
    success: bool
    gold: Optional[int] = None
    xp: Optional[int] = None
    items: Optional[List[LootItem]] = None
    contribution_percent: Optional[float] = None
    level_up_info: Optional[Dict] = None
    error: Optional[str] = None


class BattleParticipantInfo(BaseModel):
    """Information about a battle participant"""
    id: int
    player_id: int
    total_damage_dealt: int
    attacks_count: int
    has_claimed_loot: bool
    joined_at: datetime

    class Config:
        from_attributes = True
