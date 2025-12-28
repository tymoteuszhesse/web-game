from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, List
from sqlalchemy.orm import Session
import json
import structlog
from datetime import datetime
from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player

logger = structlog.get_logger()

router = APIRouter()


class ChatConnectionManager:
    def __init__(self):
        self.active_connections: List[Dict] = []
        self.message_history: List[Dict] = []
        self.max_history = 100  # Keep last 100 messages

    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        """Connect a player to the global chat"""
        await websocket.accept()

        # Remove any existing connections for this user_id (prevents duplicates on reconnect)
        self.active_connections = [
            conn for conn in self.active_connections
            if conn["user_id"] != user_id
        ]

        self.active_connections.append({
            "websocket": websocket,
            "user_id": user_id,
            "username": username
        })

        logger.info("player_connected_to_chat",
                   user_id=user_id,
                   username=username,
                   total_users=len(self.active_connections))

        # Send message history to the newly connected user
        for message in self.message_history:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error("failed_to_send_history", error=str(e))

        # Broadcast online count to all users
        await self.broadcast_online_count()

        # Send join notification
        join_message = {
            "type": "system",
            "message": f"{username} has entered the tavern",
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(join_message)
        self._add_to_history(join_message)

    def disconnect(self, websocket: WebSocket, username: str = None):
        """Disconnect a player from the chat"""
        self.active_connections = [
            conn for conn in self.active_connections
            if conn["websocket"] != websocket
        ]

        logger.info("player_disconnected_from_chat",
                   username=username,
                   total_users=len(self.active_connections))

    def _add_to_history(self, message: dict):
        """Add a message to the history buffer"""
        self.message_history.append(message)
        # Keep only the last max_history messages
        if len(self.message_history) > self.max_history:
            self.message_history = self.message_history[-self.max_history:]

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected users"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection["websocket"].send_json(message)
            except Exception as e:
                logger.error("failed_to_send_message", error=str(e))
                disconnected.append(connection)

        # Remove disconnected clients
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

    async def broadcast_online_count(self):
        """Broadcast the current online user count"""
        await self.broadcast({
            "type": "online_count",
            "count": len(self.active_connections),
            "timestamp": datetime.utcnow().isoformat()
        })


# Global chat manager instance
chat_manager = ChatConnectionManager()


@router.websocket("/ws/chat")
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for global chat
    """
    # Validate token
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return

        # Get player username from database
        player = db.query(Player).filter(Player.user_id == int(user_id)).first()
        if player and player.username:
            username = player.username
        else:
            username = f"Player{user_id}"

    except Exception as e:
        logger.error("chat_auth_failed", error=str(e))
        await websocket.close(code=1008, reason="Authentication failed")
        return

    # Connect the user
    await chat_manager.connect(websocket, user_id, username)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # Add server-side metadata
            message_data["username"] = username
            message_data["userId"] = user_id
            message_data["timestamp"] = datetime.utcnow().isoformat()
            message_data["type"] = "message"

            logger.info("chat_message_received",
                       user_id=user_id,
                       username=username,
                       message=message_data.get("text", "")[:50])

            # Broadcast to all connected users
            await chat_manager.broadcast(message_data)

            # Add to message history
            chat_manager._add_to_history(message_data)

    except WebSocketDisconnect:
        logger.info("chat_websocket_disconnect", user_id=user_id, username=username)
    except Exception as e:
        logger.error("chat_websocket_error", user_id=user_id, error=str(e))
    finally:
        # Disconnect and notify others
        chat_manager.disconnect(websocket, username)
        await chat_manager.broadcast_online_count()
        leave_message = {
            "type": "system",
            "message": f"{username} has left the tavern",
            "timestamp": datetime.utcnow().isoformat()
        }
        await chat_manager.broadcast(leave_message)
        chat_manager._add_to_history(leave_message)
