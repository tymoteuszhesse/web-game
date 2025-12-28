/**
 * Game State Management System
 * Handles saving/loading game data to/from localStorage
 */

class GameState {
    constructor() {
        this.storageKey = 'fantasyRpgGameState';
        this.state = this.load();
        this.listeners = [];
    }

    /**
     * Get current state
     */
    get() {
        return this.state;
    }

    /**
     * Set state value
     * @param {string} path - Dot notation path (e.g., 'player.gold')
     * @param {*} value - New value
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.state;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        this.save();
        this.notify(path, value);
    }

    /**
     * Get state value
     * @param {string} path - Dot notation path
     * @param {*} defaultValue - Default value if not found
     */
    getValue(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.state;

        for (const key of keys) {
            if (current[key] === undefined) {
                return defaultValue;
            }
            current = current[key];
        }

        return current;
    }

    /**
     * Update nested object
     * @param {string} path - Dot notation path
     * @param {Object} updates - Object with updates
     */
    update(path, updates) {
        const current = this.getValue(path, {});
        this.set(path, { ...current, ...updates });
    }

    /**
     * Save state to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save game state:', error);
            // Show user-friendly error if NotificationSystem is available
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.show(
                    'Failed to save game progress. Check if your browser allows localStorage.',
                    'error',
                    5000
                );
            }
        }
    }

    /**
     * Load state from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
        }

        return this.getDefaultState();
    }

    /**
     * Reset to default state
     */
    reset() {
        this.state = this.getDefaultState();
        this.save();
        this.notify('reset', this.state);
    }

    /**
     * Get default state structure
     */
    getDefaultState() {
        return {
            player: {
                level: 1,
                exp: 0,
                exp_max: 100,
                stamina: 100,
                stamina_max: 100,
                gold: 0,
                gems: 0,
                base_attack: 10,
                base_defense: 10,
                unspent_stat_points: 0
            },
            inventory: {
                items: [],
                attackSet: {
                    weapon: null,
                    helmet: null,
                    armor: null,
                    boots: null,
                    gloves: null,
                    ring: null,
                    amulet: null,
                    ring2: null
                },
                defenseSet: {
                    weapon: null,
                    helmet: null,
                    armor: null,
                    boots: null,
                    gloves: null,
                    ring: null,
                    amulet: null,
                    ring2: null
                }
            },
            pets: {
                collection: [],
                attackSet: [null, null, null],
                defenseSet: [null, null, null],
                eggs: []
            },
            achievements: [],
            battles: {
                completedWaves: []
            },
            shop: {
                purchases: []
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true
            },
            lastSaved: Date.now()
        };
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function (path, value)
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify listeners of state change
     */
    notify(path, value) {
        this.listeners.forEach(callback => {
            try {
                callback(path, value);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    /**
     * Export state as JSON
     */
    export() {
        return JSON.stringify(this.state, null, 2);
    }

    /**
     * Import state from JSON
     */
    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.state = imported;
            this.save();
            this.notify('import', this.state);
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }
}

// Create global game state instance
const gameState = new GameState();

// Auto-save every 30 seconds
setInterval(() => {
    gameState.set('lastSaved', Date.now());
}, 30000);
