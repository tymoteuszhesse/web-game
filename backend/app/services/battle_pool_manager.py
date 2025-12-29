"""
Battle Pool Manager
Ensures there are always battles available for players
"""
from sqlalchemy.orm import Session
from app.models.battle import Battle, BattleStatus, BattleType, DifficultyLevel
from app.services.battle_service import BattleService
import structlog
import random

logger = structlog.get_logger()

# Configuration
STANDARD_BATTLE_POOL_SIZE = 3
BOSS_RAID_POOL_SIZE = 1


class BattlePoolManager:
    """Manages a pool of available battles"""

    @staticmethod
    def ensure_battle_pool(db: Session):
        """
        Ensure there are always enough battles available
        Creates new battles if the pool is below minimum
        """
        try:
            # Count available standard battles
            standard_count = db.query(Battle).filter(
                Battle.battle_type == BattleType.STANDARD,
                Battle.status == BattleStatus.WAITING
            ).count()

            # Count available boss raids
            boss_count = db.query(Battle).filter(
                Battle.battle_type == BattleType.BOSS_RAID,
                Battle.status == BattleStatus.WAITING
            ).count()

            logger.info("battle_pool_check",
                       standard_battles=standard_count,
                       boss_raids=boss_count,
                       standard_needed=max(0, STANDARD_BATTLE_POOL_SIZE - standard_count),
                       boss_needed=max(0, BOSS_RAID_POOL_SIZE - boss_count))

            # Create standard battles if needed
            battles_created = 0
            for _ in range(STANDARD_BATTLE_POOL_SIZE - standard_count):
                difficulty = random.choice(list(DifficultyLevel))
                battle = BattleService.create_battle(
                    db=db,
                    difficulty=difficulty,
                    wave_number=random.randint(1, 5),
                    required_level=1,
                    max_players=10
                )
                battles_created += 1
                logger.info("standard_battle_created",
                           battle_id=battle.id,
                           difficulty=difficulty.value)

            # Create boss raids if needed
            for _ in range(BOSS_RAID_POOL_SIZE - boss_count):
                boss_names = [
                    "Dark Lord Malakar",
                    "Ancient Dragon Infernus",
                    "The Lich King",
                    "Titan of Chaos",
                    "Shadow Empress"
                ]
                boss_name = random.choice(boss_names)
                difficulty = random.choice([DifficultyLevel.HARD, DifficultyLevel.NIGHTMARE])

                battle = BattleService.create_boss_raid(
                    db=db,
                    boss_name=boss_name,
                    difficulty=difficulty,
                    required_level=10,
                    min_players=3,
                    max_players=10
                )
                battles_created += 1
                logger.info("boss_raid_created",
                           battle_id=battle.id,
                           boss_name=boss_name,
                           difficulty=difficulty.value)

            if battles_created > 0:
                logger.info("battle_pool_replenished", battles_created=battles_created)

            return {
                "standard_battles": standard_count + (STANDARD_BATTLE_POOL_SIZE - standard_count),
                "boss_raids": boss_count + (BOSS_RAID_POOL_SIZE - boss_count),
                "created": battles_created
            }

        except Exception as e:
            logger.error("battle_pool_manager_error", error=str(e))
            db.rollback()
            raise

    @staticmethod
    def on_battle_completed(db: Session, battle_id: int):
        """
        Called when a battle is completed
        Triggers battle pool replenishment
        """
        try:
            battle = db.query(Battle).filter(Battle.id == battle_id).first()
            if not battle:
                return

            logger.info("battle_completed_trigger_replenishment",
                       battle_id=battle_id,
                       battle_type=battle.battle_type.value)

            # Replenish the pool
            BattlePoolManager.ensure_battle_pool(db)

        except Exception as e:
            logger.error("battle_completion_handler_error",
                        battle_id=battle_id,
                        error=str(e))
