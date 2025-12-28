/**
 * API Client Service
 * Handles all HTTP requests to the backend API
 *
 * Base URL: http://localhost:8001
 * Authentication: JWT tokens stored in localStorage
 */

class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:8001';
        this.tokenKey = 'auth_token';
    }

    /**
     * Get stored JWT token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Store JWT token
     */
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
        // Dispatch auth state change event
        window.dispatchEvent(new Event('auth-state-changed'));
    }

    /**
     * Clear JWT token (logout)
     */
    clearToken() {
        localStorage.removeItem(this.tokenKey);
        // Dispatch auth state change event
        window.dispatchEvent(new Event('auth-state-changed'));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Get headers with authentication
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.auth !== false)
        };

        try {
            const response = await fetch(url, config);

            // Parse JSON response
            const data = await response.json();

            // Handle non-2xx responses
            if (!response.ok) {
                console.error('[APIClient] Non-OK response:', response.status, data);

                // Handle 401 Unauthorized
                if (response.status === 401) {
                    console.warn('[APIClient] 401 Unauthorized - clearing token');
                    this.clearToken();
                }

                // Throw error with backend message
                throw new Error(data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error(`[APIClient] request() error [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }

    // ========================================
    // Authentication Endpoints
    // ========================================

    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} username - Username (max 20 chars)
     */
    async register(email, password, username) {
        const response = await this.post('/api/auth/register', {
            email,
            password,
            username
        }, { auth: false });

        // Store token automatically
        if (response.access_token) {
            this.setToken(response.access_token);
        }

        return response;
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(email, password) {
        try {
            const response = await this.post('/api/auth/login', {
                email,
                password
            }, { auth: false });

            // Store token automatically
            if (response.access_token) {
                this.setToken(response.access_token);
            }

            return response;
        } catch (error) {
            console.error('[APIClient] Login request failed:', error);
            throw error;
        }
    }

    /**
     * Logout user (client-side only)
     */
    logout() {
        this.clearToken();
    }

    // ========================================
    // Player Endpoints
    // ========================================

    /**
     * Get current player information
     */
    async getPlayerInfo() {
        return this.get('/api/player/me');
    }

    /**
     * Gain XP (for testing/debugging)
     */
    async gainXP(xpAmount, source = 'manual') {
        return this.post('/api/player/gain-xp', {
            xp_amount: xpAmount,
            source
        });
    }

    /**
     * Allocate stat points
     */
    async allocateStats(attack = 0, defense = 0, maxStamina = 0) {
        return this.post('/api/player/allocate-stats', {
            attack,
            defense,
            max_stamina: maxStamina
        });
    }

    // ========================================
    // Battle Endpoints
    // ========================================

    /**
     * Create a new battle (admin/testing)
     */
    async createBattle(difficulty = 'medium', waveNumber = 1, requiredLevel = 1, maxPlayers = 10) {
        return this.post('/api/battles/create', {
            difficulty,
            wave_number: waveNumber,
            required_level: requiredLevel,
            max_players: maxPlayers
        });
    }

    /**
     * Get list of available battles
     */
    async getAvailableBattles() {
        return this.get('/api/battles/available');
    }

    /**
     * Get list of available boss raids
     */
    async getAvailableBossRaids() {
        return this.get('/api/battles/boss-raids/available');
    }

    /**
     * Get detailed battle information
     */
    async getBattleDetails(battleId) {
        return this.get(`/api/battles/${battleId}`);
    }

    /**
     * Join a battle
     */
    async joinBattle(battleId) {
        return this.post(`/api/battles/join/${battleId}`);
    }

    /**
     * Attack an enemy in battle
     * @param {number} battleId - Battle ID
     * @param {number} enemyId - Enemy ID
     * @param {string} attackType - Attack type (quick, normal, power, critical, ultimate)
     */
    async attackEnemy(battleId, enemyId, attackType = 'normal') {
        return this.post(`/api/battles/${battleId}/attack`, {
            enemy_id: enemyId,
            attack_type: attackType
        });
    }

    /**
     * Claim loot from completed battle
     */
    async claimLoot(battleId) {
        return this.post(`/api/battles/${battleId}/claim-loot`);
    }

    /**
     * Get player's battle history
     */
    async getBattleHistory(limit = 50) {
        return this.get(`/api/battles/history/me?limit=${limit}`);
    }

    /**
     * Update player stats (for debugging)
     * @param {Object} updates - Stats to update (e.g., { base_attack: 100, gold: 1000, level: 20 })
     */
    async updatePlayerStats(updates) {
        return this.post('/api/players/debug/update-stats', updates);
    }

    // ========================================
    // Inventory Endpoints (Future)
    // ========================================

    /**
     * Get player's inventory
     */
    async getInventory() {
        return await this.request('/api/inventory/');
    }

    /**
     * Equip an item
     */
    async equipItem(itemId, slot, setType = 'attack') {
        return await this.request('/api/inventory/equip', {
            method: 'POST',
            body: JSON.stringify({ item_id: itemId, slot, set_type: setType })
        });
    }

    /**
     * Unequip an item
     */
    async unequipItem(slot, setType = 'attack') {
        return await this.request('/api/inventory/unequip', {
            method: 'POST',
            body: JSON.stringify({ slot, set_type: setType })
        });
    }

    /**
     * Get inventory stats for a set (attack/defense)
     */
    async getInventoryStats(setType = 'attack') {
        return await this.request(`/api/inventory/stats/${setType}`);
    }

    /**
     * Get starter items (one-time only)
     */
    async getStarterItems() {
        return await this.request('/api/inventory/starter-items', {
            method: 'POST'
        });
    }

    // ========================================
    // Shop Endpoints (Future)
    // ========================================

    /**
     * Get shop items
     */
    async getShopItems() {
        return await this.request('/api/shop/items');
    }

    /**
     * Purchase an item from shop
     */
    async purchaseItem(itemId, currency = 'gold') {
        return await this.request('/api/shop/purchase', {
            method: 'POST',
            body: JSON.stringify({ item_id: itemId, currency })
        });
    }

    /**
     * Get purchase history
     */
    async getShopHistory() {
        return await this.request('/api/shop/history');
    }

    // ========================================
    // Pet Endpoints (Future)
    // ========================================

    /**
     * Get player's pet collection
     */
    async getPets() {
        return await this.request('/api/pets/');
    }

    /**
     * Buy a pet egg
     */
    async buyPetEgg() {
        return await this.request('/api/pets/egg', {
            method: 'POST'
        });
    }

    /**
     * Hatch a pet egg
     */
    async hatchPet(eggId, name) {
        return await this.request('/api/pets/hatch', {
            method: 'POST',
            body: JSON.stringify({ pet_id: eggId, name })
        });
    }

    /**
     * Feed a pet to gain XP
     */
    async feedPet(petId, foodAmount) {
        return await this.request('/api/pets/feed', {
            method: 'POST',
            body: JSON.stringify({ pet_id: petId, xp_amount: foodAmount })
        });
    }

    /**
     * Equip a pet to battle set
     */
    async equipPet(petId, slot, setType = 'attack') {
        // Convert slot from "pet_1" format to integer (1, 2, 3)
        const slotNumber = typeof slot === 'string' ? parseInt(slot.split('_')[1]) : slot;

        return await this.request('/api/pets/equip', {
            method: 'POST',
            body: JSON.stringify({ pet_id: petId, slot: slotNumber, set_type: setType })
        });
    }

    /**
     * Unequip a pet from battle set
     */
    async unequipPet(slot, setType = 'attack') {
        // Convert slot from "pet_1" format to integer (1, 2, 3)
        const slotNumber = typeof slot === 'string' ? parseInt(slot.split('_')[1]) : slot;

        return await this.request('/api/pets/unequip', {
            method: 'POST',
            body: JSON.stringify({ slot: slotNumber, set_type: setType })
        });
    }

    /**
     * Get pet stats for a set (attack/defense)
     */
    async getPetStats(setType = 'attack') {
        return await this.request(`/api/pets/stats/${setType}`);
    }
}

// Create global API client instance
const apiClient = new APIClient();

// Make it globally available
window.apiClient = apiClient;
