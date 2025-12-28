"""
WebSocket API Endpoints for Real-Time PVP Communication
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
import logging

from app.db.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.pvp import Duel
from app.services.websocket_manager import manager
from app.services.pvp_battle_manager import pvp_battle_manager, ActionType

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/pvp")
async def websocket_pvp_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time PVP events

    Client connects with JWT token for authentication
    Receives real-time notifications about:
    - Challenge requests
    - Challenge responses (accept/decline)
    - Duel status updates
    - Online/offline status changes
    """
    user_id = None

    try:
        # Authenticate user from token
        payload = decode_access_token(token)
        if not payload:
            await websocket.close(code=4001, reason="Invalid token")
            return

        user_id_str = payload.get("sub")
        if not user_id_str:
            user_id_str = payload.get("user_id")
        if not user_id_str:
            await websocket.close(code=4001, reason="Invalid token payload")
            return

        # Convert user_id to integer
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            await websocket.close(code=4001, reason="Invalid user ID in token")
            return

        # Get user and player info
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.player:
            await websocket.close(code=4003, reason="User or player not found")
            return

        # Connect to WebSocket manager
        await manager.connect(
            websocket=websocket,
            user_id=user.id,
            player_id=user.player.id,
            username=user.player.username
        )

        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to PVP Arena",
            "player_id": user.player.id,
            "username": user.player.username
        })

        # Keep connection alive and listen for messages
        while True:
            try:
                # Receive messages from client (for heartbeat/ping)
                data = await websocket.receive_text()

                # Handle ping/pong for keepalive
                if data == "ping":
                    await websocket.send_json({"type": "pong"})

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id}")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop for user {user_id}: {e}")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected during setup for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up connection
        if user_id:
            await manager.disconnect(user_id)


@router.websocket("/ws/pvp-battle/{battle_id}")
async def websocket_pvp_battle(
    websocket: WebSocket,
    battle_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time PVP battles

    Handles:
    - Battle state synchronization
    - Combat action submissions
    - Turn resolution
    - Live damage updates
    """
    user_id = None

    try:
        # Authenticate user
        payload = decode_access_token(token)
        if not payload:
            await websocket.close(code=4001, reason="Invalid token")
            return

        user_id_str = payload.get("sub")
        if not user_id_str:
            user_id_str = payload.get("user_id")
        if not user_id_str:
            await websocket.close(code=4001, reason="Invalid token payload")
            return

        # Convert user_id to integer
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            await websocket.close(code=4001, reason="Invalid user ID in token")
            return

        # Get user and player
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.player:
            await websocket.close(code=4003, reason="User or player not found")
            return

        player_id = user.player.id

        # Get battle
        battle = await pvp_battle_manager.get_battle(battle_id)

        # If battle doesn't exist in memory, recreate it from database
        if not battle:
            logger.info(f"Battle {battle_id} not in memory, recreating from database")

            # Find duel by battle_id
            duel = db.query(Duel).filter(Duel.battle_id == battle_id).first()
            if not duel:
                await websocket.close(code=4004, reason="Battle not found in database")
                return

            # Get player data
            challenger = duel.challenger
            defender = duel.defender

            challenger_data = {
                'id': challenger.id,
                'username': challenger.username,
                'level': challenger.level,
                'attack': challenger.calculate_total_attack(),
                'defense': challenger.calculate_total_defense(),
                'max_hp': challenger.base_hp + (challenger.level * 10)
            }

            defender_data = {
                'id': defender.id,
                'username': defender.username,
                'level': defender.level,
                'attack': defender.calculate_total_attack(),
                'defense': defender.calculate_total_defense(),
                'max_hp': defender.base_hp + (defender.level * 10)
            }

            # Recreate battle in memory
            from app.services.pvp_battle_manager import BattleState
            battle = BattleState(
                duel_id=duel.id,
                player1_id=challenger.id,
                player2_id=defender.id,
                player1_data=challenger_data,
                player2_data=defender_data,
                gold_stake=duel.gold_stake
            )
            battle.battle_id = battle_id  # Use existing battle_id

            # Store in battle manager
            pvp_battle_manager.active_battles[battle_id] = battle
            pvp_battle_manager.player_battles[challenger.id] = battle_id
            pvp_battle_manager.player_battles[defender.id] = battle_id

            logger.info(f"Recreated battle {battle_id} for duel {duel.id}")

        # Verify player is in battle
        if not battle.is_player_in_battle(player_id):
            await websocket.close(code=4005, reason="Not a participant")
            return

        await websocket.accept()
        logger.info(f"Player {player_id} connected to battle {battle_id}")

        # Register WebSocket connection
        await pvp_battle_manager.register_connection(battle_id, player_id, websocket)

        # Send current battle state
        await websocket.send_json({
            "type": "battle_state",
            "phase": battle.phase.value,
            "turn": battle.current_turn,
            "your_id": player_id,
            "opponent_id": battle.get_opponent_id(player_id)
        })

        # Listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                import json
                message = json.loads(data)

                message_type = message.get("type")

                if message_type == "ready":
                    # Player is ready to fight
                    await pvp_battle_manager.mark_player_ready(battle_id, player_id)

                elif message_type == "action":
                    # Submit combat action
                    action_str = message.get("action")
                    try:
                        action = ActionType(action_str)
                        await pvp_battle_manager.submit_action(battle_id, player_id, action)
                    except ValueError:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Invalid action: {action_str}"
                        })

                elif message_type == "forfeit":
                    # Player forfeits
                    await pvp_battle_manager.forfeit_battle(battle_id, player_id)
                    break

                elif message_type == "ping":
                    await websocket.send_json({"type": "pong"})

            except WebSocketDisconnect:
                logger.info(f"Player {player_id} disconnected from battle {battle_id}")
                break
            except Exception as e:
                logger.error(f"Error in battle WebSocket for player {player_id}: {e}")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected during setup")
    except Exception as e:
        logger.error(f"WebSocket battle error: {e}")
    finally:
        # Unregister WebSocket connection
        if 'player_id' in locals() and 'battle_id' in locals():
            await pvp_battle_manager.unregister_connection(battle_id, player_id)
        logger.info(f"Battle WebSocket closed for player {player_id if 'player_id' in locals() else 'unknown'}")


@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket server status"""
    return {
        "online_users": manager.get_online_count(),
        "status": "operational"
    }
