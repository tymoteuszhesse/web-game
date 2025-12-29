"""
Shop Service Layer
Handles shop business logic including item catalog, purchases, and validation
"""
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
import structlog
import uuid

from app.models.player import Player
from app.models.inventory import InventoryItem
from app.models.pet import Pet
from app.models.shop import ShopPurchase
from app.schemas.shop import (
    ShopEquipmentItem,
    ShopEggItem,
    ShopFoodItem,
    ShopPotionItem,
    ShopItemStats,
    ShopCatalogResponse,
    PurchaseHistoryItem
)

logger = structlog.get_logger()


class ShopService:
    """Service for shop operations"""

    @staticmethod
    def get_shop_catalog() -> ShopCatalogResponse:
        """
        Get the complete shop catalog with all available items
        This is a static catalog that matches the frontend shopData.js
        """
        equipment_items = [
            # === BOWS (Common to Legendary) ===
            ShopEquipmentItem(id="bow_1", name="Wooden Training Bow", type="WEAPON", rarity="COMMON", level=1, stats=ShopItemStats(attack=12, defense=0, hp=0), price=80, description="A simple wooden bow for beginners", icon="Icon1.png"),
            ShopEquipmentItem(id="bow_2", name="Hunter's Short Bow", type="WEAPON", rarity="COMMON", level=2, stats=ShopItemStats(attack=18, defense=0, hp=0), price=120, description="Reliable bow for hunting small game", icon="Icon2.png"),
            ShopEquipmentItem(id="bow_3", name="Recurve Bow", type="WEAPON", rarity="COMMON", level=3, stats=ShopItemStats(attack=24, defense=0, hp=0), price=180, description="Curved limbs provide extra power", icon="Icon3.png"),
            ShopEquipmentItem(id="bow_4", name="Composite Bow", type="WEAPON", rarity="UNCOMMON", level=5, stats=ShopItemStats(attack=32, defense=0, hp=0), price=280, description="Made from multiple materials for flexibility", icon="Icon4.png"),
            ShopEquipmentItem(id="bow_5", name="Longbow of the Forest", type="WEAPON", rarity="UNCOMMON", level=7, stats=ShopItemStats(attack=40, defense=0, hp=0), price=420, description="Favored by elven rangers", icon="Icon5.png"),
            ShopEquipmentItem(id="bow_6", name="Ironwood Warbow", type="WEAPON", rarity="UNCOMMON", level=9, stats=ShopItemStats(attack=48, defense=0, hp=0), price=600, description="Crafted from ancient ironwood", icon="Icon6.png"),
            ShopEquipmentItem(id="bow_7", name="Silver-Strung Bow", type="WEAPON", rarity="RARE", level=12, stats=ShopItemStats(attack=58, defense=0, hp=0), price=850, description="Bowstring woven with silver thread", icon="Icon7.png"),
            ShopEquipmentItem(id="bow_8", name="Flameheart Bow", type="WEAPON", rarity="RARE", level=15, stats=ShopItemStats(attack=70, defense=0, hp=0), price=1200, description="Arrows burst into flames on impact", icon="Icon8.png"),
            ShopEquipmentItem(id="bow_9", name="Frostwind Bow", type="WEAPON", rarity="RARE", level=18, stats=ShopItemStats(attack=84, defense=0, hp=0), price=1600, description="Freezes enemies with each shot", icon="Icon9.png"),
            ShopEquipmentItem(id="bow_10", name="Storm Caller", type="WEAPON", rarity="EPIC", level=22, stats=ShopItemStats(attack=100, defense=0, hp=0), price=2200, description="Summons lightning with every arrow", icon="Icon10.png"),
            ShopEquipmentItem(id="bow_11", name="Dragon Spine Bow", type="WEAPON", rarity="EPIC", level=26, stats=ShopItemStats(attack=118, defense=0, hp=0), price=3000, description="Forged from dragon vertebrae", icon="Icon11.png"),
            ShopEquipmentItem(id="bow_12", name="Shadowstrike Bow", type="WEAPON", rarity="EPIC", level=30, stats=ShopItemStats(attack=138, defense=0, hp=0), price=4000, description="Arrows phase through armor", icon="Icon12.png"),
            ShopEquipmentItem(id="bow_13", name="Phoenix Wing Bow", type="WEAPON", rarity="LEGENDARY", level=35, stats=ShopItemStats(attack=160, defense=0, hp=0), price=6000, description="Reborn from phoenix flames", icon="Icon13.png"),
            ShopEquipmentItem(id="bow_14", name="Starfall Longbow", type="WEAPON", rarity="LEGENDARY", level=40, stats=ShopItemStats(attack=185, defense=0, hp=0), price=8500, description="Arrows rain down like falling stars", icon="Icon14.png"),
            ShopEquipmentItem(id="bow_15", name="Celestial Moonbow", type="WEAPON", rarity="LEGENDARY", level=45, stats=ShopItemStats(attack=212, defense=0, hp=0), price=12000, description="Blessed by the moon goddess", icon="Icon15.png"),
            ShopEquipmentItem(id="bow_16", name="Worldbreaker Bow", type="WEAPON", rarity="LEGENDARY", level=50, stats=ShopItemStats(attack=250, defense=0, hp=0), price=18000, description="An ancient weapon of immense power", icon="Icon16.png"),

            # === CROSSBOWS (Common to Legendary) ===
            ShopEquipmentItem(id="crossbow_17", name="Light Crossbow", type="WEAPON", rarity="COMMON", level=1, stats=ShopItemStats(attack=14, defense=0, hp=0), price=90, description="Easy to use, reliable design", icon="Icon17.png"),
            ShopEquipmentItem(id="crossbow_18", name="Scout's Crossbow", type="WEAPON", rarity="COMMON", level=2, stats=ShopItemStats(attack=20, defense=0, hp=0), price=130, description="Compact and portable", icon="Icon18.png"),
            ShopEquipmentItem(id="crossbow_19", name="Hunting Crossbow", type="WEAPON", rarity="COMMON", level=3, stats=ShopItemStats(attack=26, defense=0, hp=0), price=190, description="Accurate for medium range", icon="Icon19.png"),
            ShopEquipmentItem(id="crossbow_20", name="Steel Crossbow", type="WEAPON", rarity="UNCOMMON", level=5, stats=ShopItemStats(attack=35, defense=0, hp=0), price=300, description="Reinforced steel construction", icon="Icon20.png"),
            ShopEquipmentItem(id="crossbow_21", name="Repeating Crossbow", type="WEAPON", rarity="UNCOMMON", level=7, stats=ShopItemStats(attack=42, defense=0, hp=0), price=450, description="Fires multiple bolts rapidly", icon="Icon21.png"),
            ShopEquipmentItem(id="crossbow_22", name="Heavy War Crossbow", type="WEAPON", rarity="UNCOMMON", level=9, stats=ShopItemStats(attack=50, defense=0, hp=0), price=620, description="Devastating piercing power", icon="Icon22.png"),
            ShopEquipmentItem(id="crossbow_23", name="Siege Arbalest", type="WEAPON", rarity="RARE", level=12, stats=ShopItemStats(attack=62, defense=0, hp=0), price=900, description="Used to breach castle walls", icon="Icon23.png"),
            ShopEquipmentItem(id="crossbow_24", name="Vampire Hunter's Crossbow", type="WEAPON", rarity="RARE", level=15, stats=ShopItemStats(attack=75, defense=0, hp=0), price=1300, description="Silver-tipped bolts for undead", icon="Icon24.png"),
            ShopEquipmentItem(id="crossbow_25", name="Poisoned Bolt Launcher", type="WEAPON", rarity="RARE", level=18, stats=ShopItemStats(attack=88, defense=0, hp=0), price=1700, description="Bolts coated in deadly toxins", icon="Icon25.png"),
            ShopEquipmentItem(id="crossbow_26", name="Dwarven Thunder Crossbow", type="WEAPON", rarity="EPIC", level=22, stats=ShopItemStats(attack=105, defense=0, hp=0), price=2400, description="Explosive bolts shake the earth", icon="Icon26.png"),
            ShopEquipmentItem(id="crossbow_27", name="Demon Slayer Arbalest", type="WEAPON", rarity="EPIC", level=26, stats=ShopItemStats(attack=124, defense=0, hp=0), price=3200, description="Blessed to banish demons", icon="Icon27.png"),
            ShopEquipmentItem(id="crossbow_28", name="Void Piercer", type="WEAPON", rarity="EPIC", level=30, stats=ShopItemStats(attack=145, defense=0, hp=0), price=4200, description="Bolts tear through reality itself", icon="Icon28.png"),
            ShopEquipmentItem(id="crossbow_29", name="Dragonslayer Ballista", type="WEAPON", rarity="LEGENDARY", level=35, stats=ShopItemStats(attack=168, defense=0, hp=0), price=6500, description="Designed to fell dragons", icon="Icon29.png"),
            ShopEquipmentItem(id="crossbow_30", name="Eclipse Crossbow", type="WEAPON", rarity="LEGENDARY", level=40, stats=ShopItemStats(attack=195, defense=0, hp=0), price=9000, description="Harnesses solar and lunar power", icon="Icon30.png"),
            ShopEquipmentItem(id="crossbow_31", name="Godkiller Arbalest", type="WEAPON", rarity="LEGENDARY", level=45, stats=ShopItemStats(attack=220, defense=0, hp=0), price=13000, description="Forged to challenge the divine", icon="Icon31.png"),
            ShopEquipmentItem(id="crossbow_32", name="Infinity Crossbow", type="WEAPON", rarity="LEGENDARY", level=50, stats=ShopItemStats(attack=260, defense=0, hp=0), price=20000, description="Unlimited power in mortal hands", icon="Icon32.png"),

            # === EXOTIC RANGED WEAPONS ===
            ShopEquipmentItem(id="exotic_33", name="Chakram of Winds", type="WEAPON", rarity="RARE", level=15, stats=ShopItemStats(attack=72, defense=0, hp=0), price=1250, description="Returning throwing disc", icon="Icon33.png"),
            ShopEquipmentItem(id="exotic_34", name="Throwing Axes Set", type="WEAPON", rarity="RARE", level=18, stats=ShopItemStats(attack=86, defense=0, hp=0), price=1650, description="Set of 6 balanced throwing axes", icon="Icon34.png"),
            ShopEquipmentItem(id="exotic_35", name="Boomerang of the Outback", type="WEAPON", rarity="EPIC", level=22, stats=ShopItemStats(attack=103, defense=0, hp=0), price=2300, description="Always returns to thrower", icon="Icon35.png"),
            ShopEquipmentItem(id="exotic_36", name="Shuriken Storm", type="WEAPON", rarity="EPIC", level=26, stats=ShopItemStats(attack=120, defense=0, hp=0), price=3100, description="Endless supply of throwing stars", icon="Icon36.png"),
            ShopEquipmentItem(id="exotic_37", name="Gungnir's Echo", type="WEAPON", rarity="LEGENDARY", level=40, stats=ShopItemStats(attack=190, defense=0, hp=0), price=8800, description="Throwing spear that never misses", icon="Icon37.png"),
            ShopEquipmentItem(id="exotic_38", name="Mjolnir's Thunder", type="WEAPON", rarity="LEGENDARY", level=45, stats=ShopItemStats(attack=218, defense=0, hp=0), price=12500, description="Returning hammer of thunder", icon="Icon38.png"),

            # === SPECIAL MAGICAL RANGED ===
            ShopEquipmentItem(id="magic_39", name="Wand of Arcane Missiles", type="WEAPON", rarity="UNCOMMON", level=8, stats=ShopItemStats(attack=45, defense=0, hp=0), price=550, description="Launches magical projectiles", icon="Icon39.png"),
            ShopEquipmentItem(id="magic_40", name="Staff of Lightning Bolts", type="WEAPON", rarity="RARE", level=16, stats=ShopItemStats(attack=78, defense=0, hp=0), price=1400, description="Channels pure electricity", icon="Icon40.png"),
            ShopEquipmentItem(id="magic_41", name="Orb of Dark Energy", type="WEAPON", rarity="EPIC", level=24, stats=ShopItemStats(attack=112, defense=0, hp=0), price=2800, description="Launches spheres of shadow", icon="Icon41.png"),
            ShopEquipmentItem(id="magic_42", name="Scepter of Firestorms", type="WEAPON", rarity="EPIC", level=28, stats=ShopItemStats(attack=132, defense=0, hp=0), price=3800, description="Rains fire from the heavens", icon="Icon42.png"),
            ShopEquipmentItem(id="magic_43", name="Tome of Eldritch Blast", type="WEAPON", rarity="LEGENDARY", level=38, stats=ShopItemStats(attack=178, defense=0, hp=0), price=7500, description="Ancient spellbook of destruction", icon="Icon43.png"),
            ShopEquipmentItem(id="magic_44", name="Crystal of Cosmic Power", type="WEAPON", rarity="LEGENDARY", level=48, stats=ShopItemStats(attack=235, defense=0, hp=0), price=16000, description="Harnesses the power of stars", icon="Icon44.png"),

            # === LEGENDARY ULTIMATE RANGED ===
            ShopEquipmentItem(id="ultimate_45", name="Artemis' Divine Bow", type="WEAPON", rarity="LEGENDARY", level=50, stats=ShopItemStats(attack=245, defense=0, hp=0), price=17500, description="Bow of the hunt goddess", icon="Icon45.png"),
            ShopEquipmentItem(id="ultimate_46", name="Chronos Crossbow", type="WEAPON", rarity="LEGENDARY", level=50, stats=ShopItemStats(attack=255, defense=0, hp=0), price=19000, description="Bolts that bend time itself", icon="Icon46.png"),
            ShopEquipmentItem(id="ultimate_47", name="Apocalypse Longbow", type="WEAPON", rarity="LEGENDARY", level=50, stats=ShopItemStats(attack=265, defense=0, hp=0), price=21000, description="Herald of the end times", icon="Icon47.png"),
            ShopEquipmentItem(id="ultimate_48", name="Ragnarok's Final Shot", type="WEAPON", rarity="LEGENDARY", level=50, stats=ShopItemStats(attack=280, defense=0, hp=0), price=25000, description="The arrow that ends worlds", icon="Icon48.png"),

            # === HELMETS ===
            ShopEquipmentItem(
                id="shop_helmet_common_1",
                name="Leather Cap",
                type="HELMET",
                rarity="COMMON",
                level=1,
                stats=ShopItemStats(attack=0, defense=10, hp=50),
                price=100,
                description="Simple leather headgear"
            ),
            ShopEquipmentItem(
                id="shop_helmet_uncommon_1",
                name="Iron Helmet",
                type="HELMET",
                rarity="UNCOMMON",
                level=5,
                stats=ShopItemStats(attack=5, defense=25, hp=100),
                price=250,
                description="Solid iron protection"
            ),
            ShopEquipmentItem(
                id="shop_helmet_rare_1",
                name="Knight's Helm",
                type="HELMET",
                rarity="RARE",
                level=10,
                stats=ShopItemStats(attack=10, defense=45, hp=200),
                price=700,
                description="Worn by royal knights"
            ),
            ShopEquipmentItem(
                id="shop_helmet_epic_1",
                name="Dragon Scale Crown",
                type="HELMET",
                rarity="EPIC",
                level=20,
                stats=ShopItemStats(attack=20, defense=80, hp=400),
                price=2200,
                description="Crown adorned with dragon scales"
            ),

            # === ARMOR ===
            ShopEquipmentItem(
                id="shop_armor_common_1",
                name="Cloth Robe",
                type="ARMOR",
                rarity="COMMON",
                level=1,
                stats=ShopItemStats(attack=0, defense=20, hp=100),
                price=150,
                description="Basic cloth protection"
            ),
            ShopEquipmentItem(
                id="shop_armor_uncommon_1",
                name="Leather Armor",
                type="ARMOR",
                rarity="UNCOMMON",
                level=5,
                stats=ShopItemStats(attack=0, defense=45, hp=250),
                price=400,
                description="Flexible leather armor"
            ),
            ShopEquipmentItem(
                id="shop_armor_rare_1",
                name="Chainmail Vest",
                type="ARMOR",
                rarity="RARE",
                level=10,
                stats=ShopItemStats(attack=0, defense=75, hp=500),
                price=1000,
                description="Interlocking metal rings"
            ),
            ShopEquipmentItem(
                id="shop_armor_epic_1",
                name="Platemail of Valor",
                type="ARMOR",
                rarity="EPIC",
                level=20,
                stats=ShopItemStats(attack=0, defense=130, hp=1000),
                price=3000,
                description="Heavy plate armor for heroes"
            ),
            ShopEquipmentItem(
                id="shop_armor_legendary_1",
                name="Celestial Aegis",
                type="ARMOR",
                rarity="LEGENDARY",
                level=50,
                stats=ShopItemStats(attack=0, defense=280, hp=2500),
                price=18000,
                description="Divine protection from the heavens"
            ),

            # === BOOTS ===
            ShopEquipmentItem(
                id="shop_boots_common_1",
                name="Cloth Shoes",
                type="BOOTS",
                rarity="COMMON",
                level=1,
                stats=ShopItemStats(attack=0, defense=8, hp=40),
                price=80,
                description="Simple cloth footwear"
            ),
            ShopEquipmentItem(
                id="shop_boots_uncommon_1",
                name="Leather Boots",
                type="BOOTS",
                rarity="UNCOMMON",
                level=5,
                stats=ShopItemStats(attack=0, defense=20, hp=100),
                price=200,
                description="Sturdy leather boots"
            ),
            ShopEquipmentItem(
                id="shop_boots_rare_1",
                name="Ironshod Boots",
                type="BOOTS",
                rarity="RARE",
                level=10,
                stats=ShopItemStats(attack=5, defense=35, hp=180),
                price=600,
                description="Reinforced with iron plating"
            ),

            # === GLOVES ===
            ShopEquipmentItem(
                id="shop_gloves_common_1",
                name="Cloth Gloves",
                type="GLOVES",
                rarity="COMMON",
                level=1,
                stats=ShopItemStats(attack=8, defense=5, hp=30),
                price=80,
                description="Basic hand protection"
            ),
            ShopEquipmentItem(
                id="shop_gloves_uncommon_1",
                name="Leather Gauntlets",
                type="GLOVES",
                rarity="UNCOMMON",
                level=5,
                stats=ShopItemStats(attack=18, defense=12, hp=80),
                price=220,
                description="Grip-enhanced leather gloves"
            ),
            ShopEquipmentItem(
                id="shop_gloves_rare_1",
                name="Steel Gauntlets",
                type="GLOVES",
                rarity="RARE",
                level=10,
                stats=ShopItemStats(attack=35, defense=25, hp=150),
                price=650,
                description="Heavy steel gauntlets"
            ),
            ShopEquipmentItem(
                id="shop_gloves_epic_1",
                name="Dragonhide Grips",
                type="GLOVES",
                rarity="EPIC",
                level=20,
                stats=ShopItemStats(attack=65, defense=45, hp=300),
                price=2000,
                description="Made from dragon hide"
            ),

            # === RINGS ===
            ShopEquipmentItem(
                id="shop_ring_common_1",
                name="Copper Ring",
                type="RING",
                rarity="COMMON",
                level=1,
                stats=ShopItemStats(attack=5, defense=3, hp=25),
                price=100,
                description="A simple copper band"
            ),
            ShopEquipmentItem(
                id="shop_ring_uncommon_1",
                name="Silver Ring",
                type="RING",
                rarity="UNCOMMON",
                level=5,
                stats=ShopItemStats(attack=12, defense=8, hp=60),
                price=250,
                description="Polished silver ring"
            ),
            ShopEquipmentItem(
                id="shop_ring_rare_1",
                name="Gold Ring of Power",
                type="RING",
                rarity="RARE",
                level=10,
                stats=ShopItemStats(attack=25, defense=15, hp=120),
                price=700,
                description="Enchanted gold ring"
            ),
            ShopEquipmentItem(
                id="shop_ring_epic_1",
                name="Ruby Ring of Might",
                type="RING",
                rarity="EPIC",
                level=20,
                stats=ShopItemStats(attack=50, defense=30, hp=250),
                price=2100,
                description="Set with a flawless ruby"
            ),
            ShopEquipmentItem(
                id="shop_ring_legendary_1",
                name="Eternal Band",
                type="RING",
                rarity="LEGENDARY",
                level=50,
                stats=ShopItemStats(attack=100, defense=60, hp=600),
                price=12000,
                description="Ring of eternal power"
            ),

            # === AMULETS ===
            ShopEquipmentItem(
                id="shop_amulet_common_1",
                name="Wooden Pendant",
                type="AMULET",
                rarity="COMMON",
                level=1,
                stats=ShopItemStats(attack=3, defense=3, hp=30),
                price=100,
                description="Carved wooden charm"
            ),
            ShopEquipmentItem(
                id="shop_amulet_uncommon_1",
                name="Jade Amulet",
                type="AMULET",
                rarity="UNCOMMON",
                level=5,
                stats=ShopItemStats(attack=10, defense=10, hp=75),
                price=250,
                description="Green jade necklace"
            ),
            ShopEquipmentItem(
                id="shop_amulet_rare_1",
                name="Sapphire Pendant",
                type="AMULET",
                rarity="RARE",
                level=10,
                stats=ShopItemStats(attack=20, defense=20, hp=140),
                price=700,
                description="Blue sapphire amulet"
            ),
            ShopEquipmentItem(
                id="shop_amulet_epic_1",
                name="Phoenix Talisman",
                type="AMULET",
                rarity="EPIC",
                level=20,
                stats=ShopItemStats(attack=40, defense=40, hp=300),
                price=2100,
                description="Blessed by the phoenix"
            ),
        ]

        egg_items = [
            # === PET EGGS ===
            ShopEggItem(
                id="egg_shadow_dragon",
                name="🐉 Shadow Dragon Egg",
                type="EGG",
                rarity="LEGENDARY",
                level=1,
                pet_type="dragon",
                pet_stats=ShopItemStats(attack=50, defense=20, hp=0),
                price=5000,
                description="Hatch to receive a 🐉 Shadow Dragon (Attack Focus)"
            ),
            ShopEggItem(
                id="egg_blood_wyvern",
                name="🦇 Blood Wyvern Egg",
                type="EGG",
                rarity="EPIC",
                level=1,
                pet_type="wyvern",
                pet_stats=ShopItemStats(attack=40, defense=30, hp=0),
                price=3000,
                description="Hatch to receive a 🦇 Blood Wyvern (Damage Focus)"
            ),
            ShopEggItem(
                id="egg_direwolf",
                name="🐺 Direwolf Egg",
                type="EGG",
                rarity="RARE",
                level=1,
                pet_type="wolf",
                pet_stats=ShopItemStats(attack=35, defense=25, hp=0),
                price=2000,
                description="Hatch to receive a 🐺 Direwolf (Mixed Focus)"
            ),
            ShopEggItem(
                id="egg_nightmare_tiger",
                name="🐯 Nightmare Tiger Egg",
                type="EGG",
                rarity="RARE",
                level=1,
                pet_type="tiger",
                pet_stats=ShopItemStats(attack=45, defense=20, hp=0),
                price=2500,
                description="Hatch to receive a 🐯 Nightmare Tiger (Attack Focus)"
            ),
            ShopEggItem(
                id="egg_abyssal_bear",
                name="🐻 Abyssal Bear Egg",
                type="EGG",
                rarity="RARE",
                level=1,
                pet_type="bear",
                pet_stats=ShopItemStats(attack=25, defense=40, hp=0),
                price=2000,
                description="Hatch to receive a 🐻 Abyssal Bear (HP Focus)"
            ),
            ShopEggItem(
                id="egg_spirit_fox",
                name="🦊 Spirit Fox Egg",
                type="EGG",
                rarity="UNCOMMON",
                level=1,
                pet_type="fox",
                pet_stats=ShopItemStats(attack=20, defense=15, hp=0),
                price=1200,
                description="Hatch to receive a 🦊 Spirit Fox (Balanced Focus)"
            ),
            ShopEggItem(
                id="egg_void_spider",
                name="🕷️ Void Spider Egg",
                type="EGG",
                rarity="EPIC",
                level=1,
                pet_type="spider",
                pet_stats=ShopItemStats(attack=35, defense=30, hp=0),
                price=2800,
                description="Hatch to receive a 🕷️ Void Spider (Mixed Focus)"
            ),
            ShopEggItem(
                id="egg_random_legendary",
                name="🌟 Cursed Egg",
                type="EGG",
                rarity="LEGENDARY",
                level=1,
                pet_type=None,  # Random legendary pet
                pet_stats=ShopItemStats(attack=60, defense=50, hp=0),
                price=10000,
                description="Hatch to receive a RANDOM legendary companion"
            ),
        ]

        food_items = [
            # === PET FOOD ===
            ShopFoodItem(
                id="food_basic",
                name="Basic Pet Food",
                type="FOOD",
                rarity="COMMON",
                level=1,
                pet_exp=10,
                price=50,
                description="Basic food for pets. Gives 10 pet EXP."
            ),
            ShopFoodItem(
                id="food_quality",
                name="Quality Pet Food",
                type="FOOD",
                rarity="UNCOMMON",
                level=1,
                pet_exp=50,
                price=200,
                description="Quality food for pets. Gives 50 pet EXP."
            ),
            ShopFoodItem(
                id="food_premium",
                name="Premium Pet Food",
                type="FOOD",
                rarity="RARE",
                level=1,
                pet_exp=200,
                price=700,
                description="Premium food for pets. Gives 200 pet EXP."
            ),
            ShopFoodItem(
                id="food_legendary",
                name="Legendary Pet Food",
                type="FOOD",
                rarity="LEGENDARY",
                level=1,
                pet_exp=1000,
                price=3000,
                description="Legendary food for pets. Gives 1000 pet EXP."
            ),
        ]

        potion_items = [
            # === STAMINA RESTORE POTIONS ===
            ShopPotionItem(
                id="potion_stamina_small",
                name="Minor Stamina Potion",
                type="CONSUMABLE",
                rarity="COMMON",
                level=1,
                price=50,
                description="Restores 50 stamina instantly",
                icon="Icon1.png",
                potion_type="STAMINA_RESTORE",
                effect_value=50
            ),
            ShopPotionItem(
                id="potion_stamina_medium",
                name="Stamina Potion",
                type="CONSUMABLE",
                rarity="UNCOMMON",
                level=5,
                price=100,
                description="Restores 100 stamina instantly",
                icon="Icon2.png",
                potion_type="STAMINA_RESTORE",
                effect_value=100
            ),
            ShopPotionItem(
                id="potion_stamina_large",
                name="Greater Stamina Potion",
                type="CONSUMABLE",
                rarity="RARE",
                level=10,
                price=200,
                description="Restores 200 stamina instantly",
                icon="Icon3.png",
                potion_type="STAMINA_RESTORE",
                effect_value=200
            ),
            ShopPotionItem(
                id="potion_stamina_full",
                name="Full Stamina Elixir",
                type="CONSUMABLE",
                rarity="EPIC",
                level=15,
                price=500,
                gem_price=10,
                description="Completely restores all stamina to maximum",
                icon="Icon4.png",
                potion_type="STAMINA_RESTORE",
                effect_value=9999
            ),

            # === STAMINA BOOST POTIONS (Temporary Max Increase) ===
            ShopPotionItem(
                id="potion_stamina_boost",
                name="Endurance Elixir",
                type="CONSUMABLE",
                rarity="RARE",
                level=20,
                price=800,
                gem_price=15,
                description="Temporarily increases maximum stamina to 500 for 5 minutes",
                icon="Icon5.png",
                potion_type="STAMINA_BOOST",
                effect_value=500,
                duration=300
            ),
            ShopPotionItem(
                id="potion_stamina_mega_boost",
                name="Titan's Endurance",
                type="CONSUMABLE",
                rarity="LEGENDARY",
                level=30,
                price=1500,
                gem_price=25,
                description="Temporarily increases maximum stamina to 1000 for 10 minutes",
                icon="Icon6.png",
                potion_type="STAMINA_BOOST",
                effect_value=1000,
                duration=600
            ),

            # === ATTACK BOOST POTIONS ===
            ShopPotionItem(
                id="potion_attack_2x",
                name="Strength Potion",
                type="CONSUMABLE",
                rarity="UNCOMMON",
                level=8,
                price=300,
                description="Doubles attack power for 3 minutes",
                icon="Icon7.png",
                potion_type="ATTACK_BOOST",
                effect_value=2,
                duration=180
            ),
            ShopPotionItem(
                id="potion_attack_3x",
                name="Greater Strength Potion",
                type="CONSUMABLE",
                rarity="RARE",
                level=15,
                price=600,
                gem_price=12,
                description="Triples attack power for 3 minutes",
                icon="Icon8.png",
                potion_type="ATTACK_BOOST",
                effect_value=3,
                duration=180
            ),
            ShopPotionItem(
                id="potion_attack_5x",
                name="Berserker's Rage",
                type="CONSUMABLE",
                rarity="EPIC",
                level=25,
                price=1200,
                gem_price=20,
                description="Multiplies attack power by 5x for 5 minutes",
                icon="Icon9.png",
                potion_type="ATTACK_BOOST",
                effect_value=5,
                duration=300
            ),
            ShopPotionItem(
                id="potion_attack_10x",
                name="Divine Fury",
                type="CONSUMABLE",
                rarity="LEGENDARY",
                level=40,
                price=3000,
                gem_price=50,
                description="Multiplies attack power by 10x for 5 minutes - Ultimate power!",
                icon="Icon10.png",
                potion_type="ATTACK_BOOST",
                effect_value=10,
                duration=300
            ),
        ]

        return ShopCatalogResponse(
            equipment=equipment_items,
            eggs=egg_items,
            food=food_items,
            potions=potion_items
        )

    @staticmethod
    def find_shop_item(item_id: str) -> Optional[Dict]:
        """Find a shop item by ID and return as dict"""
        catalog = ShopService.get_shop_catalog()

        # Search in equipment
        for item in catalog.equipment:
            if item.id == item_id:
                return item.model_dump()

        # Search in eggs
        for item in catalog.eggs:
            if item.id == item_id:
                return item.model_dump()

        # Search in food
        for item in catalog.food:
            if item.id == item_id:
                return item.model_dump()

        # Search in potions
        for item in catalog.potions:
            if item.id == item_id:
                return item.model_dump()

        return None

    @staticmethod
    def validate_purchase(
        player: Player,
        item_id: str,
        use_gems: bool = False
    ) -> Tuple[bool, str, Optional[Dict]]:
        """
        Validate if player can purchase an item
        Returns: (can_purchase: bool, reason: str, item: Optional[Dict])
        """
        # Find item in catalog
        item = ShopService.find_shop_item(item_id)
        if not item:
            return False, "Item not found in shop", None

        # Check level requirement
        if player.level < item.get("level", 1):
            return False, f"Requires level {item['level']}", None

        # Check currency
        if use_gems and item.get("gem_price"):
            if player.gems < item["gem_price"]:
                return False, f"Insufficient gems (need {item['gem_price']}, have {player.gems})", None
        else:
            if player.gold < item["price"]:
                return False, f"Insufficient gold (need {item['price']}, have {player.gold})", None

        return True, "OK", item

    @staticmethod
    def purchase_item(
        db: Session,
        player: Player,
        item_id: str,
        use_gems: bool = False
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Purchase an item and add it to inventory/pets
        Returns: (success: bool, message: str, new_item_id: Optional[str])
        """
        # Validate purchase
        can_purchase, reason, item = ShopService.validate_purchase(player, item_id, use_gems)
        if not can_purchase:
            logger.warning(
                "purchase_validation_failed",
                player_id=player.id,
                item_id=item_id,
                reason=reason
            )
            return False, reason, None

        # Deduct currency
        cost_gold = 0
        cost_gems = 0
        if use_gems and item.get("gem_price"):
            cost_gems = item["gem_price"]
            player.gems -= cost_gems
        else:
            cost_gold = item["price"]
            player.gold -= cost_gold

        # Generate unique item ID
        unique_item_id = f"{item_id}_{uuid.uuid4().hex[:8]}"

        try:
            # Handle different item types
            item_type = item["type"]

            if item_type == "EGG":
                # Create pet egg (unhatched pet)
                # Convert pet_type to PetSpecies enum if it exists
                pet_species = None
                if item.get("pet_type"):
                    from app.models.pet import PetSpecies
                    try:
                        pet_species = PetSpecies(item["pet_type"])
                    except ValueError:
                        pet_species = PetSpecies.MYSTERY

                pet = Pet(
                    player_id=player.id,
                    species=pet_species,  # None for mystery eggs
                    name=None,  # Not named until hatched
                    level=1,
                    exp=0,
                    is_egg=True,  # This is an egg
                    hatched_at=None,
                    # Focus will be determined on hatch
                    focus=None,
                    base_attack=item["pet_stats"]["attack"],
                    base_defense=item["pet_stats"]["defense"],
                    base_hp=item["pet_stats"]["hp"]
                )
                db.add(pet)
                db.flush()  # Get the pet ID
                unique_item_id = str(pet.id)

            elif item_type == "FOOD":
                # Add food to inventory (FOOD maps to CONSUMABLE)
                from app.models.inventory import ItemType, ItemRarity
                inv_item = InventoryItem(
                    player_id=player.id,
                    name=item["name"],
                    item_type=ItemType.CONSUMABLE,
                    rarity=ItemRarity(item["rarity"].lower()),
                    level_requirement=1,
                    attack_bonus=0,
                    defense_bonus=0,
                    hp_bonus=0,
                    # Store pet_exp in properties JSON
                    properties={"pet_exp": item["pet_exp"], "description": item["description"]},
                    quantity=1
                )
                db.add(inv_item)
                db.flush()
                unique_item_id = str(inv_item.id)

            elif item_type == "CONSUMABLE":
                # Add potion to inventory
                from app.models.inventory import ItemType, ItemRarity

                # Check if player already has this potion type (for stacking)
                existing_potion = db.query(InventoryItem).filter(
                    InventoryItem.player_id == player.id,
                    InventoryItem.name == item["name"],
                    InventoryItem.item_type == ItemType.CONSUMABLE
                ).first()

                if existing_potion:
                    # Stack with existing potion
                    existing_potion.quantity += 1
                    unique_item_id = str(existing_potion.id)
                else:
                    # Create new potion stack
                    inv_item = InventoryItem(
                        player_id=player.id,
                        name=item["name"],
                        item_type=ItemType.CONSUMABLE,
                        rarity=ItemRarity(item["rarity"].lower()),
                        level_requirement=item.get("level", 1),
                        attack_bonus=0,
                        defense_bonus=0,
                        hp_bonus=0,
                        # Store potion properties in JSON
                        properties={
                            "potion_type": item["potion_type"],
                            "effect_value": item["effect_value"],
                            "duration": item.get("duration"),
                            "description": item["description"],
                            "icon": item.get("icon")
                        },
                        quantity=1
                    )
                    db.add(inv_item)
                    db.flush()
                    unique_item_id = str(inv_item.id)

            else:
                # Add equipment to inventory
                from app.models.inventory import ItemType, ItemRarity
                inv_item = InventoryItem(
                    player_id=player.id,
                    name=item["name"],
                    item_type=ItemType(item_type.lower()),
                    rarity=ItemRarity(item["rarity"].lower()),
                    level_requirement=item["level"],
                    attack_bonus=item["stats"]["attack"],
                    defense_bonus=item["stats"]["defense"],
                    hp_bonus=item["stats"]["hp"],
                    properties={"description": item.get("description", "")},
                    quantity=1
                )
                db.add(inv_item)
                db.flush()
                unique_item_id = str(inv_item.id)

            # Record purchase in shop_purchases table
            purchase = ShopPurchase(
                player_id=player.id,
                item_type=item_type,
                item_name=item["name"],
                cost_gold=cost_gold,
                cost_gems=cost_gems
            )
            db.add(purchase)

            # Commit all changes
            db.commit()
            db.refresh(player)

            logger.info(
                "item_purchased",
                player_id=player.id,
                item_id=item_id,
                item_name=item["name"],
                cost_gold=cost_gold,
                cost_gems=cost_gems,
                new_item_id=unique_item_id
            )

            return True, f"Purchased {item['name']}!", unique_item_id

        except Exception as e:
            db.rollback()
            logger.error(
                "purchase_failed",
                player_id=player.id,
                item_id=item_id,
                error=str(e)
            )
            return False, "Purchase failed due to an error", None

    @staticmethod
    def get_purchase_history(
        db: Session,
        player: Player,
        limit: int = 50
    ) -> List[PurchaseHistoryItem]:
        """Get player's purchase history"""
        purchases = db.query(ShopPurchase).filter(
            ShopPurchase.player_id == player.id
        ).order_by(
            desc(ShopPurchase.purchased_at)
        ).limit(limit).all()

        return [PurchaseHistoryItem.model_validate(p) for p in purchases]
