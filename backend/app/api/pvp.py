"""
PVP Duel API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.models.player import Player
from app.models.pvp import Duel, DuelStatus, PvPStats
from app.models.user import User
from app.core.security import get_current_user
from app.services.websocket_manager import manager
from app.services.pvp_battle_manager import pvp_battle_manager


router = APIRouter(prefix="/pvp", tags=["pvp"])


# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class ChallengeRequest(BaseModel):
    """Request to challenge a player"""
    opponent_id: int = Field(..., description="ID of the opponent to challenge")
    gold_stake: int = Field(..., ge=10, description="Gold amount to wager (minimum 10)")


class ChallengeResponse(BaseModel):
    """Response to a challenge"""
    accept: bool = Field(..., description="Accept or decline the challenge")


class OnlinePlayerInfo(BaseModel):
    """Information about an online player"""
    id: int
    username: str
    level: int
    attack: int
    defense: int


class DuelInfo(BaseModel):
    """Information about a duel"""
    id: int
    status: str
    challenger_id: int
    challenger_name: str
    challenger_level: int
    defender_id: int
    defender_name: str
    defender_level: int
    gold_stake: int
    created_at: datetime
    accepted_at: datetime | None
    winner_id: int | None
    battle_id: str | None


class PvPStatsInfo(BaseModel):
    """Player's PVP statistics"""
    wins: int
    losses: int
    draws: int
    gold_won: int
    gold_lost: int
    gold_wagered: int
    win_rate: float
    current_win_streak: int
    best_win_streak: int


# ═══════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/online-players", response_model=List[OnlinePlayerInfo])
async def get_online_players(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of online players available for PVP

    A player is considered online if they logged in within the last 15 minutes
    """
    from datetime import datetime, timedelta

    # Consider players online if they logged in within last 15 minutes
    online_threshold = datetime.utcnow() - timedelta(minutes=15)

    # Get players who are online (recent last_login) except current user
    online_users = db.query(User).filter(
        User.id != current_user.id,
        User.last_login.isnot(None),
        User.last_login >= online_threshold
    ).all()

    # Get their player data
    players = [u.player for u in online_users if u.player is not None]

    return [
        OnlinePlayerInfo(
            id=p.id,
            username=p.username,
            level=p.level,
            attack=p.calculate_total_attack(),
            defense=p.calculate_total_defense()
        )
        for p in players
    ]


@router.post("/challenge", status_code=status.HTTP_201_CREATED)
async def send_challenge(
    challenge: ChallengeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a duel challenge to another player"""
    challenger = current_user.player

    # Validate opponent exists
    opponent = db.query(Player).filter(Player.id == challenge.opponent_id).first()
    if not opponent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opponent not found"
        )

    # Check if challenging self
    if challenger.id == opponent.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot challenge yourself"
        )

    # Validate gold
    if challenger.gold < challenge.gold_stake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient gold. You have {challenger.gold}, need {challenge.gold_stake}"
        )

    if opponent.gold < challenge.gold_stake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Opponent has insufficient gold for this stake"
        )

    # Check for existing active challenges between these players
    existing_duel = db.query(Duel).filter(
        or_(
            and_(
                Duel.challenger_id == challenger.id,
                Duel.defender_id == opponent.id
            ),
            and_(
                Duel.challenger_id == opponent.id,
                Duel.defender_id == challenger.id
            )
        ),
        Duel.status.in_([DuelStatus.PENDING, DuelStatus.ACCEPTED, DuelStatus.IN_PROGRESS])
    ).first()

    if existing_duel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active challenge already exists between you and this player"
        )

    # Create duel
    expires_at = datetime.utcnow() + timedelta(minutes=15)  # 15 minute expiration
    duel = Duel(
        challenger_id=challenger.id,
        defender_id=opponent.id,
        gold_stake=challenge.gold_stake,
        status=DuelStatus.PENDING,
        expires_at=expires_at
    )

    db.add(duel)
    db.commit()
    db.refresh(duel)

    # Send real-time WebSocket notification to opponent
    await manager.notify_challenge_received(
        defender_player_id=opponent.id,
        challenger_name=challenger.username,
        duel_id=duel.id,
        gold_stake=challenge.gold_stake
    )

    return {
        "message": f"Challenge sent to {opponent.username}",
        "duel_id": duel.id,
        "expires_at": expires_at
    }


