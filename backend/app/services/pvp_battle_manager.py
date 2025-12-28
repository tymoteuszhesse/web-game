"""
PVP Battle Manager - Real-Time Combat System
Manages live PVP battles with turn-based combat and WebSocket updates
"""
import asyncio
import random
from typing import Dict, Optional, List, Tuple
from datetime import datetime
from enum import Enum
import logging

from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)


class BattlePhase(str, Enum):
    """Battle phases"""
    WAITING = "waiting"
    READY = "ready"
    COMBAT = "combat"
    FINISHED = "finished"


class ActionType(str, Enum):
    """Combat action types"""
    ATTACK = "attack"
    DEFEND = "defend"
    SPECIAL = "special"


class BattleState:
    """Represents the state of an active PVP battle"""

    def __init__(self, duel_id: int, player1_id: int, player2_id: int,
                 player1_data: dict, player2_data: dict, gold_stake: int):
        self.duel_id = duel_id
        self.battle_id = f"pvp_{duel_id}_{int(datetime.utcnow().timestamp())}"

        # Player data
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.player1_data = player1_data
        self.player2_data = player2_data

        # Battle stats
        self.player1_hp = player1_data['max_hp']
        self.player2_hp = player2_data['max_hp']
        self.player1_max_hp = player1_data['max_hp']
        self.player2_max_hp = player2_data['max_hp']

        # Combat state
        self.phase = BattlePhase.WAITING
        self.current_turn = 1
        self.turn_actions: Dict[int, Optional[ActionType]] = {
            player1_id: None,
            player2_id: None
        }

        # Stakes
        self.gold_stake = gold_stake

        # Battle log
        self.battle_log: List[dict] = []
        self.winner_id: Optional[int] = None

        # Timing
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.finished_at: Optional[datetime] = None

        # Readiness
        self.players_ready = set()

    def is_player_in_battle(self, player_id: int) -> bool:
        """Check if player is in this battle"""
        return player_id in [self.player1_id, self.player2_id]

    def get_opponent_id(self, player_id: int) -> Optional[int]:
        """Get opponent's player ID"""
        if player_id == self.player1_id:
            return self.player2_id
        elif player_id == self.player2_id:
            return self.player1_id
        return None

    def get_player_hp(self, player_id: int) -> Tuple[int, int]:
        """Get player's current and max HP"""
        if player_id == self.player1_id:
            return (self.player1_hp, self.player1_max_hp)
        elif player_id == self.player2_id:
            return (self.player2_hp, self.player2_max_hp)
        return (0, 0)

    def mark_ready(self, player_id: int):
        """Mark player as ready"""
        self.players_ready.add(player_id)
        if len(self.players_ready) == 2:
            self.phase = BattlePhase.READY

    def set_action(self, player_id: int, action: ActionType):
        """Set player's action for current turn"""
        self.turn_actions[player_id] = action

    def are_actions_submitted(self) -> bool:
        """Check if both players submitted actions"""
        return all(action is not None for action in self.turn_actions.values())

    def clear_turn_actions(self):
        """Clear actions for next turn"""
        for player_id in self.turn_actions:
            self.turn_actions[player_id] = None


