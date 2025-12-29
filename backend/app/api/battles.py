from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.models.battle import Battle, DifficultyLevel, BattleParticipant, BattleType, BattleStatus, BattleEnemy
from app.models.battle_log import BattleLog
from app.core.security import get_current_active_user
from app.services.battle_service import BattleService
from app.services.battle_pool_manager import BattlePoolManager
from app.websocket.battle_ws import get_battle_manager
from app.schemas.battle import (
    BattleInfo,
    BattleListItem,
    CreateBattleRequest,
    JoinBattleResponse,
    AttackRequest,
    AttackResponse,
    ClaimLootResponse,
    BattleParticipantInfo
)
import structlog
import asyncio

router = APIRouter()
logger = structlog.get_logger()


def persist_battle_log(
    db: Session,
    battle_id: int,
    log_type: str,
    message: str,
    user_id: int = None,
    username: str = None,
    enemy_id: int = None,
    enemy_name: str = None,
    damage: int = None,
    enemy_hp_remaining: int = None
):
    """Helper function to persist battle log to database"""
    try:
        battle_log = BattleLog(
            battle_id=battle_id,
            user_id=user_id,
            username=username,
            log_type=log_type,
            message=message,
            enemy_id=enemy_id,
            enemy_name=enemy_name,
            damage=damage,
            enemy_hp_remaining=enemy_hp_remaining
        )
        db.add(battle_log)
        db.commit()
        return battle_log
    except Exception as e:
        logger.error("failed_to_persist_battle_log", error=str(e))
        db.rollback()
        return None


