from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.schemas.player import (
    PlayerResponse,
    StatAllocation,
    GainXPRequest,
    LevelUpInfo,
    ProgressionInfo,
    LevelProgressionEntry
)
from app.core.security import get_current_active_user
from app.core.config import settings
from app.services.progression_service import ProgressionService
import structlog

router = APIRouter()
logger = structlog.get_logger()


@router.get("/me", response_model=PlayerResponse)
async def get_player_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current player's profile"""
    player = db.query(Player).options(joinedload(Player.active_buffs)).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    # Regenerate stamina if needed
    _regenerate_stamina(player, db)

    # Filter out expired buffs and restore original values
    now = datetime.now(timezone.utc)
    logger.info("active_buffs_before_filter", player_id=player.id, buffs_count=len(player.active_buffs), buffs=[{"id": b.id, "type": b.buff_type, "expires_at": b.expires_at} for b in player.active_buffs])

    # Handle timezone-naive datetimes and restore original values for expired buffs
    from app.models.buff import ActiveBuff, BuffType

    active_buffs = []
    expired_buffs = []

    for buff in player.active_buffs:
        expires_at = buff.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at > now:
            active_buffs.append(buff)
        else:
            expired_buffs.append(buff)

    # Restore original values for expired stamina boost buffs
    for buff in expired_buffs:
        if buff.buff_type == BuffType.STAMINA_BOOST and buff.original_value is not None:
            player.stamina_max = buff.original_value
            player.stamina = min(player.stamina, player.stamina_max)
            player.updated_at = now
            logger.info("stamina_boost_expired_restored",
                       player_id=player.id,
                       restored_max=player.stamina_max,
                       buff_id=buff.id)
            db.commit()
        # Delete expired buff
        db.delete(buff)

    if expired_buffs:
        db.commit()
        db.refresh(player)

    player.active_buffs = active_buffs

    logger.info("active_buffs_after_filter", player_id=player.id, buffs_count=len(player.active_buffs), now=now)

    # Calculate exp progress within current level for UI display
    # player.exp stores total lifetime XP, but frontend needs progress within current level
    _, xp_in_current_level, xp_for_next_level = ProgressionService.calculate_level_from_xp(player.exp)

    # Store total XP for internal use
    total_xp = player.exp

    # Override exp with progress in current level for frontend display
    player.exp = xp_in_current_level
    player.exp_max = xp_for_next_level

    return player


@router.post("/allocate-stats")
async def allocate_stats(
    allocation: StatAllocation,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Allocate stat points"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    # Calculate total points to allocate
    total_points = allocation.attack + allocation.defense + allocation.max_stamina

    # Validate player has enough unspent points
    if total_points > player.unspent_stat_points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough stat points. Available: {player.unspent_stat_points}, Requested: {total_points}"
        )

    # Apply stat allocation
    player.base_attack += allocation.attack
    player.base_defense += allocation.defense
    player.stamina_max += allocation.max_stamina
    player.unspent_stat_points -= total_points

    # If max stamina increased, fill up stamina
    if allocation.max_stamina > 0:
        player.stamina = player.stamina_max

    player.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(player)

    return {
        "message": "Stats allocated successfully",
        "player": player
    }


@router.post("/regenerate-stamina")
async def regenerate_stamina(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manually trigger stamina regeneration check"""
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    _regenerate_stamina(player, db)

    return {
        "stamina": player.stamina,
        "stamina_max": player.stamina_max
    }


@router.post("/gain-xp", response_model=LevelUpInfo)
async def gain_xp(
    xp_request: GainXPRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Award XP to player (for testing/admin or battle rewards)

    Handles automatic level ups and stat point rewards
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    # Award XP and handle level ups
    result = ProgressionService.award_xp(
        db=db,
        player=player,
        xp_amount=xp_request.xp_amount,
        source=xp_request.source
    )

    return LevelUpInfo(**result)


@router.get("/progression", response_model=ProgressionInfo)
async def get_progression_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed progression information for current player

    Returns level, XP progress, stat points, and next level rewards
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found"
        )

    info = ProgressionService.get_player_progression_info(player)
    return ProgressionInfo(**info)


@router.get("/progression/table", response_model=list[LevelProgressionEntry])
async def get_progression_table(
    max_level: int = 20,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get level progression table showing XP requirements and rewards

    Useful for displaying progression information to players
    Args:
        max_level: Maximum level to show in table (default: 20, max: 100)
    """
    max_level = min(max(1, max_level), 100)  # Clamp between 1 and 100
    table = ProgressionService.get_level_progression_table(max_level)
    return [LevelProgressionEntry(**entry) for entry in table]


@router.post("/debug/set-level")
async def debug_set_level(
    level: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to set player level directly

    FOR TESTING ONLY
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Clamp level between 1 and 100
    level = max(1, min(100, level))

    # Update player level
    player.level = level
    player.exp = 0
    player.exp_max = ProgressionService.calculate_xp_for_level(level + 1)
    player.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(player)

    logger.info("debug_level_set", player_id=player.id, new_level=level)

    return {"success": True, "level": level, "player": player}


def _regenerate_stamina(player: Player, db: Session):
    """Helper function to regenerate stamina based on time elapsed"""
    now = datetime.now(timezone.utc)

    # Handle timezone-naive datetimes from existing database records
    last_regen = player.last_stamina_regen
    if last_regen.tzinfo is None:
        last_regen = last_regen.replace(tzinfo=timezone.utc)

    time_diff = (now - last_regen).total_seconds()

    # Calculate how many regen intervals have passed
    intervals = int(time_diff / settings.STAMINA_REGEN_INTERVAL)

    if intervals > 0:
        # Regenerate stamina
        regen_amount = int(player.stamina_max * settings.STAMINA_REGEN_PERCENT * intervals)
        player.stamina = min(player.stamina + regen_amount, player.stamina_max)
        player.last_stamina_regen = now
        player.updated_at = now
        db.commit()
