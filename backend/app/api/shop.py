from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.player import Player
from app.core.security import get_current_active_user
from app.services.shop_service import ShopService
from app.schemas.shop import (
    ShopCatalogResponse,
    PurchaseRequest,
    PurchaseResponse,
    PurchaseHistoryItem
)
import structlog

router = APIRouter()
logger = structlog.get_logger()


@router.get("/items", response_model=ShopCatalogResponse)
async def get_shop_items(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get available shop items catalog

    Returns all shop items organized by category:
    - equipment: Weapons, armor, accessories
    - eggs: Pet eggs
    - food: Pet food items
    """
    try:
        catalog = ShopService.get_shop_catalog()
        return catalog
    except Exception as e:
        logger.error("failed_to_get_shop_catalog", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve shop catalog"
        )


@router.post("/purchase", response_model=PurchaseResponse)
async def purchase_item(
    purchase_req: PurchaseRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Purchase an item from the shop

    Validates:
    - Item exists in catalog
    - Player has sufficient gold/gems
    - Player meets level requirements

    On success:
    - Deducts currency
    - Adds item to inventory/pets
    - Records purchase in history
    """
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Attempt purchase
    success, message, new_item_id = ShopService.purchase_item(
        db=db,
        player=player,
        item_id=purchase_req.item_id,
        use_gems=purchase_req.use_gems
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return PurchaseResponse(
        success=True,
        message=message,
        item_id=new_item_id,
        gold_remaining=player.gold,
        gems_remaining=player.gems
    )


@router.get("/history", response_model=list[PurchaseHistoryItem])
async def get_purchase_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get player's purchase history

    Args:
        limit: Maximum number of purchases to return (default: 50, max: 100)
    """
    # Get player
    player = db.query(Player).filter(Player.user_id == current_user.id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )

    # Limit to max 100
    limit = min(limit, 100)

    # Get purchase history
    history = ShopService.get_purchase_history(db, player, limit)
    return history
