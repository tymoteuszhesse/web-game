#!/usr/bin/env python3
"""
Create multiple test users for PVP testing
"""
import sys
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.user import User
from app.models.player import Player
from app.core.security import get_password_hash
import random


def create_test_user(db: Session, username: str, email: str, password: str, level: int = None):
    """Create a test user with random stats"""

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"❌ User {email} already exists. Skipping...")
        return None

    # Create user (username is stored in Player, not User)
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        is_active=True
    )
    db.add(user)
    db.flush()  # Get user.id

    # Random stats based on level
    if level is None:
        level = random.randint(1, 30)

    base_attack = 10 + (level - 1) * 2
    base_defense = 10 + (level - 1) * 2

    # Add some randomness
    base_attack += random.randint(-5, 10)
    base_defense += random.randint(-5, 10)

    # Calculate exp for level
    exp_max = 100 * (level ** 1.5)
    current_exp = random.randint(0, int(exp_max * 0.8))

    # Gold based on level
    gold = random.randint(1000, 5000) + (level * 500)

    # Create player
    player = Player(
        user_id=user.id,
        username=username,
        level=level,
        exp=int(current_exp),
        exp_max=int(exp_max),
        gold=gold,
        gems=random.randint(0, 500),
        stamina=100,
        stamina_max=100,
        base_attack=base_attack,
        base_defense=base_defense,
        base_hp=100 + (level * 5),
        unspent_stat_points=level - 1
    )
    db.add(player)

    try:
        db.commit()
        print(f"✅ Created user: {username}")
        print(f"   📧 Email: {email}")
        print(f"   🔑 Password: {password}")
        print(f"   ⚡ Level: {level}")
        print(f"   ⚔️  Attack: {base_attack}")
        print(f"   🛡️  Defense: {base_defense}")
        print(f"   💰 Gold: {gold:,}")
        print()
        return user
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating user {username}: {e}")
        return None


def main():
    print("=" * 60)
    print("🎮 PVP Test Users Creator")
    print("=" * 60)
    print()

    db = SessionLocal()

    try:
        # Define test users with different power levels
        test_users = [
            {
                "username": "WarriorKing",
                "email": "warrior@test.com",
                "password": "test123",
                "level": 25
            },
            {
                "username": "MageQueen",
                "email": "mage@test.com",
                "password": "test123",
                "level": 22
            },
            {
                "username": "RogueNinja",
                "email": "rogue@test.com",
                "password": "test123",
                "level": 20
            },
            {
                "username": "PaladinLight",
                "email": "paladin@test.com",
                "password": "test123",
                "level": 28
            },
            {
                "username": "DragonSlayer",
                "email": "dragon@test.com",
                "password": "test123",
                "level": 30
            },
            {
                "username": "NecroLord",
                "email": "necro@test.com",
                "password": "test123",
                "level": 18
            },
            {
                "username": "ArcherElf",
                "email": "archer@test.com",
                "password": "test123",
                "level": 15
            },
            {
                "username": "BerserkerOrc",
                "email": "berserker@test.com",
                "password": "test123",
                "level": 27
            }
        ]

        print(f"Creating {len(test_users)} test users...\n")

        created_count = 0
        for user_data in test_users:
            result = create_test_user(db, **user_data)
            if result:
                created_count += 1

        print("=" * 60)
        print(f"✨ Summary: {created_count}/{len(test_users)} users created")
        print("=" * 60)
        print()
        print("🎯 Quick Test Guide:")
        print()
        print("1. Start backend server:")
        print("   cd backend && uvicorn app.main:app --reload --port 8001")
        print()
        print("2. Open frontend (index.html)")
        print()
        print("3. Login with any test account:")
        print("   📧 warrior@test.com / 🔑 test123")
        print("   📧 mage@test.com / 🔑 test123")
        print("   📧 rogue@test.com / 🔑 test123")
        print("   (etc...)")
        print()
        print("4. Navigate to PVP Arena from dashboard")
        print()
        print("5. Open another browser/tab, login with different account")
        print()
        print("6. Challenge each other!")
        print()
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