class PvPBattleManager:
    """Manages all active PVP battles"""

    def __init__(self):
        # Active battles: {battle_id: BattleState}
        self.active_battles: Dict[str, BattleState] = {}

        # Player to battle mapping: {player_id: battle_id}
        self.player_battles: Dict[int, str] = {}

        # WebSocket connections for battle players: {battle_id: {player_id: websocket}}
        self.battle_connections: Dict[str, Dict[int, any]] = {}

        # Lock for thread safety
        self._lock = asyncio.Lock()

    async def create_battle(self, duel_id: int, player1_id: int, player2_id: int,
                           player1_data: dict, player2_data: dict, gold_stake: int) -> BattleState:
        """Create a new PVP battle"""
        async with self._lock:
            battle = BattleState(
                duel_id=duel_id,
                player1_id=player1_id,
                player2_id=player2_id,
                player1_data=player1_data,
                player2_data=player2_data,
                gold_stake=gold_stake
            )

            self.active_battles[battle.battle_id] = battle
            self.player_battles[player1_id] = battle.battle_id
            self.player_battles[player2_id] = battle.battle_id

            logger.info(f"Created PVP battle {battle.battle_id} for duel {duel_id}")

            return battle

    async def get_battle(self, battle_id: str) -> Optional[BattleState]:
        """Get battle by ID"""
        return self.active_battles.get(battle_id)

    async def get_player_battle(self, player_id: int) -> Optional[BattleState]:
        """Get battle for player"""
        battle_id = self.player_battles.get(player_id)
        if battle_id:
            return self.active_battles.get(battle_id)
        return None

    async def register_connection(self, battle_id: str, player_id: int, websocket):
        """Register WebSocket connection for a player in battle"""
        if battle_id not in self.battle_connections:
            self.battle_connections[battle_id] = {}
        self.battle_connections[battle_id][player_id] = websocket
        logger.info(f"Registered connection for player {player_id} in battle {battle_id}")

    async def unregister_connection(self, battle_id: str, player_id: int):
        """Unregister WebSocket connection for a player"""
        if battle_id in self.battle_connections:
            self.battle_connections[battle_id].pop(player_id, None)
            if not self.battle_connections[battle_id]:
                del self.battle_connections[battle_id]
        logger.info(f"Unregistered connection for player {player_id} from battle {battle_id}")

    async def mark_player_ready(self, battle_id: str, player_id: int):
        """Mark player as ready to fight"""
        battle = await self.get_battle(battle_id)
        if not battle:
            return False

        battle.mark_ready(player_id)

        # Notify both players
        await self.broadcast_to_battle(battle_id, {
            "type": "player_ready",
            "player_id": player_id,
            "ready_count": len(battle.players_ready),
            "total_players": 2
        })

        # If both ready, start battle
        if battle.phase == BattlePhase.READY:
            await self.start_battle(battle_id)

        return True

    async def start_battle(self, battle_id: str):
        """Start the battle"""
        battle = await self.get_battle(battle_id)
        if not battle:
            return

        battle.phase = BattlePhase.COMBAT
        battle.started_at = datetime.utcnow()

        logger.info(f"Starting PVP battle {battle_id}")

        # Send battle start message
        await self.broadcast_to_battle(battle_id, {
            "type": "battle_start",
            "turn": battle.current_turn,
            "player1": {
                "id": battle.player1_id,
                "name": battle.player1_data['username'],
                "hp": battle.player1_hp,
                "max_hp": battle.player1_max_hp,
                "attack": battle.player1_data['attack'],
                "defense": battle.player1_data['defense']
            },
            "player2": {
                "id": battle.player2_id,
                "name": battle.player2_data['username'],
                "hp": battle.player2_hp,
                "max_hp": battle.player2_max_hp,
                "attack": battle.player2_data['attack'],
                "defense": battle.player2_data['defense']
            },
            "gold_stake": battle.gold_stake
        })

    async def submit_action(self, battle_id: str, player_id: int, action: ActionType):
        """Submit combat action"""
        battle = await self.get_battle(battle_id)
        if not battle or battle.phase != BattlePhase.COMBAT:
            return False

        if not battle.is_player_in_battle(player_id):
            return False

        # Set action
        battle.set_action(player_id, action)

        # Notify that player submitted action
        opponent_id = battle.get_opponent_id(player_id)
        if opponent_id:
            connections = self.battle_connections.get(battle_id, {})
            opponent_ws = connections.get(opponent_id)
            if opponent_ws:
                try:
                    await opponent_ws.send_json({
                        "type": "opponent_action_submitted",
                        "turn": battle.current_turn
                    })
                except Exception as e:
                    logger.error(f"Failed to notify opponent {opponent_id}: {e}")

        # If both submitted, resolve turn
        if battle.are_actions_submitted():
            await self.resolve_turn(battle_id)

        return True

    async def resolve_turn(self, battle_id: str):
        """Resolve combat turn"""
        battle = await self.get_battle(battle_id)
        if not battle:
            return

        # Get actions
        p1_action = battle.turn_actions[battle.player1_id]
        p2_action = battle.turn_actions[battle.player2_id]

        # Calculate damage
        turn_result = self.calculate_turn_result(battle, p1_action, p2_action)

        # Apply damage
        battle.player1_hp = max(0, battle.player1_hp - turn_result['p1_damage_taken'])
        battle.player2_hp = max(0, battle.player2_hp - turn_result['p2_damage_taken'])

        # Add to battle log
        battle.battle_log.append({
            "turn": battle.current_turn,
            "p1_action": p1_action.value,
            "p2_action": p2_action.value,
            "p1_damage_dealt": turn_result['p1_damage_dealt'],
            "p2_damage_dealt": turn_result['p2_damage_dealt'],
            "p1_hp": battle.player1_hp,
            "p2_hp": battle.player2_hp
        })

        # Broadcast turn result
        await self.broadcast_to_battle(battle_id, {
            "type": "turn_result",
            "turn": battle.current_turn,
            "actions": {
                battle.player1_id: p1_action.value,
                battle.player2_id: p2_action.value
            },
            "damage": {
                battle.player1_id: turn_result['p1_damage_taken'],
                battle.player2_id: turn_result['p2_damage_taken']
            },
            "hp": {
                battle.player1_id: battle.player1_hp,
                battle.player2_id: battle.player2_hp
            },
            "effects": turn_result['effects']
        })

        # Check for winner
        if battle.player1_hp <= 0 or battle.player2_hp <= 0:
            await self.end_battle(battle_id)
        else:
            # Next turn
            battle.current_turn += 1
            battle.clear_turn_actions()

            # Request next actions
            await self.broadcast_to_battle(battle_id, {
                "type": "request_action",
                "turn": battle.current_turn
            })

    def calculate_turn_result(self, battle: BattleState, p1_action: ActionType,
                             p2_action: ActionType) -> dict:
        """Calculate turn combat result"""
        p1_attack = battle.player1_data['attack']
        p1_defense = battle.player1_data['defense']
        p2_attack = battle.player2_data['attack']
        p2_defense = battle.player2_data['defense']

        # Base damage calculation
        p1_base_damage = max(1, p1_attack - (p2_defense // 2))
        p2_base_damage = max(1, p2_attack - (p1_defense // 2))

        # Action modifiers
        p1_damage_mult = 1.0
        p2_damage_mult = 1.0
        p1_defense_mult = 1.0
        p2_defense_mult = 1.0

        effects = []

        # Player 1 action effects
        if p1_action == ActionType.ATTACK:
            p1_damage_mult = 1.0
        elif p1_action == ActionType.DEFEND:
            p1_defense_mult = 2.0
            p1_damage_mult = 0.5
            effects.append(f"{battle.player1_data['username']} is defending!")
        elif p1_action == ActionType.SPECIAL:
            # 30% chance for critical hit (2x damage)
            if random.random() < 0.3:
                p1_damage_mult = 2.0
                effects.append(f"{battle.player1_data['username']} lands a CRITICAL hit!")
            else:
                p1_damage_mult = 0.8
                effects.append(f"{battle.player1_data['username']}'s special attack missed!")

        # Player 2 action effects
        if p2_action == ActionType.ATTACK:
            p2_damage_mult = 1.0
        elif p2_action == ActionType.DEFEND:
            p2_defense_mult = 2.0
            p2_damage_mult = 0.5
            effects.append(f"{battle.player2_data['username']} is defending!")
        elif p2_action == ActionType.SPECIAL:
            # 30% chance for critical hit
            if random.random() < 0.3:
                p2_damage_mult = 2.0
                effects.append(f"{battle.player2_data['username']} lands a CRITICAL hit!")
            else:
                p2_damage_mult = 0.8
                effects.append(f"{battle.player2_data['username']}'s special attack missed!")

        # Calculate final damage with defense
        p1_damage_dealt = int(p1_base_damage * p1_damage_mult / p2_defense_mult)
        p2_damage_dealt = int(p2_base_damage * p2_damage_mult / p1_defense_mult)

        # Add variance (±10%)
        p1_damage_dealt = int(p1_damage_dealt * random.uniform(0.9, 1.1))
        p2_damage_dealt = int(p2_damage_dealt * random.uniform(0.9, 1.1))

        return {
            'p1_damage_dealt': p1_damage_dealt,
            'p2_damage_dealt': p2_damage_dealt,
            'p1_damage_taken': p2_damage_dealt,
            'p2_damage_taken': p1_damage_dealt,
            'effects': effects
        }

    async def end_battle(self, battle_id: str):
        """End the battle and declare winner"""
        battle = await self.get_battle(battle_id)
        if not battle:
            return

        battle.phase = BattlePhase.FINISHED
        battle.finished_at = datetime.utcnow()

        # Determine winner
        if battle.player1_hp <= 0 and battle.player2_hp <= 0:
            # Draw (very unlikely)
            battle.winner_id = None
        elif battle.player1_hp <= 0:
            battle.winner_id = battle.player2_id
        else:
            battle.winner_id = battle.player1_id

        # Calculate gold reward
        gold_reward = battle.gold_stake * 2 if battle.winner_id else 0

        logger.info(f"Battle {battle_id} ended. Winner: {battle.winner_id}")

        # Broadcast battle end
        await self.broadcast_to_battle(battle_id, {
            "type": "battle_end",
            "winner_id": battle.winner_id,
            "winner_name": (
                battle.player1_data['username'] if battle.winner_id == battle.player1_id
                else battle.player2_data['username'] if battle.winner_id == battle.player2_id
                else None
            ),
            "gold_reward": gold_reward,
            "final_hp": {
                battle.player1_id: battle.player1_hp,
                battle.player2_id: battle.player2_hp
            },
            "total_turns": battle.current_turn
        })

        # Cleanup after delay
        asyncio.create_task(self.cleanup_battle(battle_id, delay=10))

    async def cleanup_battle(self, battle_id: str, delay: int = 0):
        """Cleanup battle after completion"""
        if delay > 0:
            await asyncio.sleep(delay)

        async with self._lock:
            battle = self.active_battles.get(battle_id)
            if battle:
                # Remove player mappings
                self.player_battles.pop(battle.player1_id, None)
                self.player_battles.pop(battle.player2_id, None)

                # Remove battle
                del self.active_battles[battle_id]

                logger.info(f"Cleaned up battle {battle_id}")

    async def broadcast_to_battle(self, battle_id: str, message: dict):
        """Send message to all players in battle"""
        battle = await self.get_battle(battle_id)
        if not battle:
            return

        message['battle_id'] = battle_id
        message['timestamp'] = datetime.utcnow().isoformat()

        # Send through battle WebSocket connections
        connections = self.battle_connections.get(battle_id, {})
        for player_id, websocket in connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to player {player_id}: {e}")

    async def forfeit_battle(self, battle_id: str, player_id: int):
        """Player forfeits the battle"""
        battle = await self.get_battle(battle_id)
        if not battle or not battle.is_player_in_battle(player_id):
            return False

        # Opponent wins
        battle.winner_id = battle.get_opponent_id(player_id)
        battle.phase = BattlePhase.FINISHED
        battle.finished_at = datetime.utcnow()

        await self.broadcast_to_battle(battle_id, {
            "type": "battle_forfeit",
            "forfeiter_id": player_id,
            "winner_id": battle.winner_id
        })

        await self.end_battle(battle_id)
        return True


# Global battle manager instance
pvp_battle_manager = PvPBattleManager()
