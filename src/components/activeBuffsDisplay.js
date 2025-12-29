/**
 * Active Buffs Display Component
 * Mystical floating indicators showing active potion effects
 */

class ActiveBuffsDisplay {
    constructor() {
        this.buffs = [];
        this.container = null;
        this.updateInterval = null;
    }

    /**
     * Initialize the buffs display
     */
    init() {
        // Create container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'active-buffs-container';
            this.container.className = 'active-buffs-container';

            // Insert after the server time in the header
            const header = document.querySelector('.resources-bar');
            if (header) {
                header.appendChild(this.container);
            }
        }

        // Start update loop
        this.startUpdateLoop();
    }

    /**
     * Update buffs from player data
     */
    async updateBuffs() {
        try {
            const player = PlayerData.get();
            const buffs = player.active_buffs || [];

            this.buffs = buffs.map(buff => ({
                id: buff.id,
                type: buff.buff_type,
                value: buff.effect_value,
                expiresAt: new Date(buff.expires_at),
                source: buff.source
            }));

            this.render();
        } catch (error) {
            console.error('Failed to update buffs:', error);
        }
    }

    /**
     * Render the buffs display
     */
    render() {
        if (!this.container) return;

        // Clear existing content
        this.container.innerHTML = '';

        // Filter out expired buffs
        const now = new Date();
        const activeBuffs = this.buffs.filter(buff => buff.expiresAt > now);

        if (activeBuffs.length === 0) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'flex';

        // Render each buff
        activeBuffs.forEach(buff => {
            const buffEl = this.createBuffElement(buff);
            this.container.appendChild(buffEl);
        });
    }

    /**
     * Create a buff element
     */
    createBuffElement(buff) {
        const buffCard = document.createElement('div');
        buffCard.className = 'buff-card';
        buffCard.dataset.buffType = buff.type;

        // Calculate time remaining
        const now = new Date();
        const timeRemaining = Math.max(0, Math.floor((buff.expiresAt - now) / 1000));
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Calculate progress (0-1)
        const progress = timeRemaining / 300; // Assuming max 5 minutes

        // Get buff info
        const buffInfo = this.getBuffInfo(buff.type, buff.value);

        buffCard.innerHTML = `
            <div class="buff-vial">
                <div class="buff-liquid" style="height: ${progress * 100}%"></div>
                <div class="buff-icon">${buffInfo.icon}</div>
            </div>
            <div class="buff-details">
                <div class="buff-name">${buffInfo.name}</div>
                <div class="buff-value">${buffInfo.valueText}</div>
                <div class="buff-timer">${timeText}</div>
            </div>
            <div class="buff-glow"></div>
        `;

        return buffCard;
    }

    /**
     * Get buff information
     */
    getBuffInfo(type, value) {
        const buffTypes = {
            'stamina_boost': {
                icon: '⚡',
                name: 'Endurance',
                valueText: `Max: ${value}`,
                color: '#3b82f6'
            },
            'attack_boost': {
                icon: '⚔️',
                name: 'Strength',
                valueText: `${value}x ATK`,
                color: '#ef4444'
            },
            'defense_boost': {
                icon: '🛡️',
                name: 'Protection',
                valueText: `${value}x DEF`,
                color: '#10b981'
            }
        };

        return buffTypes[type] || {
            icon: '✨',
            name: 'Buff',
            valueText: value.toString(),
            color: '#a855f7'
        };
    }

    /**
     * Start the update loop
     */
    startUpdateLoop() {
        // Update immediately
        this.updateBuffs();

        // Update every second
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.render(); // Just re-render with existing data to update timers
        }, 1000);
    }

    /**
     * Stop the update loop
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Sync buffs from API
     */
    async syncFromAPI() {
        try {
            const playerData = await apiClient.getPlayerInfo();

            // Update active buffs in player data
            gameState.set('player.active_buffs', playerData.active_buffs || []);

            // Update the display
            await this.updateBuffs();
        } catch (error) {
            console.error('Failed to sync buffs from API:', error);
        }
    }
}

// Create global instance
window.ActiveBuffsDisplay = new ActiveBuffsDisplay();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ActiveBuffsDisplay.init();
    });
} else {
    window.ActiveBuffsDisplay.init();
}
