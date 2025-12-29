/**
 * Player Data Management
 * Helper functions for player-related data operations
 */

const PlayerData = {
    /**
     * Get player data
     */
    get() {
        return gameState.getValue('player', {});
    },

    /**
     * Add experience points
     * @param {number} amount - Amount of XP to add
     */
    addExp(amount) {
        // Input validation
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            console.error('Invalid XP amount:', amount);
            return;
        }
        const player = this.get();
        let newExp = player.exp + amount;
        let newLevel = player.level;
        let expMax = player.exp_max;

        // Check for level up
        while (newExp >= expMax) {
            newExp -= expMax;
            newLevel++;
            expMax = this.calculateExpForLevel(newLevel);

            // Award stat points on level up
            const currentPoints = player.unspent_stat_points || 0;
            gameState.set('player.unspent_stat_points', currentPoints + 5);

            // Refill stamina to max on level up
            gameState.set('player.stamina', player.stamina_max);

            // Add level-up animation
            const levelDisplayEl = document.querySelector('.level-display');
            if (levelDisplayEl) {
                levelDisplayEl.classList.add('level-up');
                setTimeout(() => {
                    levelDisplayEl.classList.remove('level-up');
                }, 1500);
            }

            NotificationSystem.show(
                `Level Up! You are now level ${newLevel}! +5 Stat Points | Stamina Refilled!`,
                'success',
                5000
            );
        }

        gameState.update('player', {
            exp: newExp,
            level: newLevel,
            exp_max: expMax
        });

        this.updateUI();
    },

    /**
     * Calculate EXP required for a level
     * @param {number} level - Target level
     */
    calculateExpForLevel(level) {
        return Math.floor(1000 * Math.pow(1.15, level - 1));
    },

    /**
     * Add/remove gold
     * @param {number} amount - Amount to add (negative to remove)
     * @param {boolean} showNotification - Whether to show notification (default: true)
     */
    modifyGold(amount, showNotification = true) {
        // Input validation
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error('Invalid gold amount:', amount);
            return;
        }
        const player = this.get();
        const newGold = Math.max(0, player.gold + amount);
        gameState.set('player.gold', newGold);
        this.updateUI();

        if (amount > 0 && showNotification) {
            NotificationSystem.show(`+${this.formatNumber(amount)} Gold`, 'success');
        }
    },

    /**
     * Add/remove gems
     * @param {number} amount - Amount to add (negative to remove)
     */
    modifyGems(amount) {
        // Input validation
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error('Invalid gems amount:', amount);
            return;
        }
        const player = this.get();
        const newGems = Math.max(0, player.gems + amount);
        gameState.set('player.gems', newGems);
        this.updateUI();

        if (amount > 0) {
            NotificationSystem.show(`+${amount} Gems`, 'success');
        }
    },

    /**
     * Add/remove stamina
     * @param {number} amount - Amount to add (negative to remove)
     */
    modifyStamina(amount) {
        const player = this.get();
        const newStamina = Math.max(0, Math.min(player.stamina_max, player.stamina + amount));
        gameState.set('player.stamina', newStamina);
        this.updateUI();
    },

    /**
     * Check if player can afford
     * @param {Object} cost - Cost object {gold: number, gems: number, stamina: number}
     */
    canAfford(cost) {
        const player = this.get();
        if (cost.gold && player.gold < cost.gold) return false;
        if (cost.gems && player.gems < cost.gems) return false;
        if (cost.stamina && player.stamina < cost.stamina) return false;
        return true;
    },

    /**
     * Deduct cost from player resources
     * @param {Object} cost - Cost object {gold: number, gems: number, stamina: number}
     */
    pay(cost) {
        if (!this.canAfford(cost)) {
            return false;
        }

        if (cost.gold) this.modifyGold(-cost.gold);
        if (cost.gems) this.modifyGems(-cost.gems);
        if (cost.stamina) this.modifyStamina(-cost.stamina);

        return true;
    },

    /**
     * Allocate stat points
     * @param {string} stat - Stat name (attack, defense, maxStamina)
     * @param {number} points - Number of points to allocate
     */
    async allocateStats(stat, points) {
        const player = this.get();
        const unspent = player.unspent_stat_points || 0;

        if (unspent < points) {
            NotificationSystem.show('Not enough stat points!', 'error');
            return false;
        }

        try {
            // Prepare the allocation based on which stat is being increased
            const allocation = {
                attack: stat === 'attack' ? points : 0,
                defense: stat === 'defense' ? points : 0,
                maxStamina: stat === 'maxStamina' ? points : 0
            };

            // Call backend API to persist the change
            const result = await apiClient.allocateStats(
                allocation.attack,
                allocation.defense,
                allocation.maxStamina
            );

            // Update local state with fresh player data from server
            gameState.set('player', result.player);

            NotificationSystem.show(`+${points} ${stat.toUpperCase()}`, 'success');
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Failed to allocate stats:', error);
            NotificationSystem.show(error.message || 'Failed to allocate stats', 'error');
            return false;
        }
    },

    /**
     * Calculate total attack damage
     */
    getTotalAttack() {
        const player = this.get();
        const inventory = gameState.getValue('inventory', {});
        let total = player.base_attack || 0;

        // Add equipment bonuses from attack set
        if (inventory.attackSet) {
            Object.values(inventory.attackSet).forEach(item => {
                if (item && item.stats && item.stats.attack) {
                    total += item.stats.attack;
                }
            });
        }

        // Add pet bonuses (from equipped pets in attack set)
        if (typeof PetData !== 'undefined') {
            const petState = PetData.getPetState();
            if (petState.attackSet) {
                petState.attackSet.forEach(petId => {
                    if (petId) {
                        const pet = petState.collection.find(p => p.id === petId);
                        if (pet) {
                            const bonuses = PetData.calculatePetBonuses(pet);
                            total += bonuses.attack || 0;
                        }
                    }
                });
            }
        }

        return total;
    },

    /**
     * Calculate total defense
     */
    getTotalDefense() {
        const player = this.get();
        const inventory = gameState.getValue('inventory', {});
        let total = player.base_defense || 0;

        // Add equipment bonuses from defense set
        if (inventory.defenseSet) {
            Object.values(inventory.defenseSet).forEach(item => {
                if (item && item.stats && item.stats.defense) {
                    total += item.stats.defense;
                }
            });
        }

        // Add pet bonuses (from equipped pets in defense set)
        if (typeof PetData !== 'undefined') {
            const petState = PetData.getPetState();
            if (petState.defenseSet) {
                petState.defenseSet.forEach(petId => {
                    if (petId) {
                        const pet = petState.collection.find(p => p.id === petId);
                        if (pet) {
                            const bonuses = PetData.calculatePetBonuses(pet);
                            total += bonuses.defense || 0;
                        }
                    }
                });
            }
        }

        return total;
    },

    /**
     * Format large numbers (e.g., 19965702 -> 19.9M)
     */
    formatNumber(num) {
        // Handle null, undefined, or non-numeric values
        if (num === null || num === undefined || isNaN(num)) {
            return '0';
        }

        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    /**
     * Update UI with current player data
     */
    updateUI() {
        const player = this.get();

        // Update stamina
        const staminaEl = document.getElementById('stamina-value');
        if (staminaEl) {
            staminaEl.textContent = this.formatNumber(player.stamina);
        }

        // Update gold - show whole numbers with commas
        const goldEl = document.getElementById('gold-value');
        if (goldEl) {
            goldEl.textContent = Math.floor(player.gold || 0).toLocaleString('en-US');
        }

        // Update gems
        const gemsEl = document.getElementById('gems-value');
        if (gemsEl) {
            gemsEl.textContent = this.formatNumber(player.gems);
        }

        // Update level
        const levelEl = document.getElementById('player-level');
        if (levelEl) {
            levelEl.textContent = player.level || 1;
        }

        // Update exp with animations
        const currentExpEl = document.getElementById('current-exp');
        const maxExpEl = document.getElementById('max-exp');
        const expBarEl = document.getElementById('exp-bar-fill');

        if (currentExpEl && maxExpEl && expBarEl) {
            // Ensure exp values are valid numbers
            const currentExp = player.exp || 0;
            const maxExp = player.exp_max || 100;

            // Store previous exp for comparison
            const prevExp = parseInt(currentExpEl.textContent.replace(/,/g, '')) || 0;
            const newExp = currentExp;

            // Format exp values with commas (no K/M abbreviation)
            currentExpEl.textContent = Math.floor(currentExp).toLocaleString('en-US');
            maxExpEl.textContent = Math.floor(maxExp).toLocaleString('en-US');

            const expPercentage = Math.min(100, Math.max(0, (currentExp / maxExp) * 100));

            // Add gaining exp animation when XP increases
            if (newExp > prevExp) {
                expBarEl.classList.add('gaining-exp');
                setTimeout(() => {
                    expBarEl.classList.remove('gaining-exp');
                }, 600);
            }

            expBarEl.style.width = `${expPercentage}%`;
        }

        // Update server time
        this.updateServerTime();
    },

    /**
     * Update server time display
     */
    updateServerTime() {
        const timeEl = document.getElementById('server-time');
        if (timeEl) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;

            timeEl.textContent = `${displayHours}:${minutes}:${seconds} ${ampm}`;
        }
    },

    /**
     * Sync player data from API
     */
    async syncFromAPI() {
        try {
            const playerData = await apiClient.getPlayerStats();

            // Update player state with fresh data from server
            gameState.set('player', playerData);

            // Update UI to reflect changes
            this.updateUI();

            // Update active buffs display if available
            if (window.ActiveBuffsDisplay) {
                await window.ActiveBuffsDisplay.updateBuffs();
            }

            return playerData;
        } catch (error) {
            console.error('Failed to sync player data from API:', error);
            throw error;
        }
    }
};

