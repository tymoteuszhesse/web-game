/**
 * Battle WebSocket Client
 * Handles real-time battle updates via WebSocket connection
 *
 * Usage:
 *   const battleWS = new BattleWebSocket(battleId);
 *   battleWS.connect();
 *   battleWS.on('attack', (data) => { ... });
 *   battleWS.disconnect();
 */

class BattleWebSocket {
    constructor(battleId) {
        this.battleId = battleId;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.isManualDisconnect = false;
        this.eventHandlers = {};
        this.connectionStatus = 'disconnected'; // disconnected, connecting, connected, error
    }

    /**
     * Connect to battle WebSocket
     */
    connect() {
        const token = apiClient.getToken();
        if (!token) {
            console.error('[BattleWS] No authentication token found');
            this.triggerEvent('error', { message: 'Authentication required' });
            return;
        }

        const wsURL = `ws://217.182.65.174/ws/battle/${this.battleId}?token=${token}`;
        console.log(`[BattleWS] Connecting to battle ${this.battleId}...`);

        this.isManualDisconnect = false;
        this.connectionStatus = 'connecting';
        this.ws = new WebSocket(wsURL);

        // Connection opened
        this.ws.onopen = () => {
            console.log(`[BattleWS] Connected to battle ${this.battleId}`);
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.triggerEvent('connected', { battleId: this.battleId });
        };

        // Message received
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('[BattleWS] Message received:', message);
                this.handleMessage(message);
            } catch (error) {
                console.error('[BattleWS] Failed to parse message:', error);
            }
        };

        // Connection closed
        this.ws.onclose = (event) => {
            console.log(`[BattleWS] Disconnected from battle ${this.battleId}`, {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            });

            this.connectionStatus = 'disconnected';
            this.triggerEvent('disconnected', {
                code: event.code,
                reason: event.reason
            });

            // Attempt reconnection if not manually disconnected
            if (!this.isManualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnect();
            } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[BattleWS] Max reconnection attempts reached');
                this.triggerEvent('error', { message: 'Failed to reconnect after multiple attempts' });
            }
        };

        // Connection error
        this.ws.onerror = (error) => {
            console.error('[BattleWS] WebSocket error:', error);
            this.connectionStatus = 'error';
            this.triggerEvent('error', { error });
        };
    }

    /**
     * Handle incoming WebSocket message
     */
    handleMessage(message) {
        const { type, ...data } = message;

        switch (type) {
            case 'connected':
                // Welcome message
                console.log('[BattleWS] Welcome:', message.message);
                this.triggerEvent('welcome', data);
                break;

            case 'player_joined':
                // Another player joined WebSocket
                console.log(`[BattleWS] Player joined: ${data.username} (${data.player_count} total)`);
                this.triggerEvent('player_joined', data);
                break;

            case 'player_left':
                // Player left WebSocket
                console.log(`[BattleWS] Player left: ${data.username} (${data.player_count} total)`);
                this.triggerEvent('player_left', data);
                break;

            case 'player_joined_battle':
                // Player joined battle via API
                console.log(`[BattleWS] ${data.player_name} (Level ${data.player_level}) joined the battle`);
                this.triggerEvent('player_joined_battle', data);
                break;

            case 'attack':
                // Player attacked an enemy
                const criticalText = data.is_critical ? ' CRITICAL HIT!' : '';
                console.log(`[BattleWS] ${data.player_name} dealt ${data.damage} damage${criticalText} to enemy ${data.enemy_id}`);
                this.triggerEvent('attack', data);
                break;

            case 'enemy_defeated':
                // Enemy was defeated
                console.log(`[BattleWS] Enemy ${data.enemy_id} defeated by ${data.defeated_by}`);
                this.triggerEvent('enemy_defeated', data);
                break;

            case 'battle_completed':
                // All enemies defeated
                console.log('[BattleWS] Battle completed! All enemies defeated!');
                this.triggerEvent('battle_completed', data);
                break;

            case 'loot_claimed':
                // Player claimed loot
                console.log(`[BattleWS] ${data.player_name} claimed loot: ${data.gold} gold, ${data.xp} XP`);
                this.triggerEvent('loot_claimed', data);
                break;

            case 'chat':
                // Chat message
                console.log(`[BattleWS] ${data.username}: ${data.message}`);
                this.triggerEvent('chat', data);
                break;

            default:
                console.warn('[BattleWS] Unknown message type:', type);
                this.triggerEvent('unknown', message);
        }
    }

    /**
     * Send chat message
     */
    sendChatMessage(message) {
        if (!this.isConnected()) {
            console.error('[BattleWS] Cannot send message: not connected');
            return false;
        }

        this.ws.send(JSON.stringify({
            type: 'chat',
            message
        }));

        return true;
    }

    /**
     * Reconnect to WebSocket
     */
    reconnect() {
        if (this.isManualDisconnect) {
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 10000);

        console.log(`[BattleWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.triggerEvent('reconnecting', {
            attempt: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts,
            delay
        });

        setTimeout(() => {
            if (!this.isManualDisconnect) {
                this.connect();
            }
        }, delay);
    }

    /**
     * Manually disconnect
     */
    disconnect() {
        console.log('[BattleWS] Manually disconnecting...');
        this.isManualDisconnect = true;

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.connectionStatus = 'disconnected';
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return this.connectionStatus;
    }

    /**
     * Register event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    /**
     * Remove event handler
     */
    off(event, handler) {
        if (!this.eventHandlers[event]) {
            return;
        }

        this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }

    /**
     * Trigger event handlers
     */
    triggerEvent(event, data) {
        if (!this.eventHandlers[event]) {
            return;
        }

        this.eventHandlers[event].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`[BattleWS] Error in ${event} handler:`, error);
            }
        });
    }

    /**
     * Remove all event handlers
     */
    removeAllHandlers() {
        this.eventHandlers = {};
    }
}

// Make it globally available
window.BattleWebSocket = BattleWebSocket;
