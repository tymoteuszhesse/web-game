"""
Debug API endpoints for development and testing
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.core.security import get_current_active_user

router = APIRouter()


class UpdateStatsRequest(BaseModel):
    """Request to update player stats"""
    base_attack: Optional[int] = None
    base_defense: Optional[int] = None
    base_hp: Optional[int] = None
    gold: Optional[int] = None
    gems: Optional[int] = None
    level: Optional[int] = None
    stamina: Optional[int] = None


@router.post("/players/debug/update-stats")
async def update_player_stats(
    updates: UpdateStatsRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update player stats for debugging purposes
    Adds the specified values to current stats (except level which is set directly)
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()

    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Update stats (add to existing values)
    if updates.base_attack is not None:
        player.base_attack = player.base_attack + updates.base_attack

    if updates.base_defense is not None:
        player.base_defense = player.base_defense + updates.base_defense

    if updates.base_hp is not None:
        player.base_hp = player.base_hp + updates.base_hp

    if updates.gold is not None:
        player.gold = player.gold + updates.gold

    if updates.gems is not None:
        player.gems = player.gems + updates.gems

    if updates.stamina is not None:
        player.stamina = min(player.stamina + updates.stamina, player.stamina_max)

    # Level is set directly, not added
    if updates.level is not None:
        player.level = updates.level
        # Recalculate exp max for new level
        player.exp_max = 100 * (player.level ** 1.5)

    db.commit()
    db.refresh(player)

    return {
        "success": True,
        "message": "Stats updated",
        "player": {
            "username": player.username,
            "level": player.level,
            "base_attack": player.base_attack,
            "base_defense": player.base_defense,
            "base_hp": player.base_hp,
            "gold": player.gold,
            "gems": player.gems,
            "stamina": player.stamina
        }
    }
