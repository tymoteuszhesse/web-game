#!/bin/bash
# Fix migration issue on production server

echo "=== Migration Fix Script ==="
echo "This script will:"
echo "1. Check current migration state"
echo "2. Stamp intermediate migrations as applied"
echo "3. Run only the chat_messages and battle_logs migration"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/alembic.ini" ]; then
    echo "Error: Must be run from web_game directory"
    exit 1
fi

cd backend

# Activate virtual environment
source venv/bin/activate

echo "Current migration state:"
alembic current

echo ""
echo "Available migrations:"
alembic history

echo ""
echo "Marking intermediate migrations as applied (stamping)..."
# Stamp to the migration just before chat_messages
alembic stamp 0eb7e7c62d47

echo ""
echo "Running new migration for chat_messages and battle_logs..."
alembic upgrade head

echo ""
echo "Final migration state:"
alembic current

echo ""
echo "Done! Battles should now work correctly."