// Stamina Regeneration System
window.StaminaRegen = {
    lastRegenTime: Math.floor(Date.now() / 10000),
    intervalId: null,

    start() {
        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Update server time every second and check for stamina regeneration
        this.intervalId = setInterval(() => {
            PlayerData.updateServerTime();

            // Check if 10 seconds have passed (server time)
            const current10SecInterval = Math.floor(Date.now() / 10000);
            if (current10SecInterval > this.lastRegenTime) {
                this.lastRegenTime = current10SecInterval;

                // Regenerate 10% of max stamina
                const player = PlayerData.get();
                const regenAmount = Math.floor(player.stamina_max * 0.1);

                if (player.stamina < player.stamina_max && regenAmount > 0) {
                    const newStamina = Math.min(player.stamina_max, player.stamina + regenAmount);
                    gameState.set('player.stamina', newStamina);
                    PlayerData.updateUI();

                    // Show notification
                    NotificationSystem.show(`+${regenAmount} Stamina regenerated`, 'success', 2000);
                }
            }
        }, 1000); // Check every second
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
};

// Start stamina regeneration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.StaminaRegen.start();
    });
} else {
    window.StaminaRegen.start();
}

// Initial UI update
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PlayerData.updateUI();
    });
} else {
    PlayerData.updateUI();
}
