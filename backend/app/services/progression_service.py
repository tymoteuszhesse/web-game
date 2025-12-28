"""
Player Progression Service
Handles leveling, XP gain, stat points, and achievements
"""
from typing import Tuple, Dict, List
from sqlalchemy.orm import Session
import structlog
import math

from app.models.player import Player

logger = structlog.get_logger()


class ProgressionService:
    """Service for player progression operations"""

    # Game balance constants
    MAX_LEVEL = 100
    BASE_XP_REQUIREMENT = 100  # XP needed for level 2
    XP_SCALING_FACTOR = 1.15  # Exponential growth rate
    STAT_POINTS_PER_LEVEL = 3  # Stat points awarded per level
    BONUS_STAT_POINTS_EVERY_10_LEVELS = 5  # Extra points at 10, 20, 30, etc.

    @staticmethod
    def calculate_xp_for_level(level: int) -> int:
        """
        Calculate XP required to reach a given level
        Uses exponential formula: base * (scaling ^ (level - 1))

        Example progression:
        Level 2: 100 XP
        Level 3: 115 XP
        Level 10: 304 XP
        Level 50: 58,063 XP
        Level 100: 3,385,869 XP
        """
        if level <= 1:
            return 0

        return int(
            ProgressionService.BASE_XP_REQUIREMENT *
            (ProgressionService.XP_SCALING_FACTOR ** (level - 2))
        )

    @staticmethod
    def calculate_total_xp_for_level(level: int) -> int:
        """
        Calculate total XP needed to reach a level from level 1
        This is the sum of all previous level requirements
        """
        if level <= 1:
            return 0

        total = 0
        for lvl in range(2, level + 1):
            total += ProgressionService.calculate_xp_for_level(lvl)
        return total

    @staticmethod
    def get_stat_points_for_level(level: int) -> int:
        """
        Calculate stat points awarded for reaching a level
        Base: 3 points per level
        Bonus: +5 points every 10 levels (10, 20, 30, etc.)
        """
        base_points = ProgressionService.STAT_POINTS_PER_LEVEL

        # Bonus points for milestone levels
        if level % 10 == 0 and level > 0:
            return base_points + ProgressionService.BONUS_STAT_POINTS_EVERY_10_LEVELS

        return base_points

    @staticmethod
    def calculate_level_from_xp(current_xp: int) -> Tuple[int, int, int]:
        """
        Calculate player level based on total XP
        Returns: (level, xp_for_current_level, xp_needed_for_next_level)

        Example:
        - 50 XP → Level 1 (50/100 to level 2)
        - 150 XP → Level 2 (35/115 to level 3)
        """
        level = 1
        total_xp_needed = 0

        # Find the highest level the player has reached
        while level < ProgressionService.MAX_LEVEL:
            next_level_xp = ProgressionService.calculate_xp_for_level(level + 1)
            if total_xp_needed + next_level_xp > current_xp:
                break
            total_xp_needed += next_level_xp
            level += 1

        # Calculate XP progress in current level
        xp_in_current_level = current_xp - total_xp_needed
        xp_for_next_level = ProgressionService.calculate_xp_for_level(level + 1)

        return level, xp_in_current_level, xp_for_next_level

    @staticmethod
    def award_xp(
        db: Session,
        player: Player,
        xp_amount: int,
        source: str = "unknown"
    ) -> Dict:
        """
        Award XP to a player and handle level ups

        Returns dict with:
        - leveled_up: bool
        - old_level: int
        - new_level: int
        - levels_gained: int
        - stat_points_earned: int
        - total_xp: int
        """
        if xp_amount <= 0:
            return {
                "leveled_up": False,
                "old_level": player.level,
                "new_level": player.level,
                "levels_gained": 0,
                "stat_points_earned": 0,
                "total_xp": player.exp
            }

        old_level = player.level
        old_xp = player.exp

        # Add XP
        player.exp += xp_amount

        # Calculate new level
        new_level, xp_progress, xp_needed = ProgressionService.calculate_level_from_xp(player.exp)

        # Check if leveled up
        leveled_up = new_level > old_level
        levels_gained = new_level - old_level
        stat_points_earned = 0

        if leveled_up:
            # Calculate stat points for all levels gained
            for level in range(old_level + 1, new_level + 1):
                stat_points_earned += ProgressionService.get_stat_points_for_level(level)

            # Update player
            player.level = new_level
            player.unspent_stat_points += stat_points_earned

            # Update exp to show progress within current level (not total XP)
            player.exp = xp_progress
            player.exp_max = xp_needed

            # Refill stamina on level up
            player.stamina = player.stamina_max

            logger.info(
                "player_leveled_up",
                player_id=player.id,
                old_level=old_level,
                new_level=new_level,
                levels_gained=levels_gained,
                stat_points_earned=stat_points_earned,
                xp_gained=xp_amount,
                source=source
            )
        else:
            # Update exp to show progress within current level (not total XP)
            player.exp = xp_progress
            player.exp_max = xp_needed

        # Commit changes
        db.commit()
        db.refresh(player)

        return {
            "leveled_up": leveled_up,
            "old_level": old_level,
            "new_level": new_level,
            "levels_gained": levels_gained,
            "stat_points_earned": stat_points_earned,
            "total_xp": player.exp,
            "xp_gained": xp_amount
        }

    @staticmethod
    def get_level_progression_table(max_level: int = 20) -> List[Dict]:
        """
        Generate a progression table showing XP requirements and rewards
        Useful for game balance and player information
        """
        table = []

        for level in range(1, min(max_level + 1, ProgressionService.MAX_LEVEL + 1)):
            xp_for_level = ProgressionService.calculate_xp_for_level(level)
            total_xp = ProgressionService.calculate_total_xp_for_level(level)
            stat_points = ProgressionService.get_stat_points_for_level(level)

            table.append({
                "level": level,
                "xp_required": xp_for_level,
                "total_xp": total_xp,
                "stat_points_reward": stat_points
            })

        return table

    @staticmethod
    def calculate_xp_to_next_level(player: Player) -> int:
        """Calculate XP needed to reach next level"""
        current_level = player.level
        if current_level >= ProgressionService.MAX_LEVEL:
            return 0

        total_xp_for_next = ProgressionService.calculate_total_xp_for_level(current_level + 1)
        return max(0, total_xp_for_next - player.exp)

    @staticmethod
    def get_player_progression_info(player: Player) -> Dict:
        """
        Get detailed progression information for a player
        Useful for UI display
        """
        _, xp_in_level, xp_for_next = ProgressionService.calculate_level_from_xp(player.exp)
        xp_to_next = ProgressionService.calculate_xp_to_next_level(player)

        # Calculate percentage progress
        if xp_for_next > 0:
            progress_percent = (xp_in_level / xp_for_next) * 100
        else:
            progress_percent = 100.0

        # Info about next level rewards
        next_level_rewards = {
            "stat_points": ProgressionService.get_stat_points_for_level(player.level + 1),
            "is_milestone": (player.level + 1) % 10 == 0
        }

        return {
            "current_level": player.level,
            "total_xp": player.exp,
            "xp_in_current_level": xp_in_level,
            "xp_for_next_level": xp_for_next,
            "xp_to_next_level": xp_to_next,
            "progress_percent": round(progress_percent, 2),
            "max_level_reached": player.level >= ProgressionService.MAX_LEVEL,
            "unspent_stat_points": player.unspent_stat_points,
            "next_level_rewards": next_level_rewards
        }
