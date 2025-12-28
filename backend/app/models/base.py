from app.db.database import Base

# Import all models here to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.player import Player
from app.models.inventory import InventoryItem, EquipmentSet
from app.models.pet import Pet, PetSet
from app.models.battle import Battle, BattleParticipant, BattleEnemy
from app.models.shop import ShopPurchase
from app.models.pvp import Duel, PvPStats

__all__ = [
    "Base",
    "User",
    "Player",
    "InventoryItem",
    "EquipmentSet",
    "Pet",
    "PetSet",
    "Battle",
    "BattleParticipant",
    "BattleEnemy",
    "ShopPurchase",
    "Duel",
    "PvPStats"
]
