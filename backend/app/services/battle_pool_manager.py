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
BOSS_RAID_POOL_SIZE = 1  # Always maintain 1 boss raid


class BattlePoolManager:
    """Manages a pool of available battles"""

    @staticmethod
    def ensure_battle_pool(db: Session):
        """
        Ensure there are always enough battles available
        Creates new battles if the pool is below minimum
        Maintains exactly 1 Easy, 1 Medium, and 1 Hard/Legendary battle
        """
        try:
            # Get existing WAITING battles
            existing_battles = db.query(Battle).filter(
                Battle.battle_type == BattleType.STANDARD,
                Battle.status == BattleStatus.WAITING
            ).all()

            existing_difficulties = [b.difficulty for b in existing_battles]
            current_count = len(existing_battles)

            # Count available boss raids
            boss_count = db.query(Battle).filter(
                Battle.battle_type == BattleType.BOSS_RAID,
                Battle.status == BattleStatus.WAITING
            ).count()

            battles_created = 0

            # Only create battles if we have less than 3 standard battles
            if current_count < STANDARD_BATTLE_POOL_SIZE:
                # Determine which difficulties we need
                needed_difficulties = []

                # Always ensure we have EASY and MEDIUM
                if DifficultyLevel.EASY not in existing_difficulties:
                    needed_difficulties.append(DifficultyLevel.EASY)
                if DifficultyLevel.MEDIUM not in existing_difficulties:
                    needed_difficulties.append(DifficultyLevel.MEDIUM)

                # For the third slot, prefer HARD/LEGENDARY if missing
                has_hard_or_legendary = (
                    DifficultyLevel.HARD in existing_difficulties or
                    DifficultyLevel.LEGENDARY in existing_difficulties
                )

                if not has_hard_or_legendary:
                    needed_difficulties.append(random.choice([DifficultyLevel.HARD, DifficultyLevel.LEGENDARY]))

                # Create only the needed battles (up to pool size)
                for difficulty in needed_difficulties[:STANDARD_BATTLE_POOL_SIZE - current_count]:
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
                               difficulty=difficulty.value,
                               total_waiting=current_count + battles_created)

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
                difficulty = random.choice([DifficultyLevel.EPIC, DifficultyLevel.LEGENDARY])

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

            # Cleanup old completed battles (keep last 10 for history)
            completed_battles = db.query(Battle).filter(
                Battle.status == BattleStatus.COMPLETED
            ).order_by(Battle.completed_at.desc()).offset(10).all()

            if completed_battles:
                for battle in completed_battles:
                    db.delete(battle)
                db.commit()
                logger.info("cleaned_up_old_battles", count=len(completed_battles))

            # Count final state
            final_standard_count = db.query(Battle).filter(
                Battle.battle_type == BattleType.STANDARD,
                Battle.status == BattleStatus.WAITING
            ).count()

            final_boss_count = db.query(Battle).filter(
                Battle.battle_type == BattleType.BOSS_RAID,
                Battle.status == BattleStatus.WAITING
            ).count()

            return {
                "standard_battles": final_standard_count,
                "boss_raids": final_boss_count,
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
