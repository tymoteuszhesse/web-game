# Game Icons Directory

This directory contains all PNG icon assets used in the game, organized by category.

## Directory Structure

```
assets/icons/
├── potions/         # Potion icons (Icon1.png - Icon48.png)
├── weapons/         # Weapon icons (swords, axes, bows, etc.)
├── armor/           # Armor icons (helmets, chest plates, shields, etc.)
├── items/           # General item icons (tools, quest items, etc.)
├── resources/       # Resource icons (wood, stone, ore, etc.)
└── misc/            # Miscellaneous icons
```

## Naming Convention

### Potions
- **Pattern**: `Icon1.png` to `Icon48.png`
- **Example**: Icon1.png, Icon2.png, Icon3.png...

### Other Categories (Recommended)
- **Weapons**: `weapon_[type]_[variant].png` (e.g., weapon_sword_iron.png)
- **Armor**: `armor_[slot]_[type].png` (e.g., armor_chest_leather.png)
- **Items**: `item_[name].png` (e.g., item_key_gold.png)
- **Resources**: `resource_[type].png` (e.g., resource_wood.png)

## Integration

### Loading Icons Dynamically

```javascript
// Example: Loading a potion icon
const potionIcon = `/assets/icons/potions/Icon${itemId}.png`;

// Example: Loading a weapon icon
const weaponIcon = `/assets/icons/weapons/weapon_sword_iron.png`;
```

### Usage in Inventory System

```javascript
// In inventory rendering
function renderItem(item) {
    const iconPath = getIconPath(item);
    return `<img src="${iconPath}" alt="${item.name}" class="item-icon" />`;
}

function getIconPath(item) {
    const category = item.category || 'misc';
    const iconName = item.icon || 'default.png';
    return `/assets/icons/${category}/${iconName}`;
}
```

## Technical Specifications

### Recommended Icon Dimensions
- **Standard**: 64x64px (most items)
- **High-res**: 128x128px (featured items, UI elements)
- **Thumbnail**: 32x32px (small inventory slots)

### File Format
- **Format**: PNG with transparency
- **Color Mode**: RGBA (32-bit with alpha channel)
- **Optimization**: Use tools like TinyPNG to reduce file size

## Adding New Icons

1. Place the PNG file in the appropriate category folder
2. Follow the naming convention for that category
3. Ensure the icon has transparency (alpha channel)
4. Optimize the file size for web performance
5. Update your item database with the correct icon path

## Performance Tips

1. **Lazy Loading**: Load icons only when needed
2. **Caching**: Use browser caching for icon files
3. **WebP Format**: Consider using WebP for better compression
4. **Sprite Sheets**: Combine icons for fewer HTTP requests
5. **CDN**: Serve icons from a CDN for faster delivery

---

**Icon Assets Ready!** Place your Icon1.png through Icon48.png in the `potions/` folder.
