"""
WebSocket Connection Manager for Real-Time PVP Events
Manages WebSocket connections, broadcasts, and user presence
"""
from fastapi import WebSocket
from typing import Dict, Set, Optional, Any
import asyncio
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time PVP features"""

    def __init__(self):
        # Active connections: {user_id: {websocket, player_id, username}}
        self.active_connections: Dict[int, Dict[str, Any]] = {}

        # Player to user mapping for quick lookups
        self.player_to_user: Dict[int, int] = {}

        # Lock for thread-safe operations
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: int, player_id: int, username: str):
        """Accept new WebSocket connection and track user"""
        await websocket.accept()

        async with self._lock:
            # Disconnect previous connection if exists
            if user_id in self.active_connections:
                old_ws = self.active_connections[user_id]["websocket"]
                try:
                    await old_ws.close()
                except:
                    pass

            # Store connection
            self.active_connections[user_id] = {
                "websocket": websocket,
                "player_id": player_id,
                "username": username,
                "connected_at": datetime.utcnow()
            }
            self.player_to_user[player_id] = user_id

        logger.info(f"User {username} (ID: {user_id}) connected via WebSocket")

        # Broadcast online status update
        await self.broadcast_online_status_change(user_id, username, True)

    async def disconnect(self, user_id: int):
        """Remove WebSocket connection and notify others"""
        async with self._lock:
            if user_id in self.active_connections:
                connection_info = self.active_connections[user_id]
                username = connection_info["username"]
                player_id = connection_info["player_id"]

                # Remove from tracking
                del self.active_connections[user_id]
                if player_id in self.player_to_user:
                    del self.player_to_user[player_id]

                logger.info(f"User {username} (ID: {user_id}) disconnected")

                # Broadcast offline status
                await self.broadcast_online_status_change(user_id, username, False)

    async def send_personal_message(self, user_id: int, message: Dict[str, Any]) -> bool:
        """Send message to specific user"""
        if user_id not in self.active_connections:
            logger.warning(f"Cannot send message to user {user_id} - not connected")
            return False

        websocket = self.active_connections[user_id]["websocket"]
        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending message to user {user_id}: {e}")
            await self.disconnect(user_id)
            return False

    async def send_to_player(self, player_id: int, message: Dict[str, Any]) -> bool:
        """Send message to specific player by player_id"""
        user_id = self.player_to_user.get(player_id)
        if not user_id:
            logger.warning(f"Cannot send message to player {player_id} - not connected (message type: {message.get('type', 'unknown')})")
            return False

        logger.info(f"Sending message to player {player_id} (user {user_id}): {message.get('type', 'unknown')}")
        return await self.send_personal_message(user_id, message)

    async def broadcast(self, message: Dict[str, Any], exclude_user_id: Optional[int] = None):
        """Broadcast message to all connected users"""
        disconnected = []

        for user_id, connection_info in self.active_connections.items():
            if user_id == exclude_user_id:
                continue

            websocket = connection_info["websocket"]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected:
            await self.disconnect(user_id)

    async def broadcast_online_status_change(self, user_id: int, username: str, is_online: bool):
        """Notify all users about online status change"""
        message = {
            "type": "online_status",
            "user_id": user_id,
            "username": username,
            "is_online": is_online,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message, exclude_user_id=user_id)

    async def notify_challenge_received(self, defender_player_id: int, challenger_name: str, duel_id: int, gold_stake: int):
        """Notify defender about new challenge"""
        message = {
            "type": "challenge_received",
            "duel_id": duel_id,
            "challenger_name": challenger_name,
            "gold_stake": gold_stake,
            "timestamp": datetime.utcnow().isoformat()
        }
        success = await self.send_to_player(defender_player_id, message)
        if success:
            logger.info(f"Notified player {defender_player_id} about challenge from {challenger_name}")
        return success

    async def notify_challenge_response(self, challenger_player_id: int, defender_name: str, accepted: bool, duel_id: int):
        """Notify challenger about challenge response"""
        message = {
            "type": "challenge_response",
            "duel_id": duel_id,
            "defender_name": defender_name,
            "accepted": accepted,
            "timestamp": datetime.utcnow().isoformat()
        }
        success = await self.send_to_player(challenger_player_id, message)
        if success:
            action = "accepted" if accepted else "declined"
            logger.info(f"Notified player {challenger_player_id} that {defender_name} {action} challenge")
        return success

    async def notify_challenge_cancelled(self, defender_player_id: int, challenger_name: str, duel_id: int):
        """Notify defender that challenge was cancelled"""
        message = {
            "type": "challenge_cancelled",
            "duel_id": duel_id,
            "challenger_name": challenger_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        success = await self.send_to_player(defender_player_id, message)
        if success:
            logger.info(f"Notified player {defender_player_id} that {challenger_name} cancelled challenge")
        return success

    async def notify_duel_ready(self, player_id: int, duel_id: int, opponent_name: str):
        """Notify player that duel is ready to start"""
        message = {
            "type": "duel_ready",
            "duel_id": duel_id,
            "opponent_name": opponent_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        success = await self.send_to_player(player_id, message)
        if success:
            logger.info(f"Notified player {player_id} that duel {duel_id} is ready")
        return success

    def get_online_count(self) -> int:
        """Get number of currently connected users"""
        return len(self.active_connections)

    def get_online_users(self) -> Set[int]:
        """Get set of online user IDs"""
        return set(self.active_connections.keys())

    def is_user_online(self, user_id: int) -> bool:
        """Check if user is currently connected"""
        return user_id in self.active_connections

    def is_player_online(self, player_id: int) -> bool:
        """Check if player is currently connected"""
        return player_id in self.player_to_user


# Global connection manager instance
manager = ConnectionManager()
