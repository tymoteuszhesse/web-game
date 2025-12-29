#!/bin/bash
# Verification script to check deployment status

echo "=== Checking Git Status ==="
cd /home/webgame/web_game
echo "Current commit:"
git log -1 --oneline
echo ""
echo "Latest remote commit:"
git fetch origin
git log origin/master -1 --oneline
echo ""

echo "=== Checking if potions are in shop service ==="
grep -c "potion_stamina_small" backend/app/services/shop_service.py || echo "NOT FOUND - Need to pull latest code!"
echo ""

echo "=== Checking if buff model exists ==="
ls -la backend/app/models/buff.py 2>/dev/null || echo "NOT FOUND - Need to pull latest code!"
echo ""

echo "=== Checking Alembic Migration Status ==="
cd backend
source venv/bin/activate
alembic current
echo ""

echo "=== Checking Service Status ==="
sudo systemctl status webgame --no-pager | head -10
echo ""

echo "=== Checking for Python Import Errors ==="
sudo journalctl -u webgame.service -n 100 --no-pager | grep -i error | tail -20
