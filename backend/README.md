# Web Game Backend API

Production-ready multiplayer game backend built with FastAPI, PostgreSQL, and WebSockets.

## Features

- **User Authentication**: JWT-based auth with email/password
- **Player Progression**: Leveling, XP, stats allocation
- **Inventory System**: Equipment, items, rarity tiers
- **Pet System**: Pet collection, hatching, feeding, equipment
- **Battle System**: Real-time cooperative battles via WebSocket
- **Shop System**: Purchase items, equipment, pet eggs
- **Resource Management**: Gold, gems, stamina with auto-regeneration
- **Real-time Communication**: WebSocket support for live battles

## Tech Stack

- **Framework**: FastAPI 0.109.0
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **WebSocket**: Native FastAPI WebSocket support
- **Migrations**: Alembic
- **Logging**: Structlog (JSON logging)

## Project Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── versions/           # Migration scripts
│   └── env.py             # Alembic configuration
├── app/
│   ├── api/               # API endpoints
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── player.py      # Player management
│   │   ├── inventory.py   # Inventory management
│   │   ├── pets.py        # Pet system
│   │   ├── shop.py        # Shop purchases
│   │   └── battles.py     # Battle system
│   ├── core/              # Core functionality
│   │   ├── config.py      # Configuration settings
│   │   └── security.py    # Auth & password hashing
│   ├── db/                # Database
│   │   └── database.py    # DB connection & session
│   ├── models/            # SQLAlchemy models
│   │   ├── user.py
│   │   ├── player.py
│   │   ├── inventory.py
│   │   ├── pet.py
│   │   ├── battle.py
│   │   └── shop.py
│   ├── schemas/           # Pydantic schemas
│   │   ├── auth.py
│   │   └── player.py
│   ├── services/          # Business logic (future)
│   ├── websocket/         # WebSocket handlers
│   │   └── battle_ws.py   # Real-time battle system
│   └── main.py            # FastAPI application
├── .env.example           # Environment variables template
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 15 or higher
- pip and virtualenv

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure PostgreSQL

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE web_game;

# Create user (optional)
CREATE USER web_game_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE web_game TO web_game_user;
```

### 4. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Required environment variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/web_game
SECRET_KEY=<generate-with-openssl-rand-hex-32>
```

Generate a secure SECRET_KEY:

```bash
openssl rand -hex 32
```

### 5. Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Run Development Server

```bash
# Run with uvicorn (development)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the Python module
python -m uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (client-side token deletion)

### Player

- `GET /api/player/me` - Get current player profile
- `POST /api/player/allocate-stats` - Allocate stat points
- `POST /api/player/regenerate-stamina` - Trigger stamina regen

### Inventory

- `GET /api/inventory/` - Get player inventory
- `POST /api/inventory/equip/{item_id}` - Equip item
- `POST /api/inventory/unequip/{slot}` - Unequip item

### Pets

- `GET /api/pets/` - Get pet collection
- `POST /api/pets/hatch/{egg_id}` - Hatch pet egg
- `POST /api/pets/feed/{pet_id}` - Feed pet
- `POST /api/pets/equip/{pet_id}` - Equip pet to set

### Shop

- `GET /api/shop/items` - Get shop inventory
- `POST /api/shop/purchase` - Purchase item

### Battles

- `GET /api/battles/available` - Get available battles
- `POST /api/battles/join/{battle_id}` - Join battle
- `POST /api/battles/attack/{battle_id}` - Attack enemy
- `POST /api/battles/claim-loot/{battle_id}` - Claim rewards
- `GET /api/battles/history` - Get battle history

### WebSocket

- `WS /ws/battle/{battle_id}?token={jwt_token}` - Real-time battle updates

## WebSocket Usage

Connect to battle rooms for real-time updates:

```javascript
const token = "your-jwt-token";
const battleId = 1;
const ws = new WebSocket(`ws://localhost:8000/ws/battle/${battleId}?token=${token}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Battle update:', data);
};

// Send attack
ws.send(JSON.stringify({
  type: "attack",
  damage: 100,
  enemy_id: 1,
  timestamp: Date.now()
}));
```

### WebSocket Message Types

**Receive:**
- `connected` - Successfully connected to battle
- `player_joined` - Another player joined
- `player_left` - Player disconnected
- `attack` - Player attacked enemy
- `enemy_defeated` - Enemy was defeated
- `chat` - Chat message

**Send:**
- `attack` - Send attack action
- `chat` - Send chat message

## Development

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions including:

- VPS setup (Ubuntu/Debian)
- PostgreSQL configuration
- Nginx reverse proxy
- SSL/TLS certificates
- Systemd service setup
- Gunicorn + Uvicorn workers
- Database backups
- Monitoring setup

## Security Features

- **Password Hashing**: Bcrypt with salt
- **JWT Tokens**: Secure token-based authentication
- **CORS**: Configurable allowed origins
- **Rate Limiting**: TODO - Add rate limiting middleware
- **Input Validation**: Pydantic schema validation
- **SQL Injection Protection**: SQLAlchemy ORM parameterized queries

## Performance Considerations

- **Connection Pooling**: PostgreSQL connection pool (20 connections + 10 overflow)
- **Database Indexes**: Indexed on user emails, player IDs, battle IDs
- **Stamina Regen**: Optimized time-based regeneration (no background jobs needed)
- **WebSocket**: Efficient broadcast to battle rooms only

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| SECRET_KEY | Yes | - | JWT signing key (use openssl rand -hex 32) |
| ALGORITHM | No | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | No | 10080 | Token expiry (7 days) |
| HOST | No | 0.0.0.0 | Server host |
| PORT | No | 8000 | Server port |
| ENVIRONMENT | No | development | Environment (development/production) |
| CORS_ORIGINS | No | localhost:5173 | Comma-separated allowed origins |
| STAMINA_REGEN_INTERVAL | No | 10 | Stamina regen interval (seconds) |
| STAMINA_REGEN_PERCENT | No | 0.1 | Stamina regen percentage (10%) |

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d web_game

# Verify DATABASE_URL in .env
```

### Migration Issues

```bash
# Drop all tables and recreate (DEV ONLY!)
alembic downgrade base
alembic upgrade head

# Check current migration version
alembic current
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

## Next Steps

1. Implement remaining game logic (inventory, pets, shop, battles)
2. Add comprehensive unit tests
3. Implement rate limiting middleware
4. Add error tracking (Sentry)
5. Set up CI/CD pipeline
6. Deploy to production VPS
7. Configure monitoring and alerts

## License

Proprietary - All rights reserved
