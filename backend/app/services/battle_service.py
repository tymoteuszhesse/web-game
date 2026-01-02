"""
Battle Service Layer
Handles all battle logic including combat, enemies, and rewards
"""
from typing import Dict, List, Tuple, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import structlog
import random

from app.models.battle import (
    Battle,
    BattleEnemy,
    BattleParticipant,
    BattleStatus,
    EnemyType,
    DifficultyLevel,
    BattleType
)
from app.models.player import Player
from app.models.inventory import InventoryItem, ItemType, ItemRarity, EquipmentSet, SetType
from app.services.progression_service import ProgressionService
from app.services.inventory_service import calculate_equipment_stats

logger = structlog.get_logger()


class BattleService:
    """Service for battle operations"""

    # Enemy type configurations with proper fantasy naming
    # Icon paths from goblins subfolder (48 icons total)
    GOBLIN_ICONS = [f"goblins/Icon{i}.png" for i in range(1, 49)]

    # Enemy name variations for immersion (randomly selected per spawn)
    ENEMY_NAME_VARIANTS = {
        EnemyType.GOBLIN: [
            "Grizzled Goblin", "Snarling Goblin", "Feral Goblin", "Cunning Goblin",
            "Savage Goblin", "Rabid Goblin", "Diseased Goblin", "Mangy Goblin"
        ],
        EnemyType.ORC: [
            "Brutal Orc Warrior", "Savage Orc Raider", "Bloodthirsty Orc", "Orcish Berserker",
            "Orc Marauder", "Orcish Grunt", "War-Scarred Orc", "Orc Pillager"
        ],
        EnemyType.TROLL: [
            "Moss-Covered Troll", "Stone Troll", "Swamp Troll", "Mountain Troll",
            "Cave Troll", "Ancient Troll", "Regenerating Troll", "Hulking Troll"
        ],
        EnemyType.LIZARDMAN: [
            "Scaled Lizardman", "Lizard Warrior", "Swamp Stalker", "Cold-Blooded Hunter",
            "Lizard Spearman", "Reptilian Savage", "Marsh Lizardman", "Venomous Lizard"
        ],
        EnemyType.DEMON: [
            "Lesser Demon", "Infernal Fiend", "Hellspawn", "Abyssal Demon",
            "Shadow Demon", "Corrupted Demon", "Flame Demon", "Chaos Spawn"
        ],
        EnemyType.DRAGON: [
            "Young Dragon", "Wyrm", "Dragonling", "Drake",
            "Wyvern", "Serpent Dragon", "Crimson Drake", "Frost Wyrm"
        ],
        EnemyType.UNDEAD: [
            "Risen Corpse", "Skeletal Warrior", "Zombie", "Ghoul",
            "Wight", "Revenant", "Cursed Undead", "Rotting Corpse"
        ],
    }

    ENEMY_CONFIGS = {
        EnemyType.GOBLIN: {
            "name": "Goblin",  # Base name (will be varied)
            "hp_mult": 1.0,
            "atk_mult": 0.8,
            "def_mult": 0.7,
            "icons": GOBLIN_ICONS
        },
        EnemyType.ORC: {
            "name": "Orc",
            "hp_mult": 1.3,
            "atk_mult": 1.1,
            "def_mult": 0.9,
            "icons": GOBLIN_ICONS
        },
        EnemyType.TROLL: {
            "name": "Troll",
            "hp_mult": 2.0,
            "atk_mult": 0.9,
            "def_mult": 1.2,
            "icons": GOBLIN_ICONS
        },
        EnemyType.LIZARDMAN: {
            "name": "Lizardman",
            "hp_mult": 1.2,
            "atk_mult": 1.0,
            "def_mult": 1.0,
            "icons": GOBLIN_ICONS
        },
        EnemyType.DEMON: {
            "name": "Demon",
            "hp_mult": 1.5,
            "atk_mult": 1.3,
            "def_mult": 1.1,
            "icons": GOBLIN_ICONS
        },
        EnemyType.DRAGON: {
            "name": "Dragon",
            "hp_mult": 3.0,
            "atk_mult": 1.5,
            "def_mult": 1.4,
            "icons": GOBLIN_ICONS
        },
        EnemyType.UNDEAD: {
            "name": "Undead",
            "hp_mult": 0.8,
            "atk_mult": 1.0,
            "def_mult": 0.6,
            "icons": GOBLIN_ICONS
        },
    }

    # Boss name templates by difficulty (more epic names for harder bosses)
    BOSS_NAME_TEMPLATES = {
        DifficultyLevel.EASY: [
            "Chieftain {name}", "Elder {name}", "Captain {name}", "{name} Leader"
        ],
        DifficultyLevel.MEDIUM: [
            "Warlord {name}", "Champion {name}", "Commander {name}", "{name} Overlord"
        ],
        DifficultyLevel.HARD: [
            "Lord {name}", "High Commander {name}", "{name} the Destroyer", "{name} the Terrible"
        ],
        DifficultyLevel.EPIC: [
            "Dark Lord {name}", "{name} the Conqueror", "{name} the Dreadful", "Supreme {name}"
        ],
        DifficultyLevel.LEGENDARY: [
            "{name} the Ancient", "{name} the Immortal", "Eternal {name}", "{name} the Apocalypse"
        ],
    }

    # Boss icons (use same icon set for now, but with more imposing selections)
    BOSS_ICONS = GOBLIN_ICONS

    # Difficulty multipliers
    DIFFICULTY_MULTIPLIERS = {
        DifficultyLevel.EASY: {"hp": 1.0, "atk": 1.0, "def": 1.0, "gold": 1.0, "xp": 1.0},
        DifficultyLevel.MEDIUM: {"hp": 1.5, "atk": 1.2, "def": 1.2, "gold": 1.5, "xp": 1.5},
        DifficultyLevel.HARD: {"hp": 2.5, "atk": 1.5, "def": 1.5, "gold": 2.5, "xp": 2.5},
        DifficultyLevel.EPIC: {"hp": 4.0, "atk": 2.0, "def": 2.0, "gold": 4.0, "xp": 4.0},
        DifficultyLevel.LEGENDARY: {"hp": 6.0, "atk": 2.5, "def": 2.5, "gold": 6.0, "xp": 6.0},
    }

    # Boss Raid multipliers (much stronger than regular enemies)
    BOSS_RAID_MULTIPLIERS = {
        "hp_mult": 30.0,      # 30x HP for long battles
        "atk_mult": 3.0,      # 3x attack
        "def_mult": 2.0,      # 2x defense
        "gold_mult": 5.0,     # 5x gold rewards
        "xp_mult": 5.0,       # 5x XP rewards
        "loot_mult": 3.0,     # 3x better loot drops
    }

    # Boss raid death penalty (15 minutes in seconds)
    DEATH_COOLDOWN_SECONDS = 900  # 15 minutes

    @staticmethod
    def create_battle(
        db: Session,
        difficulty: DifficultyLevel,
        wave_number: int = 1,
        required_level: int = 1,
        max_players: int = 10
    ) -> Battle:
        """Create a new battle with generated enemies"""

        # Calculate base rewards
        base_gold = 100 * wave_number
        base_xp = 50 * wave_number

        diff_mult = BattleService.DIFFICULTY_MULTIPLIERS[difficulty]

        # Create battle
        battle = Battle(
            name=f"{difficulty.value.title()} Battle - Wave {wave_number}",
            difficulty=difficulty,
            wave_number=wave_number,
            max_players=max_players,
            required_level=required_level,
            stamina_cost=0,  # Free to join - stamina only costs for attacking
            status=BattleStatus.WAITING,
            gold_reward=int(base_gold * diff_mult["gold"]),
            exp_reward=int(base_xp * diff_mult["xp"]),
            loot_table=[]  # Will be populated when battle completes
        )

        db.add(battle)
        db.flush()  # Get battle ID

        # Generate enemies based on difficulty and wave
        enemies = BattleService._generate_enemies(
            db=db,
            battle=battle,
            difficulty=difficulty,
            wave_number=wave_number
        )

        db.commit()
        db.refresh(battle)

        logger.info(
            "battle_created",
            battle_id=battle.id,
            difficulty=difficulty.value,
            wave=wave_number,
            enemy_count=len(enemies)
        )

        return battle

    @staticmethod
    def create_boss_raid(
        db: Session,
        difficulty: DifficultyLevel,
        boss_name: str = "Dark Lord Malakar",
        required_level: int = 10,
        min_players: int = 3,
        max_players: int = 20,
        phase_count: int = 3,
        phase_thresholds: List[int] = None
    ) -> Battle:
        """Create a new boss raid battle"""

        if phase_thresholds is None:
            phase_thresholds = [75, 50, 25]  # Default phase transitions

        # Calculate base rewards (much higher for boss raids)
        base_gold = 1000
        base_xp = 500

        diff_mult = BattleService.DIFFICULTY_MULTIPLIERS[difficulty]
        boss_mult = BattleService.BOSS_RAID_MULTIPLIERS

        # Create boss raid battle
        battle = Battle(
            name=f"{boss_name} ({difficulty.value.title()})",
            difficulty=difficulty,
            wave_number=1,
            battle_type=BattleType.BOSS_RAID,
            is_boss_raid=True,
            max_players=max_players,
            min_players=min_players,
            required_level=required_level,
            stamina_cost=20,  # Higher stamina cost for boss raids
            status=BattleStatus.WAITING,
            boss_phase_count=phase_count,
            boss_current_phase=1,
            boss_phase_thresholds=phase_thresholds,
            gold_reward=int(base_gold * diff_mult["gold"] * boss_mult["gold_mult"]),
            exp_reward=int(base_xp * diff_mult["xp"] * boss_mult["xp_mult"]),
            loot_table=[]
        )

        db.add(battle)
        db.flush()  # Get battle ID

        # Generate the boss enemy
        boss = BattleService._generate_boss_enemy(
            db=db,
            battle=battle,
            boss_name=boss_name,
            difficulty=difficulty,
            required_level=required_level
        )

        db.commit()
        db.refresh(battle)

        logger.info(
            "boss_raid_created",
            battle_id=battle.id,
            boss_name=boss_name,
            difficulty=difficulty.value,
            phases=phase_count,
            min_players=min_players
        )

        return battle

    @staticmethod
    def _generate_boss_enemy(
        db: Session,
        battle: Battle,
        boss_name: str,
        difficulty: DifficultyLevel,
        required_level: int
    ) -> BattleEnemy:
        """Generate a single powerful boss enemy"""

        diff_mult = BattleService.DIFFICULTY_MULTIPLIERS[difficulty]
        boss_mult = BattleService.BOSS_RAID_MULTIPLIERS

        # Base stats for boss (much higher than regular enemies)
        base_level = required_level + 5
        base_hp = 5000 + (base_level * 500)  # Start with high base HP
        base_atk = 50 + (base_level * 10)
        base_def = 30 + (base_level * 5)

        # Apply difficulty and boss multipliers
        hp = int(base_hp * diff_mult["hp"] * boss_mult["hp_mult"])
        atk = int(base_atk * diff_mult["atk"] * boss_mult["atk_mult"])
        defense = int(base_def * diff_mult["def"] * boss_mult["def_mult"])

        # Select random boss icon
        boss_icon = random.choice(BattleService.BOSS_ICONS)

        # Apply epic boss title based on difficulty
        boss_templates = BattleService.BOSS_NAME_TEMPLATES[difficulty]
        epic_boss_name = random.choice(boss_templates).format(name=boss_name)

        # Use DRAGON type for boss (highest base multipliers)
        boss = BattleEnemy(
            battle_id=battle.id,
            enemy_type=EnemyType.DRAGON,
            name=epic_boss_name,
            level=base_level,
            icon=boss_icon,
            hp_max=hp,
            hp_current=hp,
            attack=atk,
            defense=defense,
            is_defeated=False
        )

        db.add(boss)

        logger.info(
            "boss_enemy_generated",
            boss_name=boss_name,
            level=base_level,
            hp=hp,
            attack=atk,
            defense=defense
        )

        return boss

    @staticmethod
    def _generate_enemies(
        db: Session,
        battle: Battle,
        difficulty: DifficultyLevel,
        wave_number: int
    ) -> List[BattleEnemy]:
        """Generate enemies for a battle"""

        # Determine number of enemies
        enemy_count = min(2 + wave_number, 10)  # 2-10 enemies

        # Only use Goblins, Orcs, and Trolls
        available_types = [EnemyType.GOBLIN, EnemyType.ORC, EnemyType.TROLL]

        enemies = []
        diff_mult = BattleService.DIFFICULTY_MULTIPLIERS[difficulty]

        for i in range(enemy_count):
            enemy_type = random.choice(available_types)
            config = BattleService.ENEMY_CONFIGS[enemy_type]

            # Base stats scale with wave
            base_level = battle.required_level + (wave_number - 1) * 2
            base_hp = 100 + (base_level * 50)
            base_atk = 10 + (base_level * 5)
            base_def = 5 + (base_level * 3)

            # Apply enemy type multipliers
            hp = int(base_hp * config["hp_mult"] * diff_mult["hp"])
            atk = int(base_atk * config["atk_mult"] * diff_mult["atk"])
            defense = int(base_def * config["def_mult"] * diff_mult["def"])

            # Select random icon for this enemy type
            enemy_icon = random.choice(config["icons"])

            # Select random name variation for immersion
            enemy_name = random.choice(BattleService.ENEMY_NAME_VARIANTS[enemy_type])

            enemy = BattleEnemy(
                battle_id=battle.id,
                enemy_type=enemy_type,
                name=enemy_name,
                level=base_level,
                icon=enemy_icon,
                hp_max=hp,
                hp_current=hp,
                attack=atk,
                defense=defense,
                is_defeated=False
            )

            db.add(enemy)
            enemies.append(enemy)

        return enemies

    @staticmethod
    def join_battle(
        db: Session,
        battle: Battle,
        player: Player
    ) -> Tuple[bool, str, Optional[BattleParticipant]]:
        """Player joins a battle"""

        # Validation checks
        if battle.status == BattleStatus.COMPLETED:
            return False, "Battle is already completed", None

        if battle.status == BattleStatus.ABANDONED:
            return False, "Battle has been abandoned", None

        if player.level < battle.required_level:
            return False, f"Requires level {battle.required_level}", None

        if player.stamina < battle.stamina_cost:
            return False, f"Not enough stamina (need {battle.stamina_cost}, have {player.stamina})", None

        # Check if already in battle (allow rejoining)
        existing = db.query(BattleParticipant).filter(
            BattleParticipant.battle_id == battle.id,
            BattleParticipant.player_id == player.id,
            BattleParticipant.is_active == True
        ).first()

        if existing:
            # Player is already in the battle - allow rejoin (e.g., after disconnect)
            logger.info(
                "player_rejoined_battle",
                battle_id=battle.id,
                player_id=player.id
            )
            return True, "Rejoined battle successfully", existing

        # Check max players
        active_count = db.query(BattleParticipant).filter(
            BattleParticipant.battle_id == battle.id,
            BattleParticipant.is_active == True
        ).count()

        if active_count >= battle.max_players:
            return False, "Battle is full", None

        # Deduct stamina
        player.stamina -= battle.stamina_cost

        # Create participant
        participant = BattleParticipant(
            battle_id=battle.id,
            player_id=player.id,
            is_active=True,
            total_damage_dealt=0,
            attacks_count=0
        )

        db.add(participant)

        # Start battle if first player
        if battle.status == BattleStatus.WAITING:
            battle.status = BattleStatus.IN_PROGRESS
            battle.started_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(participant)

        logger.info(
            "player_joined_battle",
            battle_id=battle.id,
            player_id=player.id,
            active_players=active_count + 1
        )

        return True, "Joined battle successfully", participant

    @staticmethod
    def calculate_player_attack_power(db: Session, player: Player) -> int:
        """Calculate total attack power including equipment, pets, and buffs"""
        total_attack = player.base_attack

        # Add equipment bonuses from ATTACK set (players use attack set in battles)
        attack_set = db.query(EquipmentSet).filter(
            EquipmentSet.player_id == player.id,
            EquipmentSet.set_type == SetType.ATTACK
        ).first()

        if attack_set:
            equipment_stats = calculate_equipment_stats(attack_set, db)
            total_attack += equipment_stats["attack"]
            logger.debug(
                "calculated_attack_power",
                player_id=player.id,
                base_attack=player.base_attack,
                equipment_attack=equipment_stats["attack"],
                total_attack=total_attack
            )

        # TODO: Add pet bonuses from active pet set
        # Pets will add 20-100+ attack depending on level/focus

        # Apply attack boost buff multiplier
        from app.models.buff import ActiveBuff, BuffType
        attack_boost = db.query(ActiveBuff).filter(
            ActiveBuff.player_id == player.id,
            ActiveBuff.buff_type == BuffType.ATTACK_BOOST,
            ActiveBuff.expires_at > datetime.now(timezone.utc)
        ).first()

        if attack_boost:
            attack_multiplier = attack_boost.effect_value
            total_attack = int(total_attack * attack_multiplier)
            logger.info(
                "attack_boost_applied",
                player_id=player.id,
                base_total=total_attack // attack_multiplier,
                multiplier=attack_multiplier,
                boosted_attack=total_attack
            )

        return total_attack

    @staticmethod
    def calculate_player_defense(db: Session, player: Player) -> int:
        """Calculate total defense including equipment and pets"""
        total_defense = player.base_defense

        # Add equipment bonuses from DEFENSE set (players can have separate defense set)
        defense_set = db.query(EquipmentSet).filter(
            EquipmentSet.player_id == player.id,
            EquipmentSet.set_type == SetType.DEFENSE
        ).first()

        if defense_set:
            equipment_stats = calculate_equipment_stats(defense_set, db)
            total_defense += equipment_stats["defense"]
            logger.debug(
                "calculated_defense",
                player_id=player.id,
                base_defense=player.base_defense,
                equipment_defense=equipment_stats["defense"],
                total_defense=total_defense
            )

        # TODO: Add pet bonuses from active pet set

        # Apply defense boost buff multiplier
        from app.models.buff import ActiveBuff, BuffType
        defense_boost = db.query(ActiveBuff).filter(
            ActiveBuff.player_id == player.id,
            ActiveBuff.buff_type == BuffType.DEFENSE_BOOST,
            ActiveBuff.expires_at > datetime.now(timezone.utc)
        ).first()

        if defense_boost:
            defense_multiplier = defense_boost.effect_value
            total_defense = int(total_defense * defense_multiplier)
            logger.info(
                "defense_boost_applied",
                player_id=player.id,
                base_total=total_defense // defense_multiplier,
                multiplier=defense_multiplier,
                boosted_defense=total_defense
            )

        return total_defense

    @staticmethod
    def calculate_damage(
        attacker_power: int,
        defender_defense: int,
        is_critical: bool = False
    ) -> int:
        """
        Calculate damage dealt in an attack

        Formula: damage = max(1, attacker_power - (defender_defense * 0.5))
        Critical hits deal 2x damage
        """
        base_damage = max(1, attacker_power - int(defender_defense * 0.5))

        if is_critical:
            base_damage = int(base_damage * 2)

        # Add some variance (90-110%)
        variance = random.uniform(0.9, 1.1)
        final_damage = int(base_damage * variance)

        return max(1, final_damage)

    # Attack type stamina costs and damage multipliers
    ATTACK_TYPE_CONFIG = {
        "quick": {"stamina_cost": 5, "damage_mult": 0.7, "crit_bonus": 0},
        "normal": {"stamina_cost": 10, "damage_mult": 1.0, "crit_bonus": 0},
        "power": {"stamina_cost": 20, "damage_mult": 1.5, "crit_bonus": 0.05},
        "critical": {"stamina_cost": 35, "damage_mult": 2.2, "crit_bonus": 0.15},
        "ultimate": {"stamina_cost": 50, "damage_mult": 3.0, "crit_bonus": 0.25},
    }

    @staticmethod
    def process_attack(
        db: Session,
        battle: Battle,
        player: Player,
        enemy_id: int,
        attack_type: str = "normal"
    ) -> Dict:
        """
        Process a player attack on an enemy
        Returns attack result with damage, critical hit, enemy status

        Attack types:
        - quick: Low damage (0.7x), low stamina (5)
        - normal: Normal damage (1.0x), normal stamina (10)
        - power: High damage (1.5x), high stamina (20)
        - critical: Very high damage (2.2x), very high stamina (35), +15% crit chance
        - ultimate: Massive damage (3.0x), massive stamina (50), +25% crit chance
        """

        # Get enemy
        enemy = db.query(BattleEnemy).filter(
            BattleEnemy.id == enemy_id,
            BattleEnemy.battle_id == battle.id
        ).first()

        if not enemy:
            return {"success": False, "error": "Enemy not found"}

        if enemy.is_defeated:
            return {"success": False, "error": "Enemy already defeated"}

        if battle.status != BattleStatus.IN_PROGRESS:
            return {"success": False, "error": "Battle not in progress"}

        # Get participant
        participant = db.query(BattleParticipant).filter(
            BattleParticipant.battle_id == battle.id,
            BattleParticipant.player_id == player.id,
            BattleParticipant.is_active == True
        ).first()

        if not participant:
            return {"success": False, "error": "Not in this battle"}

        # Check if player is dead (for boss raids)
        if battle.is_boss_raid:
            is_on_cooldown, seconds_remaining = BattleService.check_player_death_cooldown(participant)
            if is_on_cooldown:
                minutes = seconds_remaining // 60
                seconds = seconds_remaining % 60
                return {
                    "success": False,
                    "error": f"You are dead! Wait {minutes}m {seconds}s or use a resurrection potion",
                    "is_dead": True,
                    "cooldown_remaining": seconds_remaining
                }

        # Get attack type configuration
        attack_config = BattleService.ATTACK_TYPE_CONFIG.get(attack_type.lower(), BattleService.ATTACK_TYPE_CONFIG["normal"])
        stamina_cost = attack_config["stamina_cost"]
        damage_mult = attack_config["damage_mult"]
        crit_bonus = attack_config["crit_bonus"]

        # Check stamina
        if player.stamina < stamina_cost:
            return {
                "success": False,
                "error": f"Not enough stamina! Need {stamina_cost}, have {player.stamina}",
                "stamina_required": stamina_cost,
                "stamina_current": player.stamina
            }

        # Deduct stamina
        player.stamina -= stamina_cost

        # Calculate attack
        attacker_power = BattleService.calculate_player_attack_power(db, player)

        # Critical hit chance (10% base + attack type bonus)
        base_crit_chance = 0.10
        is_critical = random.random() < (base_crit_chance + crit_bonus)

        damage = BattleService.calculate_damage(
            attacker_power=attacker_power,
            defender_defense=enemy.defense,
            is_critical=is_critical
        )

        # Apply attack type damage multiplier
        damage = int(damage * damage_mult)

        # Apply damage
        enemy.hp_current = max(0, enemy.hp_current - damage)

        # Update participant stats
        participant.total_damage_dealt += damage
        participant.attacks_count += 1

        # Check if enemy defeated
        enemy_defeated = enemy.hp_current <= 0
        if enemy_defeated:
            enemy.is_defeated = True
            enemy.defeated_at = datetime.now(timezone.utc)
            # Flush to ensure the is_defeated flag is available for the next query
            db.flush()

        # Check if all enemies defeated (battle complete)
        all_defeated = db.query(BattleEnemy).filter(
            BattleEnemy.battle_id == battle.id,
            BattleEnemy.is_defeated == False
        ).count() == 0

        if all_defeated:
            battle.status = BattleStatus.COMPLETED
            battle.completed_at = datetime.now(timezone.utc)

        # Check for boss phase transition (for boss raids)
        phase_transition = None
        if battle.is_boss_raid and not enemy_defeated:
            phase_transition = BattleService.check_boss_phase_transition(db, battle, enemy)

        db.commit()

        result = {
            "success": True,
            "damage": damage,
            "is_critical": is_critical,
            "enemy_id": enemy_id,
            "enemy_hp_remaining": enemy.hp_current,
            "enemy_defeated": enemy_defeated,
            "battle_completed": all_defeated,
            "attack_type": attack_type,
            "stamina_cost": stamina_cost,
            "stamina_remaining": player.stamina,
            "phase_transition": phase_transition  # Will be None for regular battles or if no transition
        }

        logger.info(
            "attack_processed",
            battle_id=battle.id,
            player_id=player.id,
            enemy_id=enemy_id,
            attack_type=attack_type,
            damage=damage,
            critical=is_critical,
            stamina_cost=stamina_cost,
            enemy_defeated=enemy_defeated
        )

        return result

    @staticmethod
    def claim_loot(
        db: Session,
        battle: Battle,
        player: Player
    ) -> Dict:
        """
        Claim loot from a completed battle
        Awards gold, XP, and potentially items
        """

        if battle.status != BattleStatus.COMPLETED:
            return {"success": False, "error": "Battle not completed"}

        # Get participant
        participant = db.query(BattleParticipant).filter(
            BattleParticipant.battle_id == battle.id,
            BattleParticipant.player_id == player.id
        ).first()

        if not participant:
            return {"success": False, "error": "Not in this battle"}

        if participant.has_claimed_loot:
            return {"success": False, "error": "Already claimed loot"}

        # Calculate rewards based on contribution
        total_damage = db.query(BattleParticipant.total_damage_dealt).filter(
            BattleParticipant.battle_id == battle.id
        ).all()
        total_damage_sum = sum([d[0] for d in total_damage])

        contribution_percent = 0
        if total_damage_sum > 0:
            contribution_percent = (participant.total_damage_dealt / total_damage_sum) * 100
        else:
            # Equal split if no one dealt damage
            contribution_percent = 100 / len(total_damage)

        # Base rewards
        gold_reward = battle.gold_reward
        xp_reward = battle.exp_reward

        # Bonus for high contribution (>50% damage gets 20% bonus)
        if contribution_percent > 50:
            gold_reward = int(gold_reward * 1.2)
            xp_reward = int(xp_reward * 1.2)

        # Award gold
        player.gold += gold_reward

        # Award XP (uses ProgressionService for level-ups)
        level_up_info = ProgressionService.award_xp(
            db=db,
            player=player,
            xp_amount=xp_reward,
            source=f"battle_{battle.id}"
        )

        # Generate loot drops (10% chance per difficulty tier)
        items_dropped = []
        loot_chance = 0.10 * (list(DifficultyLevel).index(battle.difficulty) + 1)

        if random.random() < loot_chance:
            item = BattleService._generate_loot_item(db, player, battle)
            if item:
                items_dropped.append({
                    "id": item.id,
                    "name": item.name,
                    "type": item.item_type.value,
                    "rarity": item.rarity.value
                })

        # Mark as claimed
        participant.has_claimed_loot = True
        participant.claimed_at = datetime.now(timezone.utc)
        participant.rewards = {
            "gold": gold_reward,
            "xp": xp_reward,
            "items": items_dropped,
            "contribution_percent": round(contribution_percent, 2)
        }

        db.commit()

        # CRITICAL: Refresh player to ensure all changes from award_xp are visible
        db.refresh(player)

        logger.info(
            "loot_claimed",
            battle_id=battle.id,
            player_id=player.id,
            gold=gold_reward,
            xp=xp_reward,
            items=len(items_dropped),
            leveled_up=level_up_info["leveled_up"],
            player_exp_after=player.exp,
            player_level_after=player.level
        )

        return {
            "success": True,
            "gold": gold_reward,
            "xp": xp_reward,
            "items": items_dropped,
            "contribution_percent": round(contribution_percent, 2),
            "level_up_info": level_up_info
        }

    @staticmethod
    def _generate_loot_item(
        db: Session,
        player: Player,
        battle: Battle
    ) -> Optional[InventoryItem]:
        """Generate a random loot item based on battle difficulty"""

        # Rarity chances based on difficulty
        rarity_weights = {
            DifficultyLevel.EASY: [(ItemRarity.COMMON, 70), (ItemRarity.UNCOMMON, 30)],
            DifficultyLevel.MEDIUM: [(ItemRarity.COMMON, 50), (ItemRarity.UNCOMMON, 40), (ItemRarity.RARE, 10)],
            DifficultyLevel.HARD: [(ItemRarity.UNCOMMON, 50), (ItemRarity.RARE, 40), (ItemRarity.EPIC, 10)],
            DifficultyLevel.EPIC: [(ItemRarity.RARE, 50), (ItemRarity.EPIC, 40), (ItemRarity.LEGENDARY, 10)],
            DifficultyLevel.LEGENDARY: [(ItemRarity.EPIC, 60), (ItemRarity.LEGENDARY, 40)],
        }

        rarities, weights = zip(*rarity_weights[battle.difficulty])
        rarity = random.choices(rarities, weights=weights)[0]

        # Random equipment type
        equipment_types = [ItemType.WEAPON, ItemType.HELMET, ItemType.ARMOR,
                          ItemType.BOOTS, ItemType.GLOVES, ItemType.RING, ItemType.AMULET]
        item_type = random.choice(equipment_types)

        # Generate stats based on rarity and battle level
        stat_multipliers = {
            ItemRarity.COMMON: 1.0,
            ItemRarity.UNCOMMON: 1.5,
            ItemRarity.RARE: 2.5,
            ItemRarity.EPIC: 4.0,
            ItemRarity.LEGENDARY: 6.0
        }

        mult = stat_multipliers[rarity]
        base_level = battle.required_level

        # Generate random stats
        if item_type == ItemType.WEAPON:
            atk = int((15 + base_level * 2) * mult)
            defense = 0
            hp = 0
        elif item_type in [ItemType.HELMET, ItemType.ARMOR]:
            atk = int((5 + base_level) * mult * 0.3)
            defense = int((20 + base_level * 3) * mult)
            hp = int((50 + base_level * 10) * mult)
        else:
            atk = int((8 + base_level * 1.5) * mult * 0.5)
            defense = int((8 + base_level * 1.5) * mult * 0.5)
            hp = int((30 + base_level * 5) * mult)

        item = InventoryItem(
            player_id=player.id,
            name=f"Battle {rarity.value.title()} {item_type.value.title()}",
            item_type=item_type,
            rarity=rarity,
            level_requirement=base_level,
            attack_bonus=atk,
            defense_bonus=defense,
            hp_bonus=hp,
            properties={"source": f"battle_{battle.id}"},
            quantity=1
        )

        db.add(item)
        return item

    @staticmethod
    def get_available_battles(
        db: Session,
        player: Player,
        battle_type: Optional[BattleType] = None
    ) -> List[Battle]:
        """Get list of available battles for a player, optionally filtered by battle type"""

        query = db.query(Battle).filter(
            Battle.status.in_([BattleStatus.WAITING, BattleStatus.IN_PROGRESS]),
            Battle.required_level <= player.level
        )

        # Filter by battle type if specified
        if battle_type:
            query = query.filter(Battle.battle_type == battle_type)

        battles = query.order_by(Battle.created_at.desc()).limit(20).all()

        return battles

    @staticmethod
    def get_battle_info(db: Session, battle_id: int) -> Optional[Dict]:
        """Get detailed battle information"""

        battle = db.query(Battle).filter(Battle.id == battle_id).first()
        if not battle:
            return None

        enemies = db.query(BattleEnemy).filter(BattleEnemy.battle_id == battle_id).all()
        participants_query = db.query(BattleParticipant).filter(
            BattleParticipant.battle_id == battle_id,
            BattleParticipant.is_active == True
        ).all()

        # Get player details for each participant
        participants_list = []
        for p in participants_query:
            player = db.query(Player).filter(Player.id == p.player_id).first()
            if player:
                participants_list.append({
                    "id": p.id,
                    "player_id": player.id,
                    "username": player.username,
                    "level": player.level,
                    "total_damage_dealt": p.total_damage_dealt,
                    "is_dead": p.is_dead,
                    "joined_at": p.joined_at.isoformat() if p.joined_at else None
                })

        result = {
            "id": battle.id,
            "name": battle.name,
            "difficulty": battle.difficulty.value,
            "wave_number": battle.wave_number,
            "status": battle.status.value,
            "required_level": battle.required_level,
            "stamina_cost": battle.stamina_cost,
            "max_players": battle.max_players,
            "current_players": len(participants_query),
            "gold_reward": battle.gold_reward,
            "exp_reward": battle.exp_reward,
            "participants": participants_list,
            "is_boss_raid": battle.is_boss_raid,
            "battle_type": battle.battle_type.value,
            "enemies": [
                {
                    "id": e.id,
                    "name": e.name,
                    "type": e.enemy_type.value,
                    "level": e.level,
                    "icon": e.icon,
                    "hp_current": e.hp_current,
                    "hp_max": e.hp_max,
                    "attack": e.attack,
                    "defense": e.defense,
                    "is_defeated": e.is_defeated
                }
                for e in enemies
            ]
        }

        # Add boss raid specific fields
        if battle.is_boss_raid:
            result.update({
                "battle_type": battle.battle_type.value,
                "is_boss_raid": True,
                "min_players": battle.min_players,
                "boss_phase_count": battle.boss_phase_count,
                "boss_current_phase": battle.boss_current_phase,
                "boss_phase_thresholds": battle.boss_phase_thresholds
            })
        else:
            result["battle_type"] = battle.battle_type.value
            result["is_boss_raid"] = False

        return result

    @staticmethod
    def check_boss_phase_transition(
        db: Session,
        battle: Battle,
        boss: BattleEnemy
    ) -> Optional[Dict]:
        """
        Check if boss has crossed a phase threshold and return phase transition data
        Returns None if no phase transition occurred
        """
        if not battle.is_boss_raid:
            return None

        # Calculate current HP percentage
        hp_percent = (boss.hp_current / boss.hp_max) * 100

        # Check if we've crossed a phase threshold
        current_phase = battle.boss_current_phase
        thresholds = battle.boss_phase_thresholds or [75, 50, 25]

        # Check each threshold to see if we've crossed it
        for phase_num, threshold in enumerate(thresholds, start=2):
            if phase_num > current_phase and hp_percent <= threshold:
                # Phase transition!
                battle.boss_current_phase = phase_num
                db.flush()

                phase_descriptions = {
                    2: f"{boss.name} enters Phase 2! The battle intensifies!",
                    3: f"{boss.name} enters Phase 3! This is getting dangerous!",
                    4: f"{boss.name} enters the FINAL PHASE! Give it everything!"
                }

                logger.info(
                    "boss_phase_transition",
                    battle_id=battle.id,
                    boss_name=boss.name,
                    previous_phase=current_phase,
                    new_phase=phase_num,
                    hp_percent=hp_percent
                )

                return {
                    "phase_changed": True,
                    "previous_phase": current_phase,
                    "new_phase": phase_num,
                    "hp_percent": hp_percent,
                    "description": phase_descriptions.get(phase_num, f"Phase {phase_num}")
                }

        return None

    @staticmethod
    def check_player_death_cooldown(participant: BattleParticipant) -> Tuple[bool, int]:
        """
        Check if player is dead and how much cooldown remains
        Returns (is_on_cooldown, seconds_remaining)
        """
        if not participant.is_dead or not participant.death_timestamp:
            return False, 0

        # Calculate time since death
        now = datetime.now(timezone.utc)
        death_time = participant.death_timestamp
        if death_time.tzinfo is None:
            death_time = death_time.replace(tzinfo=timezone.utc)

        time_since_death = (now - death_time).total_seconds()
        cooldown_remaining = max(0, BattleService.DEATH_COOLDOWN_SECONDS - time_since_death)

        if cooldown_remaining <= 0:
            # Cooldown expired, player can attack again
            return False, 0

        return True, int(cooldown_remaining)

    @staticmethod
    def resurrect_player(
        db: Session,
        participant: BattleParticipant,
        player: Player,
        use_potion: bool = False
    ) -> Tuple[bool, str]:
        """
        Resurrect a dead player (either via potion or cooldown expiry)
        Returns (success, message)
        """
        if not participant.is_dead:
            return False, "Player is not dead"

        if use_potion:
            # TODO: Check if player has resurrection potion in inventory
            # For now, we'll implement a gem cost
            resurrection_cost = 50  # gems
            if player.gems < resurrection_cost:
                return False, f"Not enough gems (need {resurrection_cost}, have {player.gems})"

            player.gems -= resurrection_cost

        # Check if cooldown has expired (if not using potion)
        if not use_potion:
            on_cooldown, seconds_remaining = BattleService.check_player_death_cooldown(participant)
            if on_cooldown:
                minutes = seconds_remaining // 60
                seconds = seconds_remaining % 60
                return False, f"Must wait {minutes}m {seconds}s to resurrect naturally"

        # Resurrect the player
        participant.is_dead = False
        participant.death_timestamp = None
        participant.resurrection_count += 1

        db.commit()

        logger.info(
            "player_resurrected",
            participant_id=participant.id,
            player_id=player.id,
            used_potion=use_potion,
            resurrection_count=participant.resurrection_count
        )

        return True, "Player resurrected successfully"
