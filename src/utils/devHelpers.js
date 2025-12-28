/**
 * Development Helper Functions
 * Useful utilities for testing and development
 */

const DevHelpers = {
    /**
     * Add gold for testing (persists to backend)
     */
    async giveGold(amount = 100000) {
        try {
            // Update backend first
            await apiClient.post('/api/dev/add-gold', { amount });

            // Then refresh from backend to ensure sync
            const updatedPlayer = await apiClient.getPlayerInfo();
            gameState.set('player', updatedPlayer);
            PlayerData.updateUI();

            console.log(`✓ Added ${amount} gold (saved to database)`);
            NotificationSystem.show(`+${amount} Gold (DEV)`, 'success');
        } catch (error) {
            console.error('Failed to add gold:', error);
            // Fallback to local-only for testing
            PlayerData.modifyGold(amount);
            console.warn('⚠ Added gold locally only (not saved to database)');
        }
    },

    // Alias for backward compatibility
    async addGold(amount = 100000) {
        return await this.giveGold(amount);
    },

    /**
     * Add gems for testing (persists to backend)
     */
    async giveGems(amount = 1000) {
        try {
            await apiClient.post('/api/dev/add-gems', { amount });
            const updatedPlayer = await apiClient.getPlayerInfo();
            gameState.set('player', updatedPlayer);
            PlayerData.updateUI();

            console.log(`✓ Added ${amount} gems (saved to database)`);
            NotificationSystem.show(`+${amount} Gems (DEV)`, 'success');
        } catch (error) {
            console.error('Failed to add gems:', error);
            PlayerData.modifyGems(amount);
            console.warn('⚠ Added gems locally only (not saved to database)');
        }
    },

    // Alias for backward compatibility
    async addGems(amount = 1000) {
        return await this.giveGems(amount);
    },

    /**
     * Add XP for testing (persists to backend)
     */
    async giveExp(amount = 100000) {
        try {
            await apiClient.post('/api/dev/add-exp', { amount });
            const updatedPlayer = await apiClient.getPlayerInfo();
            gameState.set('player', updatedPlayer);
            PlayerData.updateUI();

            console.log(`✓ Added ${amount} XP (saved to database)`);
            NotificationSystem.show(`+${amount} XP (DEV)`, 'success');
        } catch (error) {
            console.error('Failed to add XP:', error);
            PlayerData.addExp(amount);
            console.warn('⚠ Added XP locally only (not saved to database)');
        }
    },

    // Alias for backward compatibility
    async addXP(amount = 100000) {
        return await this.giveExp(amount);
    },

    /**
     * Add stat points for testing
     */
    addStatPoints(amount = 50) {
        const player = PlayerData.get();
        const current = player.stats.unspentPoints || 0;
        gameState.set('player.stats.unspentPoints', current + amount);
        PlayerData.updateUI();
        console.log(`Added ${amount} stat points`);
    },

    /**
     * Max out a specific stat
     */
    maxStat(stat = 'attack', value = 1000) {
        gameState.set(`player.stats.${stat}`, value);
        PlayerData.updateUI();
        console.log(`Set ${stat} to ${value}`);
    },

    /**
     * Set player level (persists to backend)
     */
    async setLevel(level = 100) {
        try {
            await apiClient.post('/api/dev/set-level', { amount: level });
            const updatedPlayer = await apiClient.getPlayerInfo();
            gameState.set('player', updatedPlayer);
            PlayerData.updateUI();

            console.log(`✓ Set level to ${level} (saved to database)`);
            NotificationSystem.show(`Level set to ${level} (DEV)`, 'success');
        } catch (error) {
            console.error('Failed to set level:', error);
            const expMax = PlayerData.calculateExpForLevel(level);
            gameState.update('player', {
                level: level,
                exp: 0,
                exp_max: expMax
            });
            PlayerData.updateUI();
            console.warn('⚠ Set level locally only (not saved to database)');
        }
    },

    /**
     * Add stamina (persists to backend, can exceed max)
     */
    async giveStamina(amount = 1000) {
        try {
            await apiClient.post('/api/dev/add-stamina', { amount });
            const updatedPlayer = await apiClient.getPlayerInfo();
            gameState.set('player', updatedPlayer);
            PlayerData.updateUI();

            console.log(`✓ Added ${amount} stamina (saved to database)`);
            NotificationSystem.show(`+${amount} Stamina (DEV)`, 'success');
        } catch (error) {
            console.error('Failed to add stamina:', error);
            PlayerData.modifyStamina(amount);
            console.warn('⚠ Added stamina locally only (not saved to database)');
        }
    },

    /**
     * Refill stamina to max (persists to backend)
     */
    async refillStamina() {
        try {
            await apiClient.post('/api/dev/refill-stamina', {});
            const updatedPlayer = await apiClient.getPlayerInfo();
            gameState.set('player', updatedPlayer);
            PlayerData.updateUI();

            console.log('✓ Stamina refilled to max (saved to database)');
            NotificationSystem.show('Stamina refilled! (DEV)', 'success');
        } catch (error) {
            console.error('Failed to refill stamina:', error);
            const player = PlayerData.get();
            gameState.set('player.stamina', player.stamina_max);
            PlayerData.updateUI();
            console.warn('⚠ Refilled stamina locally only (not saved to database)');
        }
    },

    /**
     * Check stamina regeneration status
     */
    checkStaminaRegen() {
        if (typeof StaminaRegen !== 'undefined') {
            console.log('=== STAMINA REGEN STATUS ===');
            console.log('System Active:', StaminaRegen.intervalId !== null);
            console.log('Last Regen Time:', new Date(StaminaRegen.lastRegenTime * 10000).toLocaleTimeString());
            console.log('Current Time:', new Date().toLocaleTimeString());

            const player = PlayerData.get();
            console.log('Current Stamina:', player.stamina);
            console.log('Max Stamina:', player.stamina_max);
            console.log('Regen Amount (10%):', Math.floor(player.stamina_max * 0.1));
            console.log('Will Regen:', player.stamina < player.stamina_max);
            console.log('============================');
        } else {
            console.error('StaminaRegen system not found!');
        }
    },

    /**
     * Manually trigger stamina regeneration for testing
     */
    forceStaminaRegen() {
        const player = PlayerData.get();
        const regenAmount = Math.floor(player.stamina_max * 0.1);

        if (player.stamina < player.stamina_max && regenAmount > 0) {
            const newStamina = Math.min(player.stamina_max, player.stamina + regenAmount);
            gameState.set('player.stamina', newStamina);
            PlayerData.updateUI();
            console.log(`Manually regenerated ${regenAmount} stamina (${player.stamina} -> ${newStamina})`);
            NotificationSystem.show(`+${regenAmount} Stamina regenerated (FORCED)`, 'success', 2000);
        } else {
            console.log('Stamina is already at max or regen amount is 0');
        }
    },

    /**
     * Reset game state
     */
    reset() {
        if (confirm('Reset all game data? This cannot be undone!')) {
            gameState.reset();
            PlayerData.updateUI();
            console.log('Game state reset');
            NotificationSystem.show('Game data reset!', 'warning', 3000);
        }
    },

    /**
     * Show current player stats
     */
    showStats() {
        const player = PlayerData.get();
        console.log('=== PLAYER STATS ===');
        console.log(`Level: ${player.level}`);
        console.log(`XP: ${player.exp} / ${player.exp_max}`);
        console.log(`Gold: ${player.gold}`);
        console.log(`Gems: ${player.gems}`);
        console.log(`Stamina: ${player.stamina} / ${player.stamina_max}`);
        console.log(`Base Attack: ${player.base_attack}`);
        console.log(`Base Defense: ${player.base_defense}`);
        console.log(`Unspent Points: ${player.unspent_stat_points || 0}`);
        console.log(`Total Attack: ${PlayerData.getTotalAttack()}`);
        console.log(`Total Defense: ${PlayerData.getTotalDefense()}`);
        console.log('====================');
        return player;
    },

    /**
     * Export save data
     */
    exportSave() {
        const data = gameState.export();
        console.log('=== SAVE DATA ===');
        console.log(data);
        console.log('=================');
        return data;
    },

    /**
     * Import save data
     */
    importSave(jsonString) {
        if (gameState.import(jsonString)) {
            PlayerData.updateUI();
            console.log('Save data imported successfully');
            NotificationSystem.show('Save data imported!', 'success');
        } else {
            console.error('Failed to import save data');
            NotificationSystem.show('Failed to import save data', 'error');
        }
    },

    /**
     * Quick test: Add lots of resources
     */
    giveResources() {
        this.addGold(1000000);
        this.addGems(10000);
        this.addStatPoints(100);
        this.refillStamina();
        NotificationSystem.show('Resources added!', 'success');
        console.log('Test resources added');
    },

    /**
     * Add sample items to inventory
     */
    giveItems() {
        if (typeof InventoryData !== 'undefined') {
            InventoryData.generateSampleItems();
            console.log('Sample items added to inventory');
        } else {
            console.error('InventoryData not available');
        }
    },

    /**
     * Add eggs for testing
     */
    giveEggs(type = 'basic', count = 3) {
        if (typeof PetData !== 'undefined') {
            for (let i = 0; i < count; i++) {
                PetData.addEgg(type);
            }
            console.log(`Added ${count} ${type} eggs`);
            NotificationSystem.show(`Added ${count} ${type} eggs!`, 'success');
        } else {
            console.error('PetData not available');
        }
    },

    /**
     * Add a specific pet for testing
     */
    givePet(species = 'dragon', level = 1) {
        if (typeof PetData !== 'undefined') {
            const pet = PetData.createPet(species, { level });
            PetData.addPet(pet);
            console.log(`Added ${species} at level ${level}`);
        } else {
            console.error('PetData not available');
        }
    },

    /**
     * Give all pet types for testing
     */
    giveAllPets() {
        if (typeof PetData !== 'undefined' && typeof PetSpecies !== 'undefined') {
            Object.values(PetSpecies).forEach(species => {
                const pet = PetData.createPet(species.id);
                PetData.addPet(pet);
            });
            console.log('Added all pet species to collection');
            NotificationSystem.show('All pet species added!', 'success');
        } else {
            console.error('PetData not available');
        }
    },

    /**
     * Level up a pet (requires pet ID)
     */
    levelUpPet(petId, levels = 10) {
        if (typeof PetData !== 'undefined') {
            const petState = PetData.getPetState();
            const pet = petState.collection.find(p => p.id === petId);

            if (pet) {
                for (let i = 0; i < levels; i++) {
                    if (pet.level < 100) {
                        pet.level++;
                        pet.xp = 0;
                        pet.xpMax = PetData.calculateXPForLevel(pet.level + 1);
                    }
                }
                gameState.set('pets.collection', petState.collection);
                console.log(`Leveled up ${pet.name} by ${levels} levels (now level ${pet.level})`);
                NotificationSystem.show(`${pet.name} is now level ${pet.level}!`, 'success');
            } else {
                console.error(`Pet not found: ${petId}`);
            }
        } else {
            console.error('PetData not available');
        }
    },

    /**
     * Show pet collection info
     */
    showPets() {
        if (typeof PetData !== 'undefined') {
            const petState = PetData.getPetState();
            console.log('=== PET COLLECTION ===');
            console.log(`Eggs: ${petState.eggs.length}`);
            console.log(`Pets: ${petState.collection.length}`);
            console.log('\nCollection:');
            petState.collection.forEach(pet => {
                console.log(`  ${pet.emoji} ${pet.name} - Level ${pet.level} (${pet.species}) ${pet.equipped ? '✓ EQUIPPED' : ''}`);
            });
            console.log('\nAttack Set:', petState.attackSet.filter(p => p).length, '/ 3');
            console.log('Defense Set:', petState.defenseSet.filter(p => p).length, '/ 3');
            console.log('======================');
            return petState;
        } else {
            console.error('PetData not available');
        }
    },

    /**
     * Show help
     */
    help() {
        console.log(`
=== DEV HELPERS ===
Available commands (use DevHelpers.commandName()):

Resources:
  giveGold(amount)      - Add gold (default: 100,000)
  giveGems(amount)      - Add gems (default: 1,000)
  giveExp(amount)       - Add XP (default: 100,000)
  giveStamina(amount)   - Add stamina (default: 1,000)
  addStatPoints(amount) - Add stat points (default: 50)
  refillStamina()       - Refill stamina to max
  giveResources()       - Add lots of everything
  giveItems()           - Add sample legendary items to inventory

Stamina Regeneration:
  checkStaminaRegen()   - Check stamina regen system status
  forceStaminaRegen()   - Manually trigger a regen cycle (for testing)

Pets & Eggs:
  giveEggs(type, count) - Add eggs (types: basic, rare, legendary)
  givePet(species, level) - Add a specific pet (species: dragon, lion, wolf, etc.)
  giveAllPets()         - Add all pet species to collection
  levelUpPet(petId, levels) - Level up a specific pet
  showPets()            - Show pet collection info

Stats:
  maxStat(stat, value) - Set a stat to specific value
  setLevel(level)      - Set player level (default: 100)
  showStats()          - Display all stats

Data:
  exportSave()         - Export save data as JSON
  importSave(json)     - Import save data
  reset()              - Reset all game data

Other:
  help()               - Show this help message

Examples:
  DevHelpers.giveGold(1000000)
  DevHelpers.giveEggs('rare', 5)
  DevHelpers.givePet('dragon', 10)
  DevHelpers.giveAllPets()
  DevHelpers.showPets()
==================
        `);
    }
};

// Make it globally available
window.DevHelpers = DevHelpers;

// Enable dev mode globally
window.DEV_MODE = true;

// Show help in console on load
console.log('%c🎮 DEV MODE ENABLED 🎮', 'color: #ffd700; font-size: 16px; font-weight: bold;');
console.log('%cType DevHelpers.help() for available commands', 'color: #3b82f6; font-size: 12px;');
