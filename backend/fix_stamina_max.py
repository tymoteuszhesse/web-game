"""
Fix corrupted stamina_max values in database.

Players who had stamina boost potions that expired without restoration
have permanently increased stamina_max. This script resets everyone
to the correct base stamina_max of 100.
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.player import Player
import structlog

logger = structlog.get_logger()

def fix_stamina_max():
    """Reset all players' stamina_max to base value of 100"""
    db = SessionLocal()
    try:
        players = db.query(Player).all()

        fixed_count = 0
        for player in players:
            if player.stamina_max != 100:
                old_max = player.stamina_max

                # Reset to base stamina_max
                player.stamina_max = 100

                # Cap current stamina to the new max
                if player.stamina > 100:
                    player.stamina = 100

                logger.info(
                    "fixing_stamina_max",
                    player_id=player.id,
                    username=player.username,
                    old_max=old_max,
                    new_max=100,
                    old_stamina=player.stamina,
                    new_stamina=min(player.stamina, 100)
                )

                print(f"Fixed {player.username}: stamina_max {old_max} -> 100, stamina capped to {min(player.stamina, 100)}")
                fixed_count += 1

        if fixed_count > 0:
            db.commit()
            print(f"\n✓ Fixed {fixed_count} players with corrupted stamina_max!")
        else:
            print("\n✓ All players already have correct stamina_max (100)")

    except Exception as e:
        logger.error("fix_stamina_max_error", error=str(e))
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_stamina_max()
