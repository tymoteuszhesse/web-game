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
from app.models.chat_message import ChatMessage

logger = structlog.get_logger()

router = APIRouter()


class ChatConnectionManager:
    def __init__(self):
        self.active_connections: List[Dict] = []
        self.max_history = 100  # Keep last 100 messages in memory (deprecated - now using DB)

    async def connect(self, websocket: WebSocket, user_id: int, username: str, db: Session):
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

        # Send persisted message history from database to the newly connected user
        try:
            # Fetch last 100 messages from database
            messages = db.query(ChatMessage).order_by(
                ChatMessage.created_at.desc()
            ).limit(100).all()

            # Send in chronological order (oldest first)
            for message in reversed(messages):
                try:
                    await websocket.send_json(message.to_dict())
                except Exception as e:
                    logger.error("failed_to_send_history", error=str(e))
        except Exception as e:
            logger.error("failed_to_load_chat_history", error=str(e))

        # Broadcast online count to all users
        await self.broadcast_online_count()

        # Send join notification
        join_message = {
            "type": "system",
            "message": f"{username} has entered the tavern",
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(join_message)

        # Persist join message to database
        self._persist_system_message(db, user_id, username, join_message["message"])

    def disconnect(self, websocket: WebSocket, username: str = None):
        """Disconnect a player from the chat"""
        self.active_connections = [
            conn for conn in self.active_connections
            if conn["websocket"] != websocket
        ]

        logger.info("player_disconnected_from_chat",
                   username=username,
                   total_users=len(self.active_connections))

    def _persist_system_message(self, db: Session, user_id: int, username: str, message: str):
        """Persist a system message to the database"""
        try:
            chat_message = ChatMessage(
                user_id=user_id,
                username=username,
                text=message,
                message_type="system"
            )
            db.add(chat_message)
            db.commit()
        except Exception as e:
            logger.error("failed_to_persist_system_message", error=str(e))
            db.rollback()

    def _persist_user_message(self, db: Session, user_id: int, username: str, text: str):
        """Persist a user message to the database"""
        try:
            chat_message = ChatMessage(
                user_id=user_id,
                username=username,
                text=text,
                message_type="message"
            )
            db.add(chat_message)
            db.commit()
            return chat_message
        except Exception as e:
            logger.error("failed_to_persist_user_message", error=str(e))
            db.rollback()
            return None

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
    await chat_manager.connect(websocket, user_id, username, db)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # Extract text from message
            text = message_data.get("text", "")

            # Add server-side metadata
            message_data["username"] = username
            message_data["userId"] = user_id
            message_data["timestamp"] = datetime.utcnow().isoformat()
            message_data["type"] = "message"

            logger.info("chat_message_received",
                       user_id=user_id,
                       username=username,
                       message=text[:50])

            # Persist message to database
            persisted_message = chat_manager._persist_user_message(db, user_id, username, text)

            # If persistence succeeded, use the persisted message data
            if persisted_message:
                message_data = persisted_message.to_dict()

            # Broadcast to all connected users
            await chat_manager.broadcast(message_data)

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

        # Persist leave message to database
        chat_manager._persist_system_message(db, user_id, username, leave_message["message"])
