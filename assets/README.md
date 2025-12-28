# Assets Directory

This directory contains game assets like icons, images, and other media files.

## Directory Structure

```
assets/
├── icons/
│   ├── weapons/     # Weapon icons (Icon1.png, Icon2.png, etc.)
│   ├── armor/       # Armor icons
│   ├── accessories/ # Ring, amulet icons
│   └── pets/        # Pet icons
└── README.md
```

## Adding Custom Icons

### Weapon Icons

1. Place your weapon PNG files in `assets/icons/weapons/`
2. Name them to match the backend database entries (e.g., `Icon1.png`, `Icon2.png`)
3. The shop will automatically load these images
4. If an image fails to load, it will fallback to emoji icons (⚔️)

### Image Requirements

- Format: PNG with transparency recommended
- Size: 80x80px or larger (will be scaled down)
- Naming: Must match the `icon` field in the database exactly

### Current Icon Mapping

The backend database uses the following icon names:
- Weapons: Icon1.png through Icon24.png
- Each equipment item has an `icon` field that references the filename

### Fallback System

The frontend includes an automatic fallback system:
- If an image fails to load → Shows emoji icon
- Weapons → ⚔️
- Helmets → 🪖
- Armor → 🛡️
- Boots → 👢
- Gloves → 🧤
- Rings → 💍
- Amulets → 📿
- Eggs → 🥚
- Food → 🍖/🥩/🦴/🍞 (based on rarity)

## Testing

To test if your icons are loading:
1. Start the frontend server: `python3 -m http.server 8000`
2. Open browser console (F12)
3. Navigate to Shop
4. Check for any 404 errors for missing image files
5. Images that fail to load will show emoji fallback
