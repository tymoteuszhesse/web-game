from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import structlog
from app.core.security import decode_access_token

logger = structlog.get_logger()

router = APIRouter()

# Store active WebSocket connections per battle
battle_connections: Dict[int, List[WebSocket]] = {}


class BattleConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[Dict]] = {}

    async def connect(self, websocket: WebSocket, battle_id: int, user_id: int, username: str):
        """Connect a player to a battle room"""
        await websocket.accept()

        if battle_id not in self.active_connections:
            self.active_connections[battle_id] = []

        self.active_connections[battle_id].append({
            "websocket": websocket,
            "user_id": user_id,
            "username": username
        })

        logger.info("player_connected_to_battle",
                   battle_id=battle_id,
                   user_id=user_id,
                   username=username,
                   total_players=len(self.active_connections[battle_id]))

    def disconnect(self, websocket: WebSocket, battle_id: int):
        """Disconnect a player from a battle room"""
        if battle_id in self.active_connections:
            self.active_connections[battle_id] = [
                conn for conn in self.active_connections[battle_id]
                if conn["websocket"] != websocket
            ]

            if len(self.active_connections[battle_id]) == 0:
                del self.active_connections[battle_id]

            logger.info("player_disconnected_from_battle",
                       battle_id=battle_id,
                       remaining_players=len(self.active_connections.get(battle_id, [])))

    async def broadcast_to_battle(self, battle_id: int, message: dict):
        """Broadcast a message to all players in a battle"""
        if battle_id not in self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections[battle_id]:
            try:
                await connection["websocket"].send_json(message)
            except Exception as e:
                logger.error("broadcast_error",
                           battle_id=battle_id,
                           error=str(e))
                disconnected.append(connection["websocket"])

        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws, battle_id)

    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific player"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error("personal_message_error", error=str(e))

    def get_player_count(self, battle_id: int) -> int:
        """Get the number of players in a battle"""
        return len(self.active_connections.get(battle_id, []))

    def get_player_list(self, battle_id: int) -> List[str]:
        """Get list of usernames in a battle"""
        if battle_id not in self.active_connections:
            return []
        return [conn["username"] for conn in self.active_connections[battle_id]]


manager = BattleConnectionManager()


def get_battle_manager() -> BattleConnectionManager:
    """Get the global battle connection manager instance"""
    return manager


@router.websocket("/ws/battle/{battle_id}")
async def battle_websocket_endpoint(websocket: WebSocket, battle_id: int, token: str):
    """
    WebSocket endpoint for real-time battle updates

    Usage: ws://localhost:8000/ws/battle/{battle_id}?token=<jwt_token>
    """
    from app.db.database import get_db
    from app.models.player import Player

    try:
        # Authenticate user via token
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            await websocket.close(code=1008, reason="Authentication failed")
            return

        # Get player username from database
        db = next(get_db())
        player = db.query(Player).filter(Player.user_id == int(user_id)).first()
        username = player.username if player else payload.get("email", "Unknown")
        db.close()

        # Connect player to battle
        await manager.connect(websocket, battle_id, user_id, username)

        # Send welcome message
        await manager.send_personal_message(websocket, {
            "type": "connected",
            "message": f"Connected to battle {battle_id}",
            "battle_id": battle_id,
            "player_count": manager.get_player_count(battle_id)
        })

        # Broadcast player joined to all players in battle
        await manager.broadcast_to_battle(battle_id, {
            "type": "player_joined",
            "username": username,
            "player_count": manager.get_player_count(battle_id),
            "players": manager.get_player_list(battle_id)
        })

        # Listen for messages from client
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            message_type = message.get("type")

            if message_type == "attack":
                # TODO: Process attack and calculate damage
                # For now, just broadcast the attack
                await manager.broadcast_to_battle(battle_id, {
                    "type": "attack",
                    "username": username,
                    "damage": message.get("damage", 0),
                    "enemy_id": message.get("enemy_id"),
                    "timestamp": message.get("timestamp")
                })

            elif message_type == "enemy_defeated":
                await manager.broadcast_to_battle(battle_id, {
                    "type": "enemy_defeated",
                    "enemy_id": message.get("enemy_id"),
                    "defeated_by": username
                })

            elif message_type == "chat":
                await manager.broadcast_to_battle(battle_id, {
                    "type": "chat",
                    "username": username,
                    "message": message.get("message", "")
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, battle_id)
        await manager.broadcast_to_battle(battle_id, {
            "type": "player_left",
            "username": username,
            "player_count": manager.get_player_count(battle_id),
            "players": manager.get_player_list(battle_id)
        })
    except Exception as e:
        logger.error("websocket_error",
                    battle_id=battle_id,
                    error=str(e))
        await websocket.close(code=1011, reason="Internal server error")
