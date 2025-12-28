#!/bin/bash

# PVP Testing Quick Start Script

echo "============================================================"
echo "⚔️  PVP Arena Testing - Quick Start"
echo "============================================================"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    echo "   Please run this script from the project root"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "   Please create venv first: cd backend && python -m venv venv"
    exit 1
fi

echo "📋 Available Test Accounts:"
echo ""
echo "  1. dragon@test.com      (Lv.30 - DragonSlayer)"
echo "  2. warrior@test.com     (Lv.25 - WarriorKing)"
echo "  3. mage@test.com        (Lv.22 - MageQueen)"
echo "  4. paladin@test.com     (Lv.28 - PaladinLight)"
echo ""
echo "  All passwords: test123"
echo ""
echo "============================================================"
echo ""

# Start backend
echo "🚀 Starting backend server..."
echo ""

cd backend || exit

# Activate virtual environment and start server
source venv/bin/activate

echo "✅ Backend starting on http://localhost:8001"
echo ""
echo "📝 Next Steps:"
echo ""
echo "  1. Open index.html in your browser"
echo "  2. Login with: warrior@test.com / test123"
echo "  3. Click 'PVP Arena — Dueling' on dashboard"
echo "  4. Open another browser (incognito) with: mage@test.com / test123"
echo "  5. Challenge each other!"
echo ""
echo "  📚 See TEST_ACCOUNTS.md for all available accounts"
echo ""
echo "============================================================"
echo "🎮 Backend Ready! Press Ctrl+C to stop"
echo "============================================================"
echo ""

# Start the server
uvicorn app.main:app --reload --port 8001
