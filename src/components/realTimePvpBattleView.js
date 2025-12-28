/**
 * Real-Time PVP Battle View
 * Live combat arena with WebSocket-powered turn-based battle
 */

class PvPBattleConnection {
    constructor(battleId, token) {
        this.battleId = battleId;
        this.token = token;
        this.ws = null;
        this.isConnected = false;
        this.eventHandlers = {};
        this.myPlayerId = null;
        this.opponentId = null;
    }

    connect() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname === '' ? 'localhost' : window.location.hostname;
        const wsPort = 8001;
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/api/ws/pvp-battle/${this.battleId}?token=${this.token}`;

        console.log('[PVP Battle WS] Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('[PVP Battle WS] Connected');
            this.isConnected = true;
            this.emit('connected');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('[PVP Battle WS] Received:', data);
            this.emit(data.type, data);
        };

        this.ws.onerror = (error) => {
            console.error('[PVP Battle WS] Error:', error);
            this.emit('error', error);
        };

        this.ws.onclose = () => {
            console.log('[PVP Battle WS] Disconnected');
            this.isConnected = false;
            this.emit('disconnected');
        };
    }

    send(message) {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
        }
    }

    sendReady() {
        this.send({ type: 'ready' });
    }

    sendAction(action) {
        this.send({ type: 'action', action });
    }

    sendForfeit() {
        this.send({ type: 'forfeit' });
    }

    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

/**
 * Create Real-Time PVP Battle View
 */
async function createRealTimePvpBattleView(battleId, duelId) {
    const container = document.createElement('div');
    container.className = 'pvp-battle-container';

    // Initialize battle connection
    const token = localStorage.getItem('auth_token');
    const battleWS = new PvPBattleConnection(battleId, token);

    // Battle state
    let currentPhase = 'waiting';
    let myPlayerId = null;
    let opponentId = null;
    let myPlayerData = null;
    let opponentData = null;
    let currentTurn = 1;
    let selectedAction = null;
    let actionSubmitted = false;

    // Create battle UI
    container.innerHTML = `
        <div class="battle-arena">
            <!-- Battle Header -->
            <div class="battle-header">
                <div class="battle-title">
                    <span class="battle-icon">⚔️</span>
                    <h2>DUEL ARENA</h2>
                    <span class="battle-icon">⚔️</span>
                </div>
                <div class="battle-status" id="battle-status">READY TO FIGHT!</div>
                <div class="gold-stake-display">
                    ${ColoredThemeIcons.render('gold')}
                    <span id="stake-amount">100</span>
                </div>
            </div>

            <!-- Battle Arena -->
            <div class="battle-field">
                <!-- Player Side (Left) -->
                <div class="fighter-container player-side">
                    <div class="fighter-card" id="player-card">
                        <div class="fighter-name" id="player-name">YOU</div>
                        <div class="fighter-level">Lv. <span id="player-level">25</span></div>
                        <div class="fighter-avatar">🧙</div>
                        <div class="fighter-hp-bar">
                            <div class="hp-bar-fill" id="player-hp-fill" style="width: 100%"></div>
                        </div>
                        <div class="fighter-hp-text">
                            <span id="player-hp">100</span> / <span id="player-max-hp">100</span> HP
                        </div>
                        <div class="fighter-stats">
                            <div class="stat-item">⚔️ <span id="player-attack">50</span></div>
                            <div class="stat-item">🛡️ <span id="player-defense">30</span></div>
                        </div>
                    </div>
                </div>

                <!-- VS Indicator -->
                <div class="vs-indicator">
                    <div class="vs-text">VS</div>
                    <div class="turn-counter">
                        Turn <span id="turn-number">1</span>
                    </div>
                </div>

                <!-- Opponent Side (Right) -->
                <div class="fighter-container opponent-side">
                    <div class="fighter-card" id="opponent-card">
                        <div class="fighter-name" id="opponent-name">MAGEQUEEN</div>
                        <div class="fighter-level">Lv. <span id="opponent-level">22</span></div>
                        <div class="fighter-avatar">⚔️</div>
                        <div class="fighter-hp-bar">
                            <div class="hp-bar-fill opponent-hp" id="opponent-hp-fill" style="width: 100%"></div>
                        </div>
                        <div class="fighter-hp-text">
                            <span id="opponent-hp">100</span> / <span id="opponent-max-hp">100</span> HP
                        </div>
                        <div class="fighter-stats">
                            <div class="stat-item">⚔️ <span id="opponent-attack">45</span></div>
                            <div class="stat-item">🛡️ <span id="opponent-defense">35</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Battle Log -->
            <div class="battle-log-container">
                <div class="battle-log-title">Combat Log</div>
                <div class="battle-log" id="battle-log">
                    <div class="log-entry system-message">Battle will begin when both players are ready...</div>
                </div>
            </div>