@router.post("/challenge/{duel_id}/respond")
async def respond_to_challenge(
    duel_id: int,
    response: ChallengeResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept or decline a duel challenge"""
    player = current_user.player

    # Get duel
    duel = db.query(Duel).filter(Duel.id == duel_id).first()
    if not duel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Duel not found"
        )

    # Verify player is the defender
    if duel.defender_id != player.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the defender of this duel"
        )

    # Check duel is pending
    if duel.status != DuelStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duel is not pending (current status: {duel.status})"
        )

    # Check expiration
    if duel.expires_at and datetime.utcnow() > duel.expires_at:
        duel.status = DuelStatus.EXPIRED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge has expired"
        )

    if response.accept:
        # Accept the challenge
        # Verify both players still have enough gold
        challenger = duel.challenger
        if challenger.gold < duel.gold_stake:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Challenger no longer has sufficient gold"
            )
        if player.gold < duel.gold_stake:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You no longer have sufficient gold"
            )

        # Update duel status
        duel.status = DuelStatus.ACCEPTED
        duel.accepted_at = datetime.utcnow()
        db.commit()

        # Send real-time notifications to both players
        await manager.notify_challenge_response(
            challenger_player_id=challenger.id,
            defender_name=player.username,
            accepted=True,
            duel_id=duel.id
        )
        await manager.notify_duel_ready(challenger.id, duel.id, player.username)
        await manager.notify_duel_ready(player.id, duel.id, challenger.username)

        return {
            "message": "Challenge accepted!",
            "duel_id": duel.id,
            "status": duel.status
        }
    else:
        # Decline the challenge
        duel.status = DuelStatus.DECLINED
        db.commit()

        # Penalty for declining: 10% of stake
        penalty = int(duel.gold_stake * 0.1)
        if player.gold >= penalty:
            player.gold -= penalty
            challenger = duel.challenger
            challenger.gold += penalty
            db.commit()

        # Send real-time notification to challenger
        await manager.notify_challenge_response(
            challenger_player_id=challenger.id,
            defender_name=player.username,
            accepted=False,
            duel_id=duel.id
        )

        return {
            "message": "Challenge declined",
            "penalty": penalty
        }


@router.delete("/challenge/{duel_id}")
async def cancel_challenge(
    duel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a pending duel challenge (challenger only)"""
    player = current_user.player

    # Get duel
    duel = db.query(Duel).filter(Duel.id == duel_id).first()
    if not duel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Duel not found"
        )

    # Verify player is the challenger
    if duel.challenger_id != player.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the challenger of this duel"
        )

    # Check duel is pending
    if duel.status != DuelStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel duel (current status: {duel.status})"
        )

    # Cancel duel
    duel.status = DuelStatus.CANCELLED
    db.commit()

    # Send real-time notification to defender
    defender = duel.defender
    await manager.notify_challenge_cancelled(
        defender_player_id=defender.id,
        challenger_name=player.username,
        duel_id=duel.id
    )

    return {"message": "Challenge cancelled"}


@router.get("/active-duels", response_model=List[DuelInfo])
async def get_active_duels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active duels for current player"""
    player = current_user.player

    # Get duels where player is challenger or defender
    duels = db.query(Duel).filter(
        or_(
            Duel.challenger_id == player.id,
            Duel.defender_id == player.id
        ),
        Duel.status.in_([DuelStatus.PENDING, DuelStatus.ACCEPTED, DuelStatus.IN_PROGRESS])
    ).order_by(Duel.created_at.desc()).all()

    return [
        DuelInfo(
            id=duel.id,
            status=duel.status.value,
            challenger_id=duel.challenger_id,
            challenger_name=duel.challenger.username,
            challenger_level=duel.challenger.level,
            defender_id=duel.defender_id,
            defender_name=duel.defender.username,
            defender_level=duel.defender.level,
            gold_stake=duel.gold_stake,
            created_at=duel.created_at,
            accepted_at=duel.accepted_at,
            winner_id=duel.winner_id,
            battle_id=duel.battle_id
        )
        for duel in duels
    ]


@router.get("/stats", response_model=PvPStatsInfo)
async def get_pvp_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current player's PVP statistics"""
    player = current_user.player

    # Get or create PVP stats
    stats = db.query(PvPStats).filter(PvPStats.player_id == player.id).first()
    if not stats:
        stats = PvPStats(player_id=player.id)
        db.add(stats)
        db.commit()
        db.refresh(stats)

    # Calculate win rate
    total_games = stats.wins + stats.losses + stats.draws
    win_rate = (stats.wins / total_games * 100) if total_games > 0 else 0

    return PvPStatsInfo(
        wins=stats.wins,
        losses=stats.losses,
        draws=stats.draws,
        gold_won=stats.gold_won,
        gold_lost=stats.gold_lost,
        gold_wagered=stats.gold_wagered,
        win_rate=round(win_rate, 1),
        current_win_streak=stats.current_win_streak,
        best_win_streak=stats.best_win_streak
    )


