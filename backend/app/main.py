from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine
from app.models import base
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()

# Create database tables
base.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Web Game API",
    description="Multiplayer Web Game Backend API",
    version="1.0.0"
)

# Configure CORS
# Allow file:// protocol for local development
cors_origins = settings.cors_origins_list + ["null"]  # "null" is the origin for file:// protocol
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("application_startup", environment=settings.ENVIRONMENT)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("application_shutdown")


@app.get("/")
async def root():
    return {
        "message": "Web Game API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }


# Import and include routers
from app.api import auth, player, inventory, pets, shop, battles, debug, dev, pvp, websocket as pvp_websocket, chat

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(player.router, prefix="/api/player", tags=["Player"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(pets.router, prefix="/api/pets", tags=["Pets"])
app.include_router(shop.router, prefix="/api/shop", tags=["Shop"])
app.include_router(battles.router, prefix="/api/battles", tags=["Battles"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(pvp.router, prefix="/api", tags=["PVP"])
app.include_router(debug.router, prefix="/api", tags=["Debug"])
app.include_router(dev.router, prefix="/api/dev", tags=["Development"])

# Include WebSocket
from app.websocket import battle_ws, chat_ws
app.include_router(battle_ws.router)
app.include_router(chat_ws.router)
app.include_router(pvp_websocket.router, prefix="/api", tags=["WebSocket"])
