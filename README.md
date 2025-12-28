# Fantasy RPG Browser Game

A feature-rich browser-based fantasy RPG game inspired by modern idle/incremental RPGs with multiple interconnected game systems.

## Features Implemented (Phase 1)

### Core Architecture
- **Single Page Application** with hash-based routing
- **Component-based UI** with reusable components (Cards, Buttons, Modals, Progress Bars)
- **State Management** with LocalStorage persistence
- **Resource Header** showing real-time Stamina, Gold, Gems, XP, and Server Time
- **Notification System** for user feedback

### Working Systems
- **Dashboard** with Core Activities and Game Menu
- **Stats System** with allocatable stat points
  - ATTACK, DEFENSE, MAX STAMINA
  - Level-up rewards (5 stat points per level)
  - Live UI updates
- **Player Progression** with XP and leveling
- **Resource Management** (Gold, Gems, Stamina)

## Project Structure

```
web_game/
├── index.html              # Main HTML entry point
├── src/
│   ├── app.js             # Main application & route definitions
│   ├── components/
│   │   └── uiComponents.js # Reusable UI components
│   ├── data/
│   │   └── playerData.js   # Player data management
│   └── utils/
│       ├── router.js       # SPA routing system
│       └── gameState.js    # State management
├── styles/
│   ├── main.css           # Base styles & layout
│   └── components.css     # Component-specific styles
└── assets/
    ├── images/            # Game images (placeholder)
    └── sounds/            # Sound effects (placeholder)
```

## Getting Started

### Running Locally

Simply open `index.html` in a modern web browser:

```bash
# Option 1: Direct file opening
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux

# Option 2: Using Python HTTP server
python3 -m http.server 8000
# Then visit: http://localhost:8000

# Option 3: Using Node.js http-server
npx http-server -p 8000
# Then visit: http://localhost:8000
```

### Navigation

- **Dashboard**: Main hub with all game sections
- **Stats**: Allocate stat points earned from leveling up
- Other sections show "Coming Soon" placeholders

## Development Roadmap

### ✅ Phase 1: Project Foundation (COMPLETED)
- Project structure and architecture
- Core UI components
- State management
- Resource tracking

### 🔜 Phase 2: Dashboard & Navigation
- Core Activities cards
- Game Menu layout
- Navigation improvements

### 🔜 Phase 3: Player Profile & Stats
- Enhanced stats display
- Damage calculations
- Character progression

### 🔜 Phase 4: Inventory & Equipment
- Item system with rarity tiers
- Equipment slots
- Attack/Defense sets
- Equip/unequip functionality

### 🔜 Phase 5: Combat System
- Wave-based battles
- Enemy cards
- Join Battle functionality
- Loot system

### 🔜 Phase 6: Pets & Eggs
- Pet collection
- Attack/Defense teams
- Pet leveling and promotion

### 🔜 Phase 7: Blacksmith & Crafting
- Crafting recipes
- Material requirements
- Forge functionality

### 🔜 Phase 8: Merchant & Shop
- Gold Shop
- Gems Shop
- Purchase limits

### 🔜 Phase 9: Achievements
- Achievement tracking
- Reward system
- Progress bars

### 🔜 Phase 10: Polish & Enhancements
- Animations
- Responsive design
- Performance optimization

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **Vanilla JavaScript** - No frameworks, pure JS
- **LocalStorage** - Client-side data persistence

## Design Principles

- **Component-based architecture** for reusability
- **Mobile-first responsive design**
- **Fantasy theme** with dark UI and glowing accents
- **Card-based layouts** for game elements
- **Real-time updates** for resources and stats

## Game Systems

### Resource Management
- **Stamina**: Used for battles and activities
- **Gold**: Primary currency for purchases
- **Gems**: Premium currency
- **XP**: Experience points for leveling

### Progression
- Level up to gain stat points
- Allocate points to ATTACK, DEFENSE, or MAX STAMINA
- Each level requires exponentially more XP

## Contributing

This is a learning project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - Feel free to use and modify for your own projects!

## Credits

Inspired by modern fantasy RPG games with card-based UIs and idle/incremental mechanics.
