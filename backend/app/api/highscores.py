"""
Highscores API
Provides leaderboards for top players by level and item power
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
import structlog

from app.db.database import get_db
from app.models.player import Player
from app.models.inventory import InventoryItem, EquipmentSet, ItemRarity
from app.schemas.highscores import HighscoreEntry, HighscoresResponse

logger = structlog.get_logger()

router = APIRouter()


def get_player_equipment_bonuses(player: Player, db: Session) -> dict:
    """
    Calculate total equipment bonuses for a player
    Returns dict with attack_bonus, defense_bonus, hp_bonus
    """
    total_attack = 0
    total_defense = 0
    total_hp = 0

    # Get all equipment sets for this player
    equipment_sets = db.query(EquipmentSet).filter(
        EquipmentSet.player_id == player.id
    ).all()

    # Track unique item IDs to avoid counting duplicates across sets
    counted_item_ids = set()

    for eq_set in equipment_sets:
        # Get all equipped items in this set
        item_slots = [
            eq_set.weapon_id, eq_set.helmet_id, eq_set.armor_id,
            eq_set.boots_id, eq_set.gloves_id, eq_set.ring_id,
            eq_set.ring2_id, eq_set.amulet_id
        ]

        for item_id in item_slots:
            if item_id and item_id not in counted_item_ids:
                item = db.query(InventoryItem).filter(
                    InventoryItem.id == item_id
                ).first()

                if item:
                    total_attack += item.attack_bonus
                    total_defense += item.defense_bonus
                    total_hp += item.hp_bonus
                    counted_item_ids.add(item_id)

    return {
        'attack_bonus': total_attack,
        'defense_bonus': total_defense,
        'hp_bonus': total_hp
    }


def calculate_item_score(player: Player, db: Session) -> int:
    """
    Calculate total item power score for a player
    Based on equipped items' stats and rarity multipliers
    """
    # Rarity multipliers for scoring
    rarity_multipliers = {
        ItemRarity.COMMON: 1,
        ItemRarity.UNCOMMON: 2,
        ItemRarity.RARE: 4,
        ItemRarity.EPIC: 8,
        ItemRarity.LEGENDARY: 16
    }

    total_score = 0

    # Get all equipment sets for this player
    equipment_sets = db.query(EquipmentSet).filter(
        EquipmentSet.player_id == player.id
    ).all()

    # Track unique item IDs to avoid counting duplicates across sets
    counted_item_ids = set()

    for eq_set in equipment_sets:
        # Get all equipped items in this set
        item_slots = [
            eq_set.weapon_id, eq_set.helmet_id, eq_set.armor_id,
            eq_set.boots_id, eq_set.gloves_id, eq_set.ring_id,
            eq_set.ring2_id, eq_set.amulet_id
        ]

        for item_id in item_slots:
            if item_id and item_id not in counted_item_ids:
                item = db.query(InventoryItem).filter(
                    InventoryItem.id == item_id
                ).first()

                if item:
                    # Calculate item score: (attack + defense + hp) * rarity_multiplier
                    base_stats = item.attack_bonus + item.defense_bonus + item.hp_bonus
                    multiplier = rarity_multipliers.get(item.rarity, 1)
                    total_score += base_stats * multiplier
                    counted_item_ids.add(item_id)

    return total_score


@router.get("/highscores", response_model=HighscoresResponse)
async def get_highscores(db: Session = Depends(get_db)):
    """
    Get top 20 players by level and by item score
    """
    try:
        # Get top 20 by level (with XP as tiebreaker)
        top_by_level = db.query(Player).order_by(
            desc(Player.level),
            desc(Player.exp)
        ).limit(20).all()

        # Get all players to calculate item scores
        all_players = db.query(Player).all()

        # Calculate item scores for all players
        player_scores = []
        for player in all_players:
            item_score = calculate_item_score(player, db)
            player_scores.append({
                'player': player,
                'item_score': item_score
            })

        # Sort by item score and take top 20
        player_scores.sort(key=lambda x: (x['item_score'], x['player'].level), reverse=True)
        top_by_items = player_scores[:20]

        # Format level leaderboard
        level_leaderboard = []
        for rank, player in enumerate(top_by_level, start=1):
            item_score = calculate_item_score(player, db)
            equipment_bonuses = get_player_equipment_bonuses(player, db)
            level_leaderboard.append(HighscoreEntry(
                rank=rank,
                player_id=player.id,
                username=player.username,
                level=player.level,
                exp=player.exp,
                item_score=item_score,
                gold=player.gold,
                total_attack=player.base_attack + equipment_bonuses['attack_bonus'],
                total_defense=player.base_defense + equipment_bonuses['defense_bonus'],
                total_hp=player.base_hp + equipment_bonuses['hp_bonus']
            ))

        # Format item score leaderboard
        item_leaderboard = []
        for rank, entry in enumerate(top_by_items, start=1):
            player = entry['player']
            equipment_bonuses = get_player_equipment_bonuses(player, db)
            item_leaderboard.append(HighscoreEntry(
                rank=rank,
                player_id=player.id,
                username=player.username,
                level=player.level,
                exp=player.exp,
                item_score=entry['item_score'],
                gold=player.gold,
                total_attack=player.base_attack + equipment_bonuses['attack_bonus'],
                total_defense=player.base_defense + equipment_bonuses['defense_bonus'],
                total_hp=player.base_hp + equipment_bonuses['hp_bonus']
            ))

        logger.info(
            "highscores_fetched",
            level_count=len(level_leaderboard),
            item_count=len(item_leaderboard)
        )

        return HighscoresResponse(
            by_level=level_leaderboard,
            by_item_score=item_leaderboard
        )

    except Exception as e:
        logger.error(
            "highscores_fetch_error",
            error=str(e),
            error_type=type(e).__name__
        )
        raise
