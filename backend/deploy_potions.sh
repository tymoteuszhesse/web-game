#!/bin/bash
# Deploy potions feature to production

echo "=== Pulling latest code from GitHub ==="
cd /home/webgame/web_game
git fetch origin
git pull origin master
echo ""

echo "=== Activating virtual environment ==="
cd backend
source venv/bin/activate
echo ""

echo "=== Running database migrations ==="
alembic upgrade head
echo ""

echo "=== Restarting service ==="
sudo systemctl restart webgame.service
echo ""

echo "=== Waiting 5 seconds for service to start ==="
sleep 5
echo ""

echo "=== Checking service status ==="
sudo systemctl status webgame.service --no-pager | head -10
echo ""

echo "=== Testing potions API ==="
curl -s http://localhost:8000/api/shop/items 2>&1 | python3 -c "import sys, json; data = json.load(sys.stdin); print('Potions:', len(data.get('potions', [])))"
echo ""

echo "=== Done! ==="