@router.post("/duel/{duel_id}/start-battle")
async def start_duel_battle(
    duel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start real-time battle for an accepted duel
    """
    player = current_user.player

    # Get duel
    duel = db.query(Duel).filter(Duel.id == duel_id).first()
    if not duel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Duel not found"
        )

    # Verify player is participant
    if player.id not in [duel.challenger_id, duel.defender_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this duel"
        )

    # Check duel is accepted
    if duel.status != DuelStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duel is not ready for battle (status: {duel.status})"
        )

    # Update status to in progress
    duel.status = DuelStatus.IN_PROGRESS
    db.commit()

    # Get player data
    challenger = duel.challenger
    defender = duel.defender

    challenger_data = {
        'id': challenger.id,
        'username': challenger.username,
        'level': challenger.level,
        'attack': challenger.calculate_total_attack(),
        'defense': challenger.calculate_total_defense(),
        'max_hp': challenger.base_hp + (challenger.level * 10)
    }

    defender_data = {
        'id': defender.id,
        'username': defender.username,
        'level': defender.level,
        'attack': defender.calculate_total_attack(),
        'defense': defender.calculate_total_defense(),
        'max_hp': defender.base_hp + (defender.level * 10)
    }

    # Create battle
    battle = await pvp_battle_manager.create_battle(
        duel_id=duel.id,
        player1_id=challenger.id,
        player2_id=defender.id,
        player1_data=challenger_data,
        player2_data=defender_data,
        gold_stake=duel.gold_stake
    )

    # Store battle_id in duel record
    duel.battle_id = battle.battle_id
    db.commit()

    # Notify both players
    await manager.send_to_player(challenger.id, {
        "type": "battle_created",
        "battle_id": battle.battle_id,
        "duel_id": duel.id,
        "opponent": defender_data
    })

    await manager.send_to_player(defender.id, {
        "type": "battle_created",
        "battle_id": battle.battle_id,
        "duel_id": duel.id,
        "opponent": challenger_data
    })

    return {
        "message": "Battle started",
        "battle_id": battle.battle_id,
        "duel_id": duel.id
    }


@router.post("/duel/{duel_id}/complete")
async def complete_duel(
    duel_id: int,
    winner_id: int,
    db: Session = Depends(get_db)
):
    """
    Complete a duel and distribute rewards

    NOTE: This is called automatically by the battle system after a PVP battle completes
    """
    # Get duel
    duel = db.query(Duel).filter(Duel.id == duel_id).first()
    if not duel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Duel not found"
        )

    # Verify duel is in progress or accepted
    if duel.status not in [DuelStatus.IN_PROGRESS, DuelStatus.ACCEPTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duel cannot be completed (current status: {duel.status})"
        )

    # Verify winner is a participant
    if winner_id not in [duel.challenger_id, duel.defender_id]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Winner must be a duel participant"
        )

    # Update duel
    duel.status = DuelStatus.COMPLETED
    duel.winner_id = winner_id
    duel.completed_at = datetime.utcnow()

    # Distribute gold
    loser_id = duel.defender_id if winner_id == duel.challenger_id else duel.challenger_id
    winner = db.query(Player).filter(Player.id == winner_id).first()
    loser = db.query(Player).filter(Player.id == loser_id).first()

    # Deduct from loser
    loser.gold -= duel.gold_stake

    # Award to winner (both stakes)
    winner.gold += (duel.gold_stake * 2)

    # Update PVP stats
    winner_stats = db.query(PvPStats).filter(PvPStats.player_id == winner_id).first()
    if not winner_stats:
        winner_stats = PvPStats(player_id=winner_id)
        db.add(winner_stats)

    loser_stats = db.query(PvPStats).filter(PvPStats.player_id == loser_id).first()
    if not loser_stats:
        loser_stats = PvPStats(player_id=loser_id)
        db.add(loser_stats)

    # Update winner stats
    winner_stats.wins += 1
    winner_stats.gold_won += duel.gold_stake * 2
    winner_stats.gold_wagered += duel.gold_stake
    winner_stats.current_win_streak += 1
    if winner_stats.current_win_streak > winner_stats.best_win_streak:
        winner_stats.best_win_streak = winner_stats.current_win_streak

    # Update loser stats
    loser_stats.losses += 1
    loser_stats.gold_lost += duel.gold_stake
    loser_stats.gold_wagered += duel.gold_stake
    loser_stats.current_win_streak = 0

    db.commit()

    return {
        "message": "Duel completed",
        "winner_id": winner_id,
        "gold_transferred": duel.gold_stake * 2
    }
