# Icon Mapping Guide

Quick reference for mapping Noun Project icons to game elements.

## Search Keywords by Category

### Combat & Weapons
Search: "dark sword", "fantasy blade", "medieval weapon", "gothic sword"
- attack.svg
- weapon.svg
- battle.svg
- damage.svg

### Defense & Protection
Search: "medieval shield", "fantasy armor", "gothic protection"
- defense.svg
- armor.svg
- helmet.svg

### Magic & Energy
Search: "dark magic", "lightning bolt", "energy", "spell"
- stamina.svg (lightning bolt)
- exp.svg (sparkle/star)
- events.svg (crystal ball)

### Treasure & Loot
Search: "treasure", "gold coin", "gem", "chest"
- gold.svg
- gems.svg
- treasure.svg
- chest.svg
- loot.svg

### Dungeon & Adventure
Search: "dungeon gate", "castle entrance", "dark gate"
- gates.svg
- quest.svg (scroll)

### Creatures - Draconic
Search: "dragon", "wyvern", "serpent"
- pet-dragon.svg
- pet-wyvern.svg
- enemy-dragon.svg

### Creatures - Beasts
Search: "wolf", "bear", "tiger", "lion"
- pet-wolf.svg
- pet-bear.svg
- pet-tiger.svg
- pet-lion.svg

### Creatures - Mystical
Search: "fox spirit", "raven", "owl", "unicorn"
- pet-fox.svg
- pet-raven.svg
- pet-owl.svg
- pet-unicorn.svg

### Creatures - Dark
Search: "spider", "scorpion", "black cat"
- pet-spider.svg
- pet-scorpion.svg
- pet-cat.svg

### Monsters & Enemies
Search: "goblin", "orc", "skeleton", "zombie", "demon"
- enemy-goblin.svg
- enemy-orc.svg
- enemy-skeleton.svg
- enemy-zombie.svg
- enemy-demon.svg

### Equipment
Search: "helmet", "gauntlet", "boots", "ring", "amulet"
- helmet.svg
- gloves.svg
- boots.svg
- ring.svg
- amulet.svg

### Merchant & Shop
Search: "wizard", "merchant", "shop", "backpack"
- merchant.svg
- shop.svg
- inventory.svg

### Potions & Items
Search: "potion", "bottle", "flask", "scroll", "spell book"
- potion.svg
- scroll.svg
- book.svg

---

## Recommended Icon Packs

If you want a cohesive look, search for these specific styles:

1. **Gothic/Dark Fantasy Style**
   - Search: "gothic icon pack" or "dark fantasy set"
   - Look for icons with similar line weight and style

2. **Medieval RPG Style**
   - Search: "medieval rpg" or "dungeon icons"
   - Good for weapons, armor, and equipment

3. **Monster/Creature Style**
   - Search: "fantasy creatures" or "monsters icon"
   - Good for pets and enemies

---

## Pro Tips

1. **Consistency**: Try to download icons from the same creator/pack for visual consistency
2. **Line Weight**: Look for icons with similar line thickness (thin vs bold)
3. **Level of Detail**: Simple icons work better at small sizes
4. **Monochrome**: Black/white icons work best (game applies colors via filters)
5. **Start Small**: Download the Priority HIGH icons first, then expand

---

## Quick Icon List (Copy for Shopping)

Copy this list when browsing Noun Project:

```
Priority HIGH (Get These First):
☐ attack sword
☐ defense shield
☐ health heart
☐ stamina lightning
☐ gold coin
☐ gems diamond
☐ experience star
☐ dungeon gate
☐ battle swords
☐ weapon sword
☐ armor breastplate
☐ helmet
☐ boots
☐ gloves
☐ ring
☐ amulet necklace

Priority MEDIUM (Get Next):
☐ dragon
☐ wolf
☐ bear
☐ tiger
☐ fox spirit
☐ spider
☐ egg
☐ pet paw
☐ merchant wizard
☐ backpack inventory
☐ treasure chest
☐ potion bottle
☐ scroll parchment

Priority LOW (Optional):
☐ goblin monster
☐ skeleton skull
☐ zombie
☐ demon
☐ trophy achievement
☐ crown legendary
☐ guild shield banner
```

---

## Testing Icons

After downloading icons:

1. Place SVG files in `assets/icons/` folder
2. Edit `src/data/themeIcons.js`
3. Change `iconType: 'emoji'` to `iconType: 'svg'`
4. Refresh the game to see your icons!

If an icon doesn't load, it will fallback to the emoji automatically.
