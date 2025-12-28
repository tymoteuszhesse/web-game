"""
Development API Endpoints
For testing and debugging purposes only
Should be disabled in production
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.core.security import get_current_active_user
from app.services.progression_service import ProgressionService
import structlog

router = APIRouter()
logger = structlog.get_logger()


class DevResourceRequest(BaseModel):
    """Request to add resources"""
    amount: int = Field(..., description="Amount to add")


@router.post("/add-gold")
async def add_gold(
    req: DevResourceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add gold to player (DEV ONLY)"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player.gold += req.amount
    db.commit()
    db.refresh(player)

    logger.info(
        "dev_add_gold",
        player_id=player.id,
        amount=req.amount,
        new_total=player.gold
    )

    return {"success": True, "gold": player.gold, "added": req.amount}


@router.post("/add-gems")
async def add_gems(
    req: DevResourceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add gems to player (DEV ONLY)"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player.gems += req.amount
    db.commit()
    db.refresh(player)

    logger.info(
        "dev_add_gems",
        player_id=player.id,
        amount=req.amount,
        new_total=player.gems
    )

    return {"success": True, "gems": player.gems, "added": req.amount}


@router.post("/add-exp")
async def add_exp(
    req: DevResourceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add XP to player (DEV ONLY) - automatically handles level-ups"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Use ProgressionService to handle XP and level-ups properly
    level_up_info = ProgressionService.award_xp(
        db=db,
        player=player,
        xp_amount=req.amount,
        source="dev_command"
    )

    logger.info(
        "dev_add_exp",
        player_id=player.id,
        amount=req.amount,
        new_level=player.level,
        new_exp=player.exp,
        leveled_up=level_up_info["leveled_up"]
    )

    return {
        "success": True,
        "exp": player.exp,
        "level": player.level,
        "added": req.amount,
        "level_up_info": level_up_info
    }


@router.post("/add-stamina")
async def add_stamina(
    req: DevResourceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add stamina to player (DEV ONLY)"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Allow exceeding max stamina for testing
    player.stamina += req.amount
    db.commit()
    db.refresh(player)

    logger.info(
        "dev_add_stamina",
        player_id=player.id,
        amount=req.amount,
        new_total=player.stamina
    )

    return {"success": True, "stamina": player.stamina, "added": req.amount}


@router.post("/refill-stamina")
async def refill_stamina(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Refill stamina to max (DEV ONLY)"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player.stamina = player.stamina_max
    db.commit()
    db.refresh(player)

    logger.info(
        "dev_refill_stamina",
        player_id=player.id,
        stamina=player.stamina
    )

    return {"success": True, "stamina": player.stamina}


@router.post("/set-level")
async def set_level(
    req: DevResourceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Set player level (DEV ONLY)"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    target_level = max(1, min(100, req.amount))
    player.level = target_level
    player.exp = 0
    player.exp_max = ProgressionService.calculate_exp_for_level(target_level + 1)

    db.commit()
    db.refresh(player)

    logger.info(
        "dev_set_level",
        player_id=player.id,
        new_level=player.level
    )

    return {"success": True, "level": player.level, "exp_max": player.exp_max}
