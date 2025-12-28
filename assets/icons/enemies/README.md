# Enemy Icons Directory

This directory contains PNG icon assets for game enemies and monsters.

## Naming Convention

Enemy icons should follow this pattern:
- **Pattern**: `enemy_[category]_[name].png` or `Enemy1.png` to `EnemyN.png`
- **Examples**:
  - `enemy_goblin_warrior.png`
  - `enemy_dragon_red.png`
  - `Enemy1.png`, `Enemy2.png`, etc.

## Enemy Categories

Suggested categories for organization:
- **Humanoid**: Goblins, orcs, bandits, knights
- **Beasts**: Wolves, bears, giant spiders
- **Dragons**: Various dragon types
- **Undead**: Skeletons, zombies, ghosts
- **Demons**: Imps, demons, devils
- **Elementals**: Fire, water, earth, air elementals
- **Bosses**: Epic boss enemies

## Technical Specifications

### Recommended Icon Dimensions
- **Standard**: 64x64px (most enemies)
- **Boss Icons**: 128x128px (epic bosses)
- **Mini Icons**: 32x32px (small enemy indicators)

### File Format
- **Format**: PNG with transparency
- **Color Mode**: RGBA (32-bit with alpha channel)
- **Optimization**: Use tools like TinyPNG to reduce file size

## Integration Example

```javascript
// In battle view
function renderEnemy(enemy) {
    const iconPath = `/assets/icons/enemies/${enemy.icon}`;
    return `<img src="${iconPath}" alt="${enemy.name}" class="enemy-icon" />`;
}
```

## Adding New Enemy Icons

1. Place the PNG file in this directory
2. Follow the naming convention above
3. Ensure the icon has transparency (alpha channel)
4. Optimize the file size for web performance
5. Update your enemy database with the correct icon filename

## Icon Style Guidelines

- **Consistent Style**: All enemy icons should have a consistent art style
- **Clear Silhouettes**: Enemies should be easily recognizable at small sizes
- **Appropriate Colors**: Use colors that match the enemy type (red for fire, blue for ice, etc.)
- **Face Forward**: Icons should generally show enemies facing forward or at 3/4 view
- **Menacing**: Enemies should look threatening and dangerous

---

**Ready for Enemy Icons!** Place your enemy PNG files in this folder using the naming convention above.
