/**
 * Shop Data Module - API-First Version
 * All operations communicate directly with the backend API
 */

const ShopData = {
    _cache: [],
    _loading: false,

    /**
     * Get all shop items from API
     */
    async getAllItems() {
        return await this.getShopCatalog();
    },

    /**
     * Get shop items by category
     */
    getItemsByCategory(category) {
        if (!this._cache || this._cache.length === 0) {
            return [];
        }

        if (category === 'all') {
            return this._cache;
        }

        return this._cache.filter(item => {
            if (category === 'weapons') {
                return item.item_type === 'weapon' || item.type === 'WEAPON';
            } else if (category === 'armor') {
                return ['helmet', 'armor', 'boots', 'gloves', 'HELMET', 'ARMOR', 'BOOTS', 'GLOVES'].includes(item.item_type || item.type);
            } else if (category === 'accessories') {
                return ['ring', 'ring2', 'amulet', 'RING', 'RING2', 'AMULET'].includes(item.item_type || item.type);
            } else if (category === 'potions' || category === 'consumables') {
                return item.type === 'CONSUMABLE';
            } else if (category === 'equipment') {
                return item.category === 'equipment';
            }
            return item.category === category;
        });
    },

    /**
     * Get shop catalog from API
     */
    async getShopCatalog() {
        if (this._loading) {
            return this._cache;
        }

        if (!apiClient.isAuthenticated()) {
            return [];
        }

        try {
            this._loading = true;
            const catalog = await apiClient.getShopItems();

            // The API returns {equipment: [], eggs: [], food: [], potions: []}
            // Flatten all categories into a single array
            const allItems = [
                ...(catalog.equipment || []),
                ...(catalog.eggs || []),
                ...(catalog.food || []),
                ...(catalog.potions || [])
            ];

            // Transform API items to UI format
            this._cache = allItems.map(item => ({
                id: item.id,
                name: item.name,
                category: this._determineCategory(item),
                type: item.type,
                rarity: item.rarity,
                price: item.price || 0,
                gemPrice: item.gem_price || null,
                level: item.level || 1,
                levelRequirement: item.level || 1,
                stats: item.stats || item.pet_stats || {},
                description: item.description || '',
                item_type: item.type,
                pet_exp: item.pet_exp || 0,
                pet_type: item.pet_type || null,
                icon: item.icon || null,
                // Potion-specific fields
                potion_type: item.potion_type || null,
                effect_value: item.effect_value || 0,
                duration: item.duration || null
            }));

            return this._cache;

        } catch (error) {
            console.error('Failed to get shop items:', error);
            return this._cache;
        } finally {
            this._loading = false;
        }
    },

    /**
     * Determine category from item type
     */
    _determineCategory(item) {
        if (item.type === 'EGG') return 'eggs';
        if (item.type === 'FOOD') return 'food';
        if (item.type === 'CONSUMABLE') return 'potions';
        return 'equipment';
    },

    /**
     * Check if player can afford an item
     */
    canAfford(item) {
        if (!item || !item.price) {
            return false;
        }

        const player = PlayerData.get();
        return player.gold >= item.price;
    },

    /**
     * Check if player meets level requirement
     */
    meetsLevelRequirement(item) {
        if (!item) {
            return false;
        }

        const player = PlayerData.get();
        return player.level >= (item.level || item.levelRequirement || 1);
    },

    /**
     * Check if player can purchase an item
     */
    canPurchase(itemId) {
        const item = this._cache.find(i => i.id === itemId);

        if (!item) {
            return { canPurchase: false, reason: 'Item not found' };
        }

        if (!this.meetsLevelRequirement(item)) {
            return { canPurchase: false, reason: `Requires level ${item.level || item.levelRequirement}` };
        }

        if (!this.canAfford(item)) {
            return { canPurchase: false, reason: 'Insufficient gold' };
        }

        return { canPurchase: true, reason: '' };
    },

    /**
     * Purchase an item from the shop
     */
    async purchaseItem(itemId, currency = 'gold') {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return false;
        }

        try {
            const result = await apiClient.purchaseItem(itemId, currency);

            // Update player data
            const player = await apiClient.getPlayerInfo();
            gameState.set('player', player);
            PlayerData.updateUI();

            // Refresh inventory to show new item
            if (window.InventoryData && window.InventoryData.getInventory) {
                await InventoryData.getInventory();
            }

            NotificationSystem.show(`Purchased ${result.item_name || 'item'}!`, 'success');
            return true;

        } catch (error) {
            NotificationSystem.show(error.message || 'Purchase failed', 'error');
            return false;
        }
    },

    /**
     * Get purchase history from API
     */
    async getPurchaseHistory() {
        if (!apiClient.isAuthenticated()) {
            return [];
        }

        try {
            return await apiClient.getShopHistory();
        } catch (error) {
            console.error('Failed to get shop history:', error);
            return [];
        }
    },

    /**
     * Format price for display
     */
    formatPrice(price) {
        return `${Math.floor(price || 0).toLocaleString('en-US')} Gold`;
    }
};

// Make it globally available
window.ShopData = ShopData;
