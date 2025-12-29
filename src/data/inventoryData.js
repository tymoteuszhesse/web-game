/**
 * Inventory & Equipment System - API-First Version
 * All operations communicate directly with the backend API
 */

// Item rarity types
const ItemRarity = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

// Equipment slots
const EquipmentSlot = {
    WEAPON: 'weapon',
    HELMET: 'helmet',
    ARMOR: 'armor',
    BOOTS: 'boots',
    GLOVES: 'gloves',
    RING: 'ring',
    RING2: 'ring2',
    AMULET: 'amulet'
};

const InventoryData = {
    // Cache for UI rendering (updated from API)
    _cache: { items: [], attackSet: {}, defenseSet: {} },
    _loading: false,

    /**
     * Get inventory from API
     */
    async getInventory() {
        if (window.DEV_MODE) {
            console.log('📦 getInventory() called');
        }

        if (this._loading) {
            return this._cache;
        }

        if (!apiClient.isAuthenticated()) {
            return { items: [], attackSet: {}, defenseSet: {} };
        }

        try {
            this._loading = true;
            const response = await apiClient.getInventory();

            if (window.DEV_MODE) {
                console.log('📦 API response received:', {
                    itemCount: response.items?.length,
                    hasAttackSet: !!response.attack_set,
                    hasDefenseSet: !!response.defense_set
                });
            }

            // The API returns {items: [], attack_set: {}, defense_set: {}}
            // Transform API response to UI format
            const inventory = {
                items: [],
                attackSet: this._transformEquipmentSet(response.attack_set),
                defenseSet: this._transformEquipmentSet(response.defense_set)
            };

            // Transform unequipped items
            if (response.items && Array.isArray(response.items)) {
                response.items.forEach(item => {
                    let transformedItem = {
                        id: item.id,
                        name: item.name,
                        type: item.item_type,
                        item_type: item.item_type,  // Keep original for filtering
                        rarity: item.rarity,
                        level: item.level_requirement || 1,
                        stats: {
                            attack: item.attack_bonus || 0,
                            defense: item.defense_bonus || 0,
                            hp: item.hp_bonus || 0
                        },
                        quantity: item.quantity || 1,
                        icon: item.icon || null,  // Add icon property from API
                        properties: item.properties || null  // Add properties for potions
                    };

                    // Enrich with shop data if icon is missing
                    transformedItem = this._enrichItemWithShopData(transformedItem);

                    inventory.items.push(transformedItem);
                });
            }

            this._cache = inventory;

            // Update potion count in header
            this._updatePotionCount();

            return inventory;

        } catch (error) {
            return this._cache;
        } finally {
            this._loading = false;
        }
    },

    /**
     * Update potion count display in header
     */
    _updatePotionCount() {
        const potionCountEl = document.getElementById('potion-count');
        if (potionCountEl) {
            const potions = this._cache.items.filter(item => item.item_type === 'consumable');
            const totalCount = potions.reduce((sum, potion) => sum + (potion.quantity || 0), 0);
            potionCountEl.textContent = totalCount;
        }
    },

    /**
     * Enrich item with icon from shop catalog if missing
     */
    _enrichItemWithShopData(item) {
        // If item already has icon, return as-is
        if (item.icon) return item;

        // Try to find matching item in shop catalog by name
        if (window.ShopData && window.ShopData._cache) {
            // Normalize types for comparison (both to uppercase)
            const itemType = (item.type || '').toUpperCase();

            const shopItem = ShopData._cache.find(si => {
                const shopType = (si.type || '').toUpperCase();
                const nameMatch = si.name === item.name;
                const typeMatch = shopType === itemType;
                return nameMatch && typeMatch;
            });

            if (shopItem && shopItem.icon) {
                item.icon = shopItem.icon;
            }
            // Silently fail if not found - some items may not be in shop catalog
        }

        return item;
    },

    /**
     * Transform equipment set from API format to UI format
     */
    _transformEquipmentSet(equipmentSet) {
        if (!equipmentSet) return {};

        const transformed = {};
        const slots = ['weapon', 'helmet', 'armor', 'boots', 'gloves', 'ring', 'ring2', 'amulet'];

        slots.forEach(slot => {
            const item = equipmentSet[slot];
            if (item) {
                let transformedItem = {
                    id: item.id,
                    name: item.name,
                    type: item.item_type,
                    rarity: item.rarity,
                    level: item.level_requirement || 1,
                    stats: {
                        attack: item.attack_bonus || 0,
                        defense: item.defense_bonus || 0,
                        hp: item.hp_bonus || 0
                    },
                    quantity: item.quantity || 1,
                    icon: item.icon || null  // Add icon property from API
                };

                // Enrich with shop data if icon is missing
                transformedItem = this._enrichItemWithShopData(transformedItem);

                transformed[slot] = transformedItem;
            }
        });

        return transformed;
    },

    /**
     * Get equipped items for a specific set
     */
    getEquipped(setType = 'attack') {
        return this._cache[setType === 'attack' ? 'attackSet' : 'defenseSet'] || {};
    },

    /**
     * Get unequipped items (only equipment, exclude consumables)
     */
    getUnequippedItems() {
        const items = this._cache.items || [];
        // Filter out consumables/potions - they have their own view
        return items.filter(item => item.item_type !== 'consumable');
    },

    /**
     * Equip an item
     */
    async equip(itemId, setType = 'attack') {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return false;
        }

        try {
            // Find item to get its slot
            const item = this._cache.items.find(i => i.id === itemId);
            if (!item) {
                NotificationSystem.show('Item not found', 'error');
                return false;
            }

            // Determine slot from item type
            let slot = item.type.toLowerCase();

            // Handle ring slots
            const equipped = this.getEquipped(setType);
            if (slot === 'ring' && equipped['ring']) {
                slot = 'ring2';
            }

            // Call API
            await apiClient.equipItem(itemId, slot, setType);

            // Refresh inventory
            await this.getInventory();

            NotificationSystem.show(`Equipped ${item.name}!`, 'success');
            PlayerData.updateUI();
            return true;

        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to equip item', 'error');
            return false;
        }
    },

    /**
     * Unequip an item
     */
    async unequip(slot, setType = 'attack') {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return false;
        }

        try {
            await apiClient.unequipItem(slot, setType);

            // Refresh inventory
            await this.getInventory();

            NotificationSystem.show('Item unequipped!', 'info');
            PlayerData.updateUI();
            return true;

        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to unequip item', 'error');
            return false;
        }
    },

    /**
     * Get starter items from API
     */
    async getStarterItems() {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return [];
        }

        try {
            const result = await apiClient.getStarterItems();
            await this.getInventory();
            NotificationSystem.show('Starter items received!', 'success');
            return result;
        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to get starter items', 'error');
            return [];
        }
    },

    /**
     * Calculate total stats from equipped items
     */
    getEquippedStats(setType = 'attack') {
        const equipped = this.getEquipped(setType);
        const stats = { attack: 0, defense: 0, hp: 0 };

        Object.values(equipped).forEach(item => {
            if (item && item.stats) {
                stats.attack += item.stats.attack || 0;
                stats.defense += item.stats.defense || 0;
                stats.hp += item.stats.hp || 0;
            }
        });

        return stats;
    },

    /**
     * Get total attack stat from attack set
     */
    getTotalAttackSetDamage() {
        const stats = this.getEquippedStats('attack');
        return stats.attack;
    },

    /**
     * Get total defense stat from defense set
     */
    getTotalDefenseSetDamage() {
        const stats = this.getEquippedStats('defense');
        return stats.defense;
    },

    /**
     * Get rarity color
     */
    getRarityColor(rarity) {
        const colors = {
            [ItemRarity.COMMON]: '#9ca3af',
            [ItemRarity.UNCOMMON]: '#22c55e',
            [ItemRarity.RARE]: '#3b82f6',
            [ItemRarity.EPIC]: '#a855f7',
            [ItemRarity.LEGENDARY]: '#ff6b35'
        };
        return colors[rarity] || colors[ItemRarity.COMMON];
    },

    /**
     * Get rarity label
     */
    getRarityLabel(rarity) {
        return rarity ? rarity.toUpperCase() : 'COMMON';
    }
};

// Make it globally available
window.InventoryData = InventoryData;
window.ItemRarity = ItemRarity;
window.EquipmentSlot = EquipmentSlot;
