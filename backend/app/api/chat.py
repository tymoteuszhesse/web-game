from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.core.security import get_current_active_user
from pydantic import BaseModel
from datetime import datetime
import structlog

router = APIRouter()
logger = structlog.get_logger()


class ChatMessageResponse(BaseModel):
    """Chat message response schema"""
    id: int
    userId: int
    username: str
    text: str
    type: str
    timestamp: str

    class Config:
        from_attributes = True


@router.get("/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get chat message history

    Returns last N messages in chronological order (oldest to newest)
    """
    try:
        # Fetch messages from database
        messages = db.query(ChatMessage).order_by(
            ChatMessage.created_at.desc()
        ).limit(limit).offset(offset).all()

        # Convert to response format (reverse to get chronological order)
        result = []
        for msg in reversed(messages):
            result.append(ChatMessageResponse(
                id=msg.id,
                userId=msg.user_id,
                username=msg.username,
                text=msg.text,
                type=msg.message_type,
                timestamp=msg.created_at.isoformat()
            ))

        return result

    except Exception as e:
        logger.error("failed_to_fetch_chat_history", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat history"
        )
