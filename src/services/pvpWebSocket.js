/**
 * PVP WebSocket Client
 * Manages real-time communication for PVP Arena
 *
 * Features:
 * - Auto-connect on arena entry
 * - Auto-reconnect on disconnect
 * - Real-time challenge notifications
 * - Live status updates
 * - Event-driven notification system
 */

class PvPWebSocketClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.reconnectTimeout = null;
        this.heartbeatInterval = null;
        this.eventHandlers = {};
        this.pendingChallenges = new Set();
    }

    /**
     * Connect to PVP WebSocket server
     */
    connect() {
        // Don't connect if already connected
        if (this.ws && this.isConnected) {
            console.log('[PVP WS] Already connected');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('[PVP WS] No authentication token found');
            return;
        }

        try {
            // Use ws:// for localhost, wss:// for production
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.hostname === '' ? 'localhost' : window.location.hostname;
            const wsPort = 8001; // Backend port
            const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/api/ws/pvp?token=${token}`;

            console.log('[PVP WS] Connecting to:', wsUrl);

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => this.onOpen();
            this.ws.onmessage = (event) => this.onMessage(event);
            this.ws.onerror = (error) => this.onError(error);
            this.ws.onclose = (event) => this.onClose(event);

        } catch (error) {
            console.error('[PVP WS] Connection error:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket open event
     */
    onOpen() {
        console.log('[PVP WS] Connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Start heartbeat to keep connection alive
        this.startHeartbeat();

        // Emit connected event
        this.emit('connected');

        // Show connection notification
        NotificationSystem.show('Connected to PVP Arena', 'success', 2000);
    }

    /**
     * Handle incoming WebSocket messages
     */
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('[PVP WS] Received:', data);

            // Route message to appropriate handler
            switch (data.type) {
                case 'connected':
                    this.handleConnected(data);
                    break;

                case 'pong':
                    // Heartbeat response
                    break;

                case 'challenge_received':
                    this.handleChallengeReceived(data);
                    break;

                case 'challenge_response':
                    this.handleChallengeResponse(data);
                    break;

                case 'challenge_cancelled':
                    this.handleChallengeCancelled(data);
                    break;

                case 'duel_ready':
                    this.handleDuelReady(data);
                    break;

                case 'online_status':
                    this.handleOnlineStatus(data);
                    break;

                case 'battle_created':
                    this.handleBattleCreated(data);
                    break;

                default:
                    console.warn('[PVP WS] Unknown message type:', data.type);
            }

            // Emit general message event
            this.emit('message', data);

        } catch (error) {
            console.error('[PVP WS] Error parsing message:', error);
        }
    }

    /**
     * Handle WebSocket error
     */
    onError(error) {
        console.error('[PVP WS] Error:', error);
        this.emit('error', error);
    }

    /**
     * Handle WebSocket close
     */
    onClose(event) {
        console.log('[PVP WS] Disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();

        this.emit('disconnected', { code: event.code, reason: event.reason });

        // Only attempt reconnect if not a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimeout) {
            return; // Already scheduled
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`[PVP WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.isConnected) {
                this.ws.send('ping');
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        console.log('[PVP WS] Disconnecting...');

        this.stopHeartbeat();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.isConnected = false;
        this.reconnectAttempts = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // MESSAGE HANDLERS
    // ═══════════════════════════════════════════════════════════

    handleConnected(data) {
        console.log('[PVP WS] Server confirmed connection:', data);
    }

    handleChallengeReceived(data) {
        console.log('[PVP WS] Challenge received from:', data.challenger_name);

        // Store pending challenge
        this.pendingChallenges.add(data.duel_id);

        // Show notification with action buttons
        this.showChallengeNotification(data);

        // Emit event for UI update
        this.emit('challenge_received', data);

        // Reload active duels to show new challenge
        if (typeof loadActiveDuels === 'function') {
            loadActiveDuels();
        }
    }

    handleChallengeResponse(data) {
        console.log('[PVP WS] Challenge response:', data.accepted ? 'ACCEPTED' : 'DECLINED');

        if (data.accepted) {
            NotificationSystem.show(
                `${data.defender_name} accepted your challenge! ⚔️`,
                'success',
                5000
            );

            // Play sound effect if available
            if (typeof AudioManager !== 'undefined') {
                AudioManager.play('challenge_accepted');
            }
        } else {
            NotificationSystem.show(
                `${data.defender_name} declined your challenge`,
                'warning',
                4000
            );
        }

        // Emit event for UI update
        this.emit('challenge_response', data);

        // Reload active duels
        if (typeof loadActiveDuels === 'function') {
            loadActiveDuels();
        }
    }

    handleChallengeCancelled(data) {
        console.log('[PVP WS] Challenge cancelled by:', data.challenger_name);

        this.pendingChallenges.delete(data.duel_id);

        NotificationSystem.show(
            `${data.challenger_name} cancelled their challenge`,
            'info',
            3000
        );

        // Emit event for UI update
        this.emit('challenge_cancelled', data);

        // Reload active duels
        if (typeof loadActiveDuels === 'function') {
            loadActiveDuels();
        }
    }

    handleDuelReady(data) {
        console.log('[PVP WS] Duel ready:', data.duel_id);

        NotificationSystem.show(
            `Duel with ${data.opponent_name} is ready! Enter the arena! 🏟️`,
            'success',
            10000
        );

        // Play dramatic sound
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('duel_ready');
        }

        // Emit event for UI update
        this.emit('duel_ready', data);

        // Reload active duels
        if (typeof loadActiveDuels === 'function') {
            loadActiveDuels();
        }
    }

    handleOnlineStatus(data) {
        console.log('[PVP WS] Online status:', data.username, data.is_online ? 'ONLINE' : 'OFFLINE');

        const status = data.is_online ? 'came online' : 'went offline';
        const icon = data.is_online ? '🟢' : '⚫';

        NotificationSystem.show(
            `${icon} ${data.username} ${status}`,
            'info',
            2000
        );

        // Emit event for UI update
        this.emit('online_status', data);

        // Refresh online players list
        if (typeof loadOnlinePlayers === 'function') {
            setTimeout(() => loadOnlinePlayers(), 500);
        }
    }

    handleBattleCreated(data) {
        console.log('[PVP WS] Battle created:', data.battle_id);

        NotificationSystem.show(
            `Battle starting! Entering arena... ⚔️`,
            'success',
            3000
        );

        // Play battle start sound
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('battle_start');
        }

        // Emit event for UI update
        this.emit('battle_created', data);

        // Automatically navigate to battle
        if (typeof router !== 'undefined') {
            setTimeout(() => {
                router.navigate(`pvp-battle/${data.battle_id}/${data.duel_id}`);
            }, 1000); // Small delay for dramatic effect
        }
    }

    /**
     * Show challenge notification with action buttons
     */
    showChallengeNotification(data) {
        // Create custom notification with accept/decline buttons
        const notification = document.createElement('div');
        notification.className = 'pvp-challenge-notification';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, rgba(157, 31, 52, 0.95), rgba(212, 175, 55, 0.95));
            border: 2px solid var(--gold-bright);
            border-radius: 12px;
            padding: 20px;
            min-width: 350px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
            z-index: 10000;
            animation: slideInRight 0.5s ease;
        `;

        notification.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="font-size: 2rem; margin-bottom: 10px;">⚔️</div>
                <div style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">
                    Challenge Received!
                </div>
                <div style="font-size: 1rem; margin-bottom: 12px;">
                    <strong>${escapeHtml(data.challenger_name)}</strong> challenges you to a duel!
                </div>
                <div style="font-size: 1.1rem; color: var(--gold-bright); margin-bottom: 16px;">
                    ${ColoredThemeIcons.render('gold')} <strong>${data.gold_stake.toLocaleString()}</strong> Gold Stake
                </div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="accept-challenge-${data.duel_id}" style="
                        flex: 1;
                        padding: 12px;
                        background: var(--emerald);
                        border: 2px solid var(--emerald-bright);
                        border-radius: 8px;
                        color: white;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">
                        ⚔️ Accept
                    </button>
                    <button id="decline-challenge-${data.duel_id}" style="
                        flex: 1;
                        padding: 12px;
                        background: rgba(0, 0, 0, 0.4);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-radius: 8px;
                        color: white;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">
                        ✕ Decline
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Add button handlers
        const acceptBtn = document.getElementById(`accept-challenge-${data.duel_id}`);
        const declineBtn = document.getElementById(`decline-challenge-${data.duel_id}`);

        acceptBtn.addEventListener('click', async () => {
            if (typeof respondToChallenge === 'function') {
                await respondToChallenge(data.duel_id, true);
            }
            notification.remove();
        });

        declineBtn.addEventListener('click', async () => {
            if (typeof respondToChallenge === 'function') {
                await respondToChallenge(data.duel_id, false);
            }
            notification.remove();
        });

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 30000);

        // Play sound
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('challenge_received');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // EVENT SYSTEM
    // ═══════════════════════════════════════════════════════════

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    /**
     * Unregister event handler
     */
    off(event, handler) {
        if (!this.eventHandlers[event]) return;

        const index = this.eventHandlers[event].indexOf(handler);
        if (index > -1) {
            this.eventHandlers[event].splice(index, 1);
        }
    }

    /**
     * Emit event to all registered handlers
     */
    emit(event, data) {
        if (!this.eventHandlers[event]) return;

        this.eventHandlers[event].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`[PVP WS] Error in event handler for ${event}:`, error);
            }
        });
    }
}

// Create global singleton instance
const pvpWebSocket = new PvPWebSocketClient();

// Helper function for HTML escaping (if not already available)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
