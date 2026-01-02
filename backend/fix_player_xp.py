"""
Fix corrupted player XP values in database.

The old buggy code was storing progress within current level instead of total lifetime XP.
This script recalculates the correct total XP based on player's current level and exp.
"""
from app.db.database import SessionLocal
from app.models.player import Player
from app.services.progression_service import ProgressionService
import structlog

logger = structlog.get_logger()

def fix_player_xp():
    """Fix all players' XP values to be total lifetime XP"""
    db = SessionLocal()
    try:
        players = db.query(Player).all()

        for player in players:
            # Current stored values
            current_level = player.level
            current_exp = player.exp
            current_exp_max = player.exp_max

            # Calculate what total XP should be for this level + progress
            total_xp_for_level = ProgressionService.calculate_total_xp_for_level(current_level)

            # If player.exp is less than what's needed to reach their current level,
            # it means it's storing progress within level (buggy behavior)
            if current_exp < total_xp_for_level:
                # Recalculate correct total XP
                correct_total_xp = total_xp_for_level + current_exp

                logger.info(
                    "fixing_player_xp",
                    player_id=player.id,
                    username=player.username,
                    level=current_level,
                    old_exp=current_exp,
                    new_exp=correct_total_xp,
                    exp_max=current_exp_max
                )

                # Update to correct total XP
                player.exp = correct_total_xp

                # Recalculate exp_max
                xp_needed_for_next = ProgressionService.calculate_xp_for_level(current_level + 1)
                player.exp_max = xp_needed_for_next

                print(f"Fixed {player.username}: Level {current_level}, {current_exp} -> {correct_total_xp} total XP")
            else:
                print(f"Skipped {player.username}: Already has correct total XP ({current_exp})")

        db.commit()
        print("\n✓ All player XP values have been fixed!")

    except Exception as e:
        logger.error("fix_player_xp_error", error=str(e))
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_player_xp()
