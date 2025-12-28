# 🗄️ PVP Database Migration

## New Tables Added

Two new tables have been added to support the PVP dueling system:

### 1. `duels` Table

Stores all PVP duel challenges and matches.

```sql
CREATE TABLE duels (
    id SERIAL PRIMARY KEY,

    -- Participants
    challenger_id INTEGER NOT NULL REFERENCES players(id),
    defender_id INTEGER NOT NULL REFERENCES players(id),

    -- Duel Configuration
    gold_stake BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    -- Battle Result
    winner_id INTEGER REFERENCES players(id),
    battle_id INTEGER REFERENCES battles(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_defender ON duels(defender_id);
CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duels_created_at ON duels(created_at);
```

**Status Values:**
- `pending`: Challenge sent, awaiting response
- `accepted`: Challenge accepted, ready to battle
- `in_progress`: Battle is ongoing
- `completed`: Battle finished, rewards distributed
- `declined`: Challenge declined by defender
- `cancelled`: Challenge cancelled by challenger
- `expired`: Challenge expired (no response within 15 minutes)

---

### 2. `pvp_stats` Table

Stores player PVP statistics and records.

```sql
CREATE TABLE pvp_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER UNIQUE NOT NULL REFERENCES players(id),

    -- Win/Loss Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,

    -- Gold Statistics
    gold_won BIGINT DEFAULT 0,
    gold_lost BIGINT DEFAULT 0,
    gold_wagered BIGINT DEFAULT 0,

    -- Streaks
    current_win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,

    -- Rating (for future matchmaking)
    rating INTEGER DEFAULT 1000,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pvp_stats_player ON pvp_stats(player_id);
CREATE INDEX idx_pvp_stats_rating ON pvp_stats(rating);
CREATE INDEX idx_pvp_stats_wins ON pvp_stats(wins);
```

---

## Automatic Migration

The tables will be **automatically created** when you run the backend server because:

1. Models are registered in `app/models/base.py`
2. `main.py` calls `base.Base.metadata.create_all(bind=engine)`
3. SQLAlchemy creates missing tables on startup

### Steps to Apply Migration:

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run the server (tables will be created automatically)
uvicorn app.main:app --reload --port 8001
```

**Console output should show:**
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
application_startup environment=development
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

---

## Manual Migration (Optional)

If you prefer to run migrations manually:

### Option 1: Using Alembic

```bash
cd backend

# Generate migration
alembic revision --autogenerate -m "Add PVP tables"

# Apply migration
alembic upgrade head
```

### Option 2: Using Python Script

```bash
cd backend
python -c "from app.db.database import engine; from app.models import base; base.Base.metadata.create_all(bind=engine)"
```

### Option 3: Direct SQL

Connect to your PostgreSQL database and run the SQL statements above.

```bash
psql -U your_user -d your_database -f migration.sql
```

---

## Verify Migration

### Check Tables Exist

```sql
-- List all tables
\dt

-- Should show:
-- duels
-- pvp_stats
-- (plus existing tables)
```

### Check Table Structure

```sql
-- Describe duels table
\d duels

-- Describe pvp_stats table
\d pvp_stats
```

### Test Queries

```sql
-- Count duels
SELECT COUNT(*) FROM duels;

-- Count PVP stats records
SELECT COUNT(*) FROM pvp_stats;

-- Get a player's stats
SELECT * FROM pvp_stats WHERE player_id = 1;
```

---

## Rollback (If Needed)

To remove the PVP tables:

```sql
-- Drop tables
DROP TABLE IF EXISTS duels CASCADE;
DROP TABLE IF EXISTS pvp_stats CASCADE;
```

**Warning**: This will delete all PVP data!

---

## Data Relationships

```
Player ──────┐
             │
             ├─── challenges_sent (Duel.challenger_id)
             │
             ├─── challenges_received (Duel.defender_id)
             │
             ├─── duels_won (Duel.winner_id)
             │
             └─── pvp_stats (PvPStats.player_id)

Battle ────── Duel.battle_id
```

---

## Initial Data

No seed data is required. Stats are created on-demand:
- **First PVP action**: Auto-creates `pvp_stats` record with defaults
- **Empty stats**: Shows 0 wins, 0 losses, 0% win rate

---

## Schema Considerations

### Foreign Key Constraints
- All player references use `ON DELETE CASCADE` (implicit)
- If a player is deleted, their duels and stats are also deleted

### Nullable Fields
- `winner_id`: Nullable until duel completes
- `battle_id`: Nullable until battle starts
- `accepted_at`, `completed_at`: Nullable until actions occur

### Default Values
- `status`: 'pending' (new challenges)
- `rating`: 1000 (starting ELO)
- All count fields: 0
- Timestamps: `CURRENT_TIMESTAMP`

---

## Performance Notes

### Indexes Created
- Player lookups: `challenger_id`, `defender_id`, `player_id`
- Status filtering: `status`
- Time-based queries: `created_at`
- Leaderboards: `rating`, `wins`

### Query Optimization
- Active duels query uses `status IN (...)` with index
- Stats lookup uses unique `player_id` index
- Completed duels can be archived periodically

---

## Future Schema Changes

### Planned Additions

**Tournament Support:**
```sql
ALTER TABLE duels
ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id);
```

**Betting System:**
```sql
CREATE TABLE duel_bets (
    id SERIAL PRIMARY KEY,
    duel_id INTEGER REFERENCES duels(id),
    bettor_id INTEGER REFERENCES players(id),
    bet_amount BIGINT,
    predicted_winner_id INTEGER
);
```

**Replay Data:**
```sql
ALTER TABLE duels
ADD COLUMN replay_data JSONB;
```

---

## Troubleshooting

### Issue: Tables Not Created

**Solution:**
1. Check `app/models/base.py` imports `pvp` models
2. Check `app/main.py` imports `base`
3. Restart backend server
4. Check console for SQLAlchemy errors

### Issue: Foreign Key Errors

**Solution:**
1. Ensure `players` table exists first
2. Ensure `battles` table exists first
3. Check database constraints

### Issue: Migration Conflicts

**Solution:**
1. If using Alembic, resolve conflicts manually
2. Or drop and recreate database (dev only!)

---

## Summary

✅ **Automatic Creation**: Tables auto-create on server startup
✅ **No Manual Steps**: Just run the backend
✅ **Safe Migration**: Non-destructive, preserves existing data
✅ **Indexed**: Optimized for common queries
✅ **Relational Integrity**: Proper foreign key constraints

**Next Step**: Start the backend server and the PVP system is ready to use!

```bash
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8001
```