@router.post("/create", response_model=BattleInfo)
async def create_battle(
    battle_req: CreateBattleRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new battle (admin/testing endpoint)

    Creates a battle with generated enemies based on difficulty
    """
    try:
        difficulty = DifficultyLevel(battle_req.difficulty.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid difficulty. Must be one of: {', '.join([d.value for d in DifficultyLevel])}"
        )

    battle = BattleService.create_battle(
        db=db,
        difficulty=difficulty,
        wave_number=battle_req.wave_number,
        required_level=battle_req.required_level,
        max_players=battle_req.max_players
    )

    battle_info = BattleService.get_battle_info(db, battle.id)
    return BattleInfo(**battle_info)


@router.post("/boss-raids/create", response_model=BattleInfo)
async def create_boss_raid(
    difficulty: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    boss_name: str = "Dark Lord Malakar",
    required_level: int = 10,
    min_players: int = 3,
    max_players: int = 20
):
    """
    Create a new boss raid battle

    Boss raids are epic encounters with:
    - Much higher HP and rewards
    - Multiple phases based on HP thresholds
    - Death mechanics (15 min cooldown)
    - Requires minimum players
    """
    try:
        difficulty_level = DifficultyLevel(difficulty.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid difficulty. Must be one of: {', '.join([d.value for d in DifficultyLevel])}"
        )

    battle = BattleService.create_boss_raid(
        db=db,
        difficulty=difficulty_level,
        boss_name=boss_name,
        required_level=required_level,
        min_players=min_players,
        max_players=max_players
    )

    battle_info = BattleService.get_battle_info(db, battle.id)
    return BattleInfo(**battle_info)


@router.get("/available", response_model=list[BattleListItem])
async def get_available_battles(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of available battles for the current player

    Auto-generates battles to maintain pool of 3 standard battles
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Ensure battle pool is maintained
    BattlePoolManager.ensure_battle_pool(db)

    battles = BattleService.get_available_battles(db, player, battle_type=BattleType.STANDARD)

    # Get participant counts
    battle_list = []
    for battle in battles:
        participant_count = db.query(BattleParticipant).filter(
            BattleParticipant.battle_id == battle.id,
            BattleParticipant.is_active == True
        ).count()

        battle_list.append(BattleListItem(
            id=battle.id,
            name=battle.name,
            difficulty=battle.difficulty.value,
            wave_number=battle.wave_number,
            status=battle.status.value,
            required_level=battle.required_level,
            stamina_cost=battle.stamina_cost,
            current_players=participant_count,
            max_players=battle.max_players,
            gold_reward=battle.gold_reward,
            exp_reward=battle.exp_reward,
            is_boss_raid=battle.is_boss_raid,
            battle_type=battle.battle_type.value
        ))

    return battle_list


@router.get("/boss-raids/available", response_model=list[BattleListItem])
async def get_available_boss_raids(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of available boss raids only

    Auto-generates boss raids to maintain pool of 1 boss raid
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Ensure battle pool is maintained
    BattlePoolManager.ensure_battle_pool(db)

    # Get all boss raids without level filtering (frontend will handle level requirements)
    battles = db.query(Battle).filter(
        Battle.status.in_([BattleStatus.WAITING, BattleStatus.IN_PROGRESS]),
        Battle.battle_type == BattleType.BOSS_RAID
    ).order_by(Battle.created_at.desc()).limit(20).all()

    battle_list = []
    for battle in battles:
        participant_count = db.query(BattleParticipant).filter(
            BattleParticipant.battle_id == battle.id,
            BattleParticipant.is_active == True
        ).count()

        battle_list.append(BattleListItem(
            id=battle.id,
            name=battle.name,
            difficulty=battle.difficulty.value,
            wave_number=battle.wave_number,
            status=battle.status.value,
            required_level=battle.required_level,
            stamina_cost=battle.stamina_cost,
            current_players=participant_count,
            max_players=battle.max_players,
            gold_reward=battle.gold_reward,
            exp_reward=battle.exp_reward,
            is_boss_raid=battle.is_boss_raid,
            battle_type=battle.battle_type.value
        ))

    return battle_list


@router.get("/{battle_id}", response_model=BattleInfo)
async def get_battle_details(
    battle_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific battle"""
    battle_info = BattleService.get_battle_info(db, battle_id)

    if not battle_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    return BattleInfo(**battle_info)


@router.post("/join/{battle_id}", response_model=JoinBattleResponse)
async def join_battle(
    battle_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Join a battle

    Validates:
    - Player level requirement
    - Sufficient stamina
    - Battle not full
    - Battle still active
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    success, message, participant = BattleService.join_battle(db, battle, player)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # Broadcast player joined event via WebSocket
    manager = get_battle_manager()
    background_tasks.add_task(
        manager.broadcast_to_battle,
        battle_id,
        {
            "type": "player_joined_battle",
            "player_name": player.username,
            "player_level": player.level,
            "participant_id": participant.id if participant else None,
            "battle_status": battle.status.value
        }
    )

    return JoinBattleResponse(
        success=True,
        message=message,
        battle_id=battle_id,
        participant_id=participant.id if participant else None
    )


@router.post("/{battle_id}/attack", response_model=AttackResponse)
async def attack_enemy(
    battle_id: int,
    attack_req: AttackRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Attack an enemy in battle

    Calculates damage server-side based on:
    - Player stats
    - Equipment bonuses
    - Pet bonuses
    - Enemy defense
    - Critical hit chance (10%)
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    result = BattleService.process_attack(
        db=db,
        battle=battle,
        player=player,
        enemy_id=attack_req.enemy_id,
        attack_type=attack_req.attack_type.value
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Attack failed")
        )

    # Get enemy name for logging
    enemy = db.query(BattleEnemy).filter(BattleEnemy.id == attack_req.enemy_id).first()
    enemy_name = enemy.name if enemy else "Enemy"

    # Persist attack log to database
    crit_text = " (CRITICAL HIT!)" if result.get("is_critical") else ""
    attack_message = f"{player.username} dealt {result.get('damage')} damage to {enemy_name}{crit_text}"
    persist_battle_log(
        db=db,
        battle_id=battle_id,
        log_type="attack",
        message=attack_message,
        user_id=current_user.id,
        username=player.username,
        enemy_id=result.get("enemy_id"),
        enemy_name=enemy_name,
        damage=result.get("damage"),
        enemy_hp_remaining=result.get("enemy_hp_remaining")
    )

    # Broadcast attack event to all players in battle via WebSocket
    manager = get_battle_manager()
    background_tasks.add_task(
        manager.broadcast_to_battle,
        battle_id,
        {
            "type": "attack",
            "player_name": player.username,
            "player_level": player.level,
            "enemy_id": result.get("enemy_id"),
            "damage": result.get("damage"),
            "is_critical": result.get("is_critical"),
            "enemy_hp_remaining": result.get("enemy_hp_remaining"),
            "enemy_defeated": result.get("enemy_defeated"),
            "battle_completed": result.get("battle_completed")
        }
    )

    # If enemy was defeated, broadcast that event too
    if result.get("enemy_defeated"):
        # Persist enemy defeated log
        defeat_message = f"{enemy_name} has been defeated by {player.username}!"
        persist_battle_log(
            db=db,
            battle_id=battle_id,
            log_type="enemy_defeated",
            message=defeat_message,
            user_id=current_user.id,
            username=player.username,
            enemy_id=result.get("enemy_id"),
            enemy_name=enemy_name
        )

        background_tasks.add_task(
            manager.broadcast_to_battle,
            battle_id,
            {
                "type": "enemy_defeated",
                "enemy_id": result.get("enemy_id"),
                "defeated_by": player.username
            }
        )

    # If battle completed, broadcast that event
    if result.get("battle_completed"):
        background_tasks.add_task(
            manager.broadcast_to_battle,
            battle_id,
            {
                "type": "battle_completed",
                "battle_id": battle_id,
                "message": "All enemies defeated! Claim your loot!"
            }
        )

    # Check for boss phase transition and broadcast
    if result.get("phase_transition"):
        phase_data = result.get("phase_transition")
        background_tasks.add_task(
            manager.broadcast_to_battle,
            battle_id,
            {
                "type": "boss_phase_change",
                "previous_phase": phase_data.get("previous_phase"),
                "new_phase": phase_data.get("new_phase"),
                "hp_percent": phase_data.get("hp_percent"),
                "description": phase_data.get("description")
            }
        )

    return AttackResponse(**result)


@router.post("/{battle_id}/resurrect")
async def resurrect_player(
    battle_id: int,
    use_potion: bool = False,
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Resurrect a dead player in a boss raid

    Options:
    - Wait 15 minutes (natural resurrection)
    - Use resurrection potion (costs 50 gems)
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    if not battle.is_boss_raid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resurrection is only available in boss raids"
        )

    # Get participant
    participant = db.query(BattleParticipant).filter(
        BattleParticipant.battle_id == battle_id,
        BattleParticipant.player_id == player.id,
        BattleParticipant.is_active == True
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not in this battle"
        )

    # Attempt resurrection
    success, message = BattleService.resurrect_player(
        db=db,
        participant=participant,
        player=player,
        use_potion=use_potion
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # Broadcast resurrection event
    if background_tasks:
        manager = get_battle_manager()
        background_tasks.add_task(
            manager.broadcast_to_battle,
            battle_id,
            {
                "type": "player_resurrected",
                "player_name": player.username,
                "used_potion": use_potion,
                "message": f"{player.username} has been resurrected!"
            }
        )

    return {"success": True, "message": message}


@router.post("/{battle_id}/claim-loot", response_model=ClaimLootResponse)
async def claim_loot(
    battle_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Claim loot from a completed battle

    Awards:
    - Gold (contribution-based)
    - XP (with automatic level-ups)
    - Random item drops (difficulty-based)

    Can only claim once per battle
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    # Refresh battle to ensure we have latest state
    db.refresh(battle)

    result = BattleService.claim_loot(db, battle, player)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to claim loot")
        )

    # Broadcast loot claim event
    manager = get_battle_manager()
    background_tasks.add_task(
        manager.broadcast_to_battle,
        battle_id,
        {
            "type": "loot_claimed",
            "player_name": player.username,
            "gold": result.get("gold"),
            "xp": result.get("xp"),
            "items_count": len(result.get("items", [])),
            "leveled_up": result.get("level_up_info", {}).get("leveled_up", False)
        }
    )

    return ClaimLootResponse(**result)


@router.get("/history/me", response_model=list[BattleParticipantInfo])
async def get_my_battle_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get player's battle participation history

    Shows battles joined, damage dealt, and loot claimed
    """
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    history = db.query(BattleParticipant).filter(
        BattleParticipant.player_id == player.id
    ).order_by(BattleParticipant.joined_at.desc()).limit(min(limit, 100)).all()

    return [BattleParticipantInfo.model_validate(p) for p in history]


@router.get("/{battle_id}/logs")
async def get_battle_logs(
    battle_id: int,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get battle log history for a specific battle

    Returns battle events (attacks, enemy defeats, etc.) in chronological order
    """
    # Verify battle exists
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    try:
        # Fetch battle logs from database
        logs = db.query(BattleLog).filter(
            BattleLog.battle_id == battle_id
        ).order_by(
            BattleLog.created_at.desc()
        ).limit(min(limit, 500)).offset(offset).all()

        # Convert to dictionary format (reverse to get chronological order)
        result = [log.to_dict() for log in reversed(logs)]

        return {"battle_id": battle_id, "logs": result, "count": len(result)}

    except Exception as e:
        logger.error("failed_to_fetch_battle_logs", battle_id=battle_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch battle logs"
        )