            <!-- Action Controls -->
            <div class="action-controls" id="action-controls">
                <div class="action-instructions" id="action-instructions">
                    Click ENTER ARENA when ready!
                </div>
                <div class="action-buttons" id="action-buttons" style="display: none;">
                    <button class="action-btn attack-btn" data-action="attack">
                        <span class="action-icon">⚔️</span>
                        <span class="action-name">ATTACK</span>
                        <span class="action-desc">Standard damage</span>
                    </button>
                    <button class="action-btn defend-btn" data-action="defend">
                        <span class="action-icon">🛡️</span>
                        <span class="action-name">DEFEND</span>
                        <span class="action-desc">Reduce incoming damage</span>
                    </button>
                    <button class="action-btn special-btn" data-action="special">
                        <span class="action-icon">✨</span>
                        <span class="action-name">SPECIAL</span>
                        <span class="action-desc">30% chance critical hit</span>
                    </button>
                </div>
                <button class="ready-btn" id="ready-btn">
                    <span>⚔️</span> ENTER ARENA
                </button>
                <button class="forfeit-btn" id="forfeit-btn" style="display: none;">
                    Forfeit Battle
                </button>
            </div>

            <!-- Battle Result Modal -->
            <div class="battle-result-modal" id="battle-result" style="display: none;">
                <div class="result-content">
                    <div class="result-icon" id="result-icon">👑</div>
                    <div class="result-title" id="result-title">VICTORY!</div>
                    <div class="result-message" id="result-message">
                        You defeated your opponent!
                    </div>
                    <div class="result-rewards">
                        <div class="reward-item">
                            ${ColoredThemeIcons.render('gold')}
                            <span id="result-gold">+200</span>
                        </div>
                    </div>
                    <button class="result-btn" id="result-btn">Return to Arena</button>
                </div>
            </div>
        </div>
    `;

    // DOM elements
    const battleStatus = container.querySelector('#battle-status');
    const battleLog = container.querySelector('#battle-log');
    const readyBtn = container.querySelector('#ready-btn');
    const actionButtons = container.querySelector('#action-buttons');
    const actionInstructions = container.querySelector('#action-instructions');
    const forfeitBtn = container.querySelector('#forfeit-btn');
    const battleResult = container.querySelector('#battle-result');
    const turnNumber = container.querySelector('#turn-number');

    // Helper functions
    function updatePlayerUI(playerId, data) {
        const isPlayer = playerId === myPlayerId;
        const prefix = isPlayer ? 'player' : 'opponent';

        document.getElementById(`${prefix}-name`).textContent = isPlayer ? 'YOU' : data.name;
        document.getElementById(`${prefix}-level`).textContent = data.level || 1;
        document.getElementById(`${prefix}-hp`).textContent = data.hp;
        document.getElementById(`${prefix}-max-hp`).textContent = data.max_hp;
        document.getElementById(`${prefix}-attack`).textContent = data.attack;
        document.getElementById(`${prefix}-defense`).textContent = data.defense;

        const hpPercent = (data.hp / data.max_hp) * 100;
        document.getElementById(`${prefix}-hp-fill`).style.width = `${hpPercent}%`;
    }

    function addLogEntry(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}-message`;
        entry.textContent = message;
        battleLog.appendChild(entry);
        battleLog.scrollTop = battleLog.scrollHeight;
    }

    function updateTurnDisplay(turn) {
        currentTurn = turn;
        turnNumber.textContent = turn;
    }

    function showActionSelection() {
        actionButtons.style.display = 'flex';
        actionInstructions.textContent = 'Choose your action:';
        actionSubmitted = false;
        selectedAction = null;

        // Reset button states
        container.querySelectorAll('.action-btn').forEach(btn => {
            btn.classList.remove('selected', 'disabled');
            btn.disabled = false;
        });
    }

    function hideActionSelection() {
        actionButtons.style.display = 'none';
        actionInstructions.textContent = 'Waiting for opponent...';
    }

    function showBattleResult(isWinner, goldReward) {
        battleResult.style.display = 'flex';

        if (isWinner) {
            document.getElementById('result-icon').textContent = '👑';
            document.getElementById('result-title').textContent = 'VICTORY!';
            document.getElementById('result-message').textContent = 'You defeated your opponent!';
            document.getElementById('result-gold').textContent = `+${goldReward}`;
        } else {
            document.getElementById('result-icon').textContent = '💀';
            document.getElementById('result-title').textContent = 'DEFEAT';
            document.getElementById('result-message').textContent = 'You have been defeated...';
            document.getElementById('result-gold').textContent = `-${goldReward / 2}`;
        }

        // Add event listener to return button (now that it exists)
        const resultBtn = document.getElementById('result-btn');
        if (resultBtn) {
            resultBtn.addEventListener('click', () => {
                router.navigate('pvp-arena');
            });
        }
    }

    // Event handlers
    readyBtn.addEventListener('click', () => {
        battleWS.sendReady();
        readyBtn.disabled = true;
        readyBtn.textContent = 'Waiting for opponent...';
        addLogEntry('You are ready! Waiting for opponent...', 'system');
    });

    // Action button clicks
    container.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (actionSubmitted) return;

            const action = btn.dataset.action;
            selectedAction = action;

            // Visual feedback
            container.querySelectorAll('.action-btn').forEach(b => {
                b.classList.remove('selected');
                b.classList.add('disabled');
            });
            btn.classList.add('selected');
            btn.classList.remove('disabled');

            // Submit action
            battleWS.sendAction(action);
            actionSubmitted = true;
            hideActionSelection();
            addLogEntry(`You chose ${action.toUpperCase()}!`, 'player');
        });
    });

    forfeitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to forfeit? You will lose the duel.')) {
            battleWS.sendForfeit();
            addLogEntry('You forfeited the battle', 'system');
        }
    });

    // WebSocket event handlers
    battleWS.on('battle_state', (data) => {
        myPlayerId = data.your_id;
        opponentId = data.opponent_id;
        currentPhase = data.phase;
        currentTurn = data.turn;
    });

    battleWS.on('battle_start', (data) => {
        currentPhase = 'combat';
        readyBtn.style.display = 'none';
        forfeitBtn.style.display = 'block';

        // Set player data
        const playerData = data.player1.id === myPlayerId ? data.player1 : data.player2;
        const oppData = data.player1.id === myPlayerId ? data.player2 : data.player1;

        myPlayerData = playerData;
        opponentData = oppData;

        updatePlayerUI(myPlayerId, playerData);
        updatePlayerUI(opponentId, oppData);

        document.getElementById('stake-amount').textContent = data.gold_stake;

        battleStatus.textContent = 'BATTLE IN PROGRESS';
        addLogEntry('⚔️ BATTLE STARTED! ⚔️', 'system');
        addLogEntry(`${playerData.name} VS ${oppData.name}`, 'system');

        // Show action selection
        showActionSelection();
    });

    battleWS.on('player_ready', (data) => {
        if (data.player_id === myPlayerId) {
            addLogEntry('You are ready!', 'player');
        } else {
            addLogEntry('Opponent is ready!', 'opponent');
        }

        if (data.ready_count === 2) {
            battleStatus.textContent = 'BOTH PLAYERS READY - STARTING BATTLE!';
        }
    });

    battleWS.on('request_action', (data) => {
        updateTurnDisplay(data.turn);
        showActionSelection();
        addLogEntry(`--- Turn ${data.turn} ---`, 'system');
    });

    battleWS.on('opponent_action_submitted', () => {
        addLogEntry('Opponent has chosen their action!', 'opponent');
    });

    battleWS.on('turn_result', (data) => {
        // Show actions
        const myAction = data.actions[myPlayerId];
        const oppAction = data.actions[opponentId];

        addLogEntry(`You used ${myAction.toUpperCase()}!`, 'player');
        addLogEntry(`Opponent used ${oppAction.toUpperCase()}!`, 'opponent');

        // Show effects
        if (data.effects && data.effects.length > 0) {
            data.effects.forEach(effect => {
                addLogEntry(effect, 'effect');
            });
        }

        // Show damage
        const myDamage = data.damage[myPlayerId];
        const oppDamage = data.damage[opponentId];

        if (myDamage > 0) {
            addLogEntry(`You took ${myDamage} damage!`, 'damage');
        }
        if (oppDamage > 0) {
            addLogEntry(`Opponent took ${oppDamage} damage!`, 'damage');
        }

        // Update HP
        myPlayerData.hp = data.hp[myPlayerId];
        opponentData.hp = data.hp[opponentId];

        updatePlayerUI(myPlayerId, myPlayerData);
        updatePlayerUI(opponentId, opponentData);
    });

    battleWS.on('battle_end', async (data) => {
        currentPhase = 'finished';

        const isWinner = data.winner_id === myPlayerId;

        addLogEntry('⚔️ BATTLE ENDED! ⚔️', 'system');
        if (data.winner_id) {
            addLogEntry(`${data.winner_name} is victorious!`, 'system');
        } else {
            addLogEntry('The battle ended in a draw!', 'system');
        }

        // Hide action controls
        container.querySelector('#action-controls').style.display = 'none';

        // Show result
        setTimeout(() => {
            showBattleResult(isWinner, data.gold_reward);
        }, 2000);

        // Complete duel on backend
        if (data.winner_id) {
            try {
                await apiClient.request(`/api/pvp/duel/${duelId}/complete`, {
                    method: 'POST',
                    body: JSON.stringify({ winner_id: data.winner_id })
                });
            } catch (error) {
                console.error('Failed to complete duel:', error);
            }
        }
    });

    battleWS.on('battle_forfeit', (data) => {
        if (data.forfeiter_id === myPlayerId) {
            addLogEntry('You forfeited the battle!', 'system');
            showBattleResult(false, 0);
        } else {
            addLogEntry('Opponent forfeited! You win!', 'system');
            showBattleResult(true, data.gold_reward || 0);
        }
    });

    // Connect to battle
    battleWS.connect();

    // Cleanup
    window.addEventListener('beforeunload', () => {
        battleWS.disconnect();
    });

    return container;
}

// Make function globally available
window.createRealTimePvpBattleView = createRealTimePvpBattleView;
