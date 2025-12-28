/**
 * PVP Arena - Dueling System
 * Medieval tournament-style player vs player combat with gold stakes
 *
 * Features:
 * - Online players list with live status
 * - Duel challenge system with gold wagering
 * - Real-time duel notifications
 * - Tournament-style presentation
 */

/**
 * Create PVP Arena View
 */
async function createPvpArenaView() {
    const container = document.createElement('div');
    container.className = 'pvp-arena-container';

    // Connect to PVP WebSocket for real-time notifications
    if (typeof pvpWebSocket !== 'undefined') {
        if (!pvpWebSocket.isConnected) {
            pvpWebSocket.connect();
        }

        // Listen for battle_created events to auto-navigate
        pvpWebSocket.on('battle_created', (data) => {
            console.log('[Arena] Battle created notification received:', data);
            // Navigate to battle
            setTimeout(() => {
                router.navigate(`pvp-battle/${data.battle_id}/${data.duel_id}`);
            }, 500);
        });
    }

    // Back button
    const backBtn = createBackButton();
    backBtn.style.marginBottom = 'var(--space-xl)';
    container.appendChild(backBtn);

    // Arena Header with medieval tournament aesthetic
    const header = document.createElement('div');
    header.className = 'arena-header';
    header.innerHTML = `
        <div class="arena-title-ornament">⚔</div>
        <div class="arena-title-content">
            <h1 class="arena-title">The Dueling Arena</h1>
            <p class="arena-subtitle">Challenge worthy opponents to honorable combat</p>
        </div>
        <div class="arena-title-ornament">⚔</div>
    `;
    container.appendChild(header);

    // Stats Banner - Player's Arena Record
    const statsBanner = document.createElement('div');
    statsBanner.className = 'arena-stats-banner';
    statsBanner.innerHTML = `
        <div class="arena-stat">
            <div class="arena-stat-label">Victories</div>
            <div class="arena-stat-value" id="pvp-wins">0</div>
        </div>
        <div class="arena-stat arena-stat-featured">
            <div class="arena-stat-label">Win Rate</div>
            <div class="arena-stat-value" id="pvp-winrate">0%</div>
        </div>
        <div class="arena-stat">
            <div class="arena-stat-label">Defeats</div>
            <div class="arena-stat-value" id="pvp-losses">0</div>
        </div>
        <div class="arena-stat">
            <div class="arena-stat-label">Gold Wagered</div>
            <div class="arena-stat-value" id="pvp-gold-wagered">0</div>
        </div>
    `;
    container.appendChild(statsBanner);

    // Main Content - Two Column Layout
    const mainContent = document.createElement('div');
    mainContent.className = 'arena-main-content';

    // Left Column - Challenge Panel
    const challengePanel = createChallengePanel();
    mainContent.appendChild(challengePanel);

    // Right Column - Online Players
    const playersPanel = createOnlinePlayersPanel();
    mainContent.appendChild(playersPanel);

    container.appendChild(mainContent);

    // Active Duels Section
    const activeDuelsSection = createActiveDuelsSection();
    container.appendChild(activeDuelsSection);

    // Initialize event listeners and load data after DOM is mounted
    setTimeout(async () => {
        initializeEventListeners();
        await loadArenaData();
    }, 10);

    return container;
}

/**
 * Create Challenge Panel - Configure and send duel requests
 */
function createChallengePanel() {
    const panel = document.createElement('div');
    panel.className = 'arena-panel challenge-panel';

    panel.innerHTML = `
        <div class="panel-header">
            <h2 class="panel-title">
                <span class="panel-icon">🛡️</span>
                Issue Challenge
            </h2>
        </div>
        <div class="panel-body">
            <div class="challenge-form">
                <!-- Gold Stake Selector -->
                <div class="form-group">
                    <label class="form-label">
                        <span class="label-icon">${ColoredThemeIcons.render('gold')}</span>
                        Gold Stake
                    </label>
                    <div class="stake-selector">
                        <button class="stake-preset" data-amount="100">100</button>
                        <button class="stake-preset" data-amount="500">500</button>
                        <button class="stake-preset" data-amount="1000">1,000</button>
                        <button class="stake-preset" data-amount="5000">5,000</button>
                    </div>
                    <div class="stake-custom">
                        <input
                            type="number"
                            id="custom-stake-input"
                            class="stake-input"
                            placeholder="Custom amount..."
                            min="10"
                            max="999999"
                        />
                        <div class="stake-info">
                            <small>Your gold: <span id="player-gold-display">0</span></small>
                        </div>
                    </div>
                </div>

                <!-- Selected Opponent Display -->
                <div class="form-group">
                    <label class="form-label">Selected Opponent</label>
                    <div id="selected-opponent-display" class="selected-opponent">
                        <div class="no-selection">
                            <span class="no-selection-icon">👤</span>
                            <span>Choose an opponent from the arena</span>
                        </div>
                    </div>
                </div>

                <!-- Challenge Button -->
                <button id="send-challenge-btn" class="challenge-submit-btn" disabled>
                    <span class="btn-icon">⚔️</span>
                    <span class="btn-text">Send Challenge</span>
                </button>

                <!-- Rules Section -->
                <div class="arena-rules">
                    <div class="rules-title">Arena Rules</div>
                    <ul class="rules-list">
                        <li>Both players wager equal gold amounts</li>
                        <li>Winner takes all wagered gold</li>
                        <li>Both players earn experience from combat</li>
                        <li>Declining costs 10% of the stake</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    return panel;
}

/**
 * Create Online Players Panel - List of available opponents
 */
function createOnlinePlayersPanel() {
    const panel = document.createElement('div');
    panel.className = 'arena-panel players-panel';

    panel.innerHTML = `
        <div class="panel-header">
            <h2 class="panel-title">
                <span class="panel-icon">👥</span>
                Warriors Online
                <span class="online-count" id="online-count">0</span>
            </h2>
            <button class="refresh-btn" id="refresh-players-btn" title="Refresh list">
                🔄
            </button>
        </div>
        <div class="panel-body">
            <div class="players-filter">
                <input
                    type="text"
                    id="player-search"
                    class="player-search-input"
                    placeholder="🔍 Search warriors..."
                />
            </div>
            <div id="online-players-list" class="players-list">
                <div class="players-loading">
                    <div class="loading-spinner"></div>
                    <p>Searching for worthy opponents...</p>
                </div>
            </div>
        </div>
    `;

    return panel;
}

/**
 * Create Active Duels Section - Shows ongoing/pending duels
 */
function createActiveDuelsSection() {
    const section = document.createElement('div');
    section.className = 'active-duels-section';
    section.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">
                <span class="title-ornament">⟡</span>
                Active Challenges
                <span class="title-ornament">⟡</span>
            </h2>
        </div>
        <div id="active-duels-list" class="duels-grid">
            <div class="no-duels">
                <div class="no-duels-icon">⚔️</div>
                <p>No active challenges</p>
                <small>Challenge a warrior to begin your conquest</small>
            </div>
        </div>
    `;
    return section;
}

/**
 * Initialize Event Listeners - Called after DOM elements are created and added to page
 */
function initializeEventListeners() {
    // Initialize stake selection
    const stakePresets = document.querySelectorAll('.stake-preset');
    const customInput = document.getElementById('custom-stake-input');
    let selectedStake = null;

    stakePresets.forEach(btn => {
        btn.addEventListener('click', () => {
            stakePresets.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStake = parseInt(btn.dataset.amount);
            customInput.value = '';
            updateChallengeButtonState();
        });
    });

    customInput.addEventListener('input', () => {
        stakePresets.forEach(b => b.classList.remove('active'));
        selectedStake = parseInt(customInput.value) || null;
        updateChallengeButtonState();
    });

    // Make selected stake available globally
    window.getSelectedStake = () => selectedStake;

    // Challenge button handler
    const challengeBtn = document.getElementById('send-challenge-btn');
    challengeBtn.addEventListener('click', handleSendChallenge);

    // Refresh players button
    const refreshBtn = document.getElementById('refresh-players-btn');
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        loadOnlinePlayers().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
        });
    });

    // Player search input
    const searchInput = document.getElementById('player-search');
    searchInput.addEventListener('input', (e) => {
        filterPlayers(e.target.value);
    });

    // Update player gold display
    const player = PlayerData.get();
    document.getElementById('player-gold-display').textContent = player.gold.toLocaleString();
}

/**
 * Load Arena Data
 */
async function loadArenaData() {
    try {
        // Load player stats
        const stats = await apiClient.request('/api/pvp/stats');
        updateArenaStats(stats);

        // Load online players
        await loadOnlinePlayers();

        // Load active duels
        await loadActiveDuels();

        // Set up auto-refresh
        startArenaRefresh();
    } catch (error) {
        console.error('Failed to load arena data:', error);
        NotificationSystem.show('Failed to connect to arena', 'error');
    }
}

/**
 * Load Online Players List
 */
async function loadOnlinePlayers() {
    try {
        const players = await apiClient.request('/api/pvp/online-players');
        renderOnlinePlayers(players);
    } catch (error) {
        console.error('Failed to load online players:', error);
        document.getElementById('online-players-list').innerHTML = `
            <div class="players-error">
                <p>⚠️ Failed to load warriors</p>
                <button class="retry-btn" onclick="loadOnlinePlayers()">Retry</button>
            </div>
        `;
    }
}

/**
 * Render Online Players
 */
function renderOnlinePlayers(players) {
    const container = document.getElementById('online-players-list');

    if (!container) {
        console.error('online-players-list container not found');
        return;
    }

    const currentPlayer = PlayerData.get();

    // Filter to show only real players (exclude current player)
    const availablePlayers = players.filter(p => p.id !== currentPlayer.id);

    const countElement = document.getElementById('online-count');
    if (countElement) {
        countElement.textContent = availablePlayers.length;
    }

    if (availablePlayers.length === 0) {
        container.innerHTML = `
            <div class="no-players">
                <div class="no-players-icon">🏰</div>
                <p>The arena awaits warriors</p>
                <small>No opponents currently online</small>
            </div>
        `;
        return;
    }

    // Clear container and recreate cards
    container.innerHTML = '';

    availablePlayers.forEach((player, index) => {
        const playerCard = createPlayerCard(player, index);
        container.appendChild(playerCard);
    });

    // Store players for filtering
    window.allPlayers = availablePlayers;

    // Use EVENT DELEGATION on the container - set up once after cards are added
    // Remove old event listener by replacing the container's click handler
    const oldHandler = container._selectOpponentHandler;
    if (oldHandler) {
        container.removeEventListener('click', oldHandler);
    }

    // Create new handler and store reference
    const newHandler = function(e) {
        // Check if click is on or inside a button
        const button = e.target.closest('.select-opponent-btn');
        if (button) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Button clicked! Player ID:', button.dataset.playerId);

            const playerId = parseInt(button.dataset.playerId);
            const player = availablePlayers.find(p => p.id === playerId);
            const card = button.closest('.player-card');

            console.log('Found player:', player);
            console.log('Found card:', card);

            if (player && card) {
                selectOpponent(player, card);
            } else {
                console.error('Player or card not found', { player, card, playerId, availablePlayers });
            }
        }
    };

    container._selectOpponentHandler = newHandler;
    container.addEventListener('click', newHandler);

    console.log('Event delegation set up on container:', container);
    console.log('Available players:', availablePlayers.length);
}

/**
 * Create Player Card
 */
function createPlayerCard(player, index) {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.dataset.playerId = player.id;
    card.dataset.playerName = player.username.toLowerCase();
    card.style.animationDelay = `${index * 50}ms`;

    // Calculate power level for display
    const powerLevel = (player.level || 1) * 100 + (player.attack || 0) + (player.defense || 0);

    // Create button programmatically to ensure event handler attachment works
    const button = document.createElement('button');
    button.className = 'select-opponent-btn';
    button.dataset.playerId = player.id;
    button.innerHTML = '<span>Select Opponent</span>';

    card.innerHTML = `
        <div class="player-card-header">
            <div class="player-level">Lv. ${player.level || 1}</div>
            <div class="player-status-dot"></div>
        </div>
        <div class="player-card-body">
            <div class="player-name">${escapeHtml(player.username)}</div>
            <div class="player-stats">
                <div class="player-stat">
                    <span class="stat-icon">⚔️</span>
                    <span class="stat-value">${player.attack || 0}</span>
                </div>
                <div class="player-stat">
                    <span class="stat-icon">🛡️</span>
                    <span class="stat-value">${player.defense || 0}</span>
                </div>
                <div class="player-stat">
                    <span class="stat-icon">⚡</span>
                    <span class="stat-value">${powerLevel}</span>
                </div>
            </div>
        </div>
        <div class="player-card-footer"></div>
    `;

    // Append button to footer
    const footer = card.querySelector('.player-card-footer');
    footer.appendChild(button);

    return card;
}

/**
 * Select Opponent
 */
function selectOpponent(player, cardElement) {
    // Remove previous selection
    document.querySelectorAll('.player-card').forEach(c => c.classList.remove('selected'));

    // Mark this card as selected
    cardElement.classList.add('selected');

    // Store selected opponent
    window.selectedOpponent = player;

    // Update display
    const display = document.getElementById('selected-opponent-display');

    if (!display) {
        console.error('selected-opponent-display element not found!');
        return;
    }

    display.innerHTML = `
        <div class="opponent-selected">
            <div class="opponent-info">
                <div class="opponent-name">${escapeHtml(player.username)}</div>
                <div class="opponent-level">Level ${player.level || 1}</div>
            </div>
            <div class="opponent-stats-compact">
                <span>⚔️ ${player.attack || 0}</span>
                <span>🛡️ ${player.defense || 0}</span>
            </div>
            <button class="deselect-btn" onclick="deselectOpponent()">✕</button>
        </div>
    `;

    // Enable challenge button if stake is selected
    updateChallengeButtonState();

    NotificationSystem.show(`${player.username} selected as opponent`, 'success', 2000);
}

/**
 * Deselect Opponent
 */
function deselectOpponent() {
    window.selectedOpponent = null;
    document.querySelectorAll('.player-card').forEach(c => c.classList.remove('selected'));

    const display = document.getElementById('selected-opponent-display');
    display.innerHTML = `
        <div class="no-selection">
            <span class="no-selection-icon">👤</span>
            <span>Choose an opponent from the arena</span>
        </div>
    `;

    updateChallengeButtonState();
}

/**
 * Update Challenge Button State
 */
function updateChallengeButtonState() {
    const btn = document.getElementById('send-challenge-btn');
    const hasOpponent = window.selectedOpponent !== null;
    const stake = window.getSelectedStake ? window.getSelectedStake() : null;
    const hasValidStake = stake && stake >= 10;

    btn.disabled = !(hasOpponent && hasValidStake);
}

/**
 * Handle Send Challenge
 */
async function handleSendChallenge() {
    const opponent = window.selectedOpponent;
    const stake = window.getSelectedStake();

    if (!opponent || !stake) {
        NotificationSystem.show('Select opponent and stake amount', 'error');
        return;
    }

    const player = PlayerData.get();
    if (stake > player.gold) {
        NotificationSystem.show('Insufficient gold for this wager', 'error');
        return;
    }

    const btn = document.getElementById('send-challenge-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner-small"></div><span>Sending...</span>';

    try {
        const result = await apiClient.request('/api/pvp/challenge', {
            method: 'POST',
            body: JSON.stringify({
                opponent_id: opponent.id,
                gold_stake: stake
            })
        });

        NotificationSystem.show(`Challenge sent to ${opponent.username}!`, 'success');

        // Reset form
        deselectOpponent();
        document.querySelectorAll('.stake-preset').forEach(b => b.classList.remove('active'));
        document.getElementById('custom-stake-input').value = '';

        // Reload active duels
        await loadActiveDuels();

    } catch (error) {
        console.error('Failed to send challenge:', error);
        NotificationSystem.show(error.message || 'Failed to send challenge', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">⚔️</span><span class="btn-text">Send Challenge</span>';
    }
}

/**
 * Load Active Duels
 */
async function loadActiveDuels() {
    try {
        const duels = await apiClient.request('/api/pvp/active-duels');
        renderActiveDuels(duels);
    } catch (error) {
        console.error('Failed to load active duels:', error);
    }
}

/**
 * Render Active Duels
 */
function renderActiveDuels(duels) {
    const container = document.getElementById('active-duels-list');

    if (!duels || duels.length === 0) {
        container.innerHTML = `
            <div class="no-duels">
                <div class="no-duels-icon">⚔️</div>
                <p>No active challenges</p>
                <small>Challenge a warrior to begin your conquest</small>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    duels.forEach((duel, index) => {
        const duelCard = createDuelCard(duel, index);
        container.appendChild(duelCard);
    });
}

/**
 * Create Duel Card
 */
function createDuelCard(duel, index) {
    const card = document.createElement('div');
    card.className = 'duel-card';
    card.style.animationDelay = `${index * 100}ms`;

    const player = PlayerData.get();
    const isChallenger = duel.challenger_id === player.id;
    const opponentName = isChallenger ? duel.defender_name : duel.challenger_name;

    let statusBadge = '';
    let actionButtons = '';

    if (duel.status === 'pending') {
        statusBadge = '<span class="duel-status pending">Awaiting Response</span>';

        if (!isChallenger) {
            // Defender can accept or decline
            actionButtons = `
                <div class="duel-actions">
                    <button class="duel-action-btn accept" onclick="respondToChallenge(${duel.id}, true)">
                        <span>⚔️</span> Accept
                    </button>
                    <button class="duel-action-btn decline" onclick="respondToChallenge(${duel.id}, false)">
                        <span>✕</span> Decline
                    </button>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="duel-actions">
                    <button class="duel-action-btn cancel" onclick="cancelChallenge(${duel.id})">
                        Cancel Challenge
                    </button>
                </div>
            `;
        }
    } else if (duel.status === 'accepted') {
        statusBadge = '<span class="duel-status accepted">Ready to Fight!</span>';
        actionButtons = `
            <div class="duel-actions">
                <button class="duel-action-btn fight" onclick="enterDuel(${duel.id})">
                    <span>⚔️</span> Enter Arena
                </button>
            </div>
        `;
    } else if (duel.status === 'in_progress') {
        statusBadge = '<span class="duel-status in-progress">Battle In Progress!</span>';
        // Get battle_id from backend or construct it
        actionButtons = `
            <div class="duel-actions">
                <button class="duel-action-btn fight pulsing" onclick="joinBattle(${duel.id})">
                    <span>⚔️</span> JOIN BATTLE!
                </button>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="duel-card-header">
            ${statusBadge}
            <div class="duel-stake">
                ${ColoredThemeIcons.render('gold')}
                <span>${duel.gold_stake.toLocaleString()}</span>
            </div>
        </div>
        <div class="duel-card-body">
            <div class="duel-matchup">
                <div class="duel-fighter ${isChallenger ? 'you' : ''}">
                    <div class="fighter-name">${isChallenger ? 'You' : duel.challenger_name}</div>
                    <div class="fighter-level">Lv. ${duel.challenger_level}</div>
                </div>
                <div class="duel-vs">VS</div>
                <div class="duel-fighter ${!isChallenger ? 'you' : ''}">
                    <div class="fighter-name">${!isChallenger ? 'You' : duel.defender_name}</div>
                    <div class="fighter-level">Lv. ${duel.defender_level}</div>
                </div>
            </div>
        </div>
        ${actionButtons}
    `;

    return card;
}

/**
 * Respond to Challenge (Accept/Decline)
 */
window.respondToChallenge = async function(duelId, accept) {
    try {
        await apiClient.request(`/api/pvp/challenge/${duelId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ accept })
        });

        const message = accept
            ? 'Challenge accepted! Prepare for battle!'
            : 'Challenge declined';
        NotificationSystem.show(message, accept ? 'success' : 'info');

        await loadActiveDuels();

        if (accept) {
            // Navigate to battle
            setTimeout(() => enterDuel(duelId), 1000);
        }
    } catch (error) {
        console.error('Failed to respond to challenge:', error);
        NotificationSystem.show(error.message || 'Failed to respond', 'error');
    }
};

/**
 * Cancel Challenge
 */
window.cancelChallenge = async function(duelId) {
    try {
        await apiClient.request(`/api/pvp/challenge/${duelId}`, {
            method: 'DELETE'
        });

        NotificationSystem.show('Challenge cancelled', 'info');
        await loadActiveDuels();
    } catch (error) {
        console.error('Failed to cancel challenge:', error);
        NotificationSystem.show(error.message || 'Failed to cancel', 'error');
    }
};

/**
 * Enter Duel (Start real-time battle)
 */
window.enterDuel = async function(duelId) {
    try {
        // Show loading notification
        NotificationSystem.show('Entering the arena...', 'info');

        // Call backend to start the battle
        const response = await apiClient.request(`/api/pvp/duel/${duelId}/start-battle`, {
            method: 'POST'
        });

        // Navigate to the real-time battle view
        router.navigate(`pvp-battle/${response.battle_id}/${duelId}`);
    } catch (error) {
        console.error('Failed to enter duel:', error);
        NotificationSystem.show(error.message || 'Failed to enter arena', 'error');
    }
};

/**
 * Join Battle (for second player when battle is already in progress)
 */
window.joinBattle = async function(duelId) {
    try {
        // Show loading notification
        NotificationSystem.show('Joining battle...', 'info');

        // Get duel info to find battle_id
        const duels = await apiClient.request('/api/pvp/active-duels');
        const duel = duels.find(d => d.id === duelId);

        if (!duel) {
            throw new Error('Duel not found');
        }

        // If battle_id exists, navigate directly
        if (duel.battle_id) {
            router.navigate(`pvp-battle/${duel.battle_id}/${duelId}`);
            return;
        }

        // If no battle_id but status is ACCEPTED, try to start the battle
        if (duel.status === 'accepted') {
            await enterDuel(duelId);
            return;
        }

        // Otherwise, show error
        throw new Error(`Cannot join battle - duel status: ${duel.status}`);
    } catch (error) {
        console.error('Failed to join battle:', error);
        NotificationSystem.show(error.message || 'Failed to join battle', 'error');
    }
};

/**
 * Update Arena Stats
 */
function updateArenaStats(stats) {
    document.getElementById('pvp-wins').textContent = stats.wins || 0;
    document.getElementById('pvp-losses').textContent = stats.losses || 0;
    document.getElementById('pvp-gold-wagered').textContent = (stats.gold_wagered || 0).toLocaleString();

    const totalMatches = (stats.wins || 0) + (stats.losses || 0);
    const winRate = totalMatches > 0 ? Math.round(((stats.wins || 0) / totalMatches) * 100) : 0;
    document.getElementById('pvp-winrate').textContent = `${winRate}%`;
}

/**
 * Filter Players by Search
 */
function filterPlayers(query) {
    const cards = document.querySelectorAll('.player-card');
    const searchLower = query.toLowerCase();

    cards.forEach(card => {
        const playerName = card.dataset.playerName;
        if (playerName.includes(searchLower)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Start Auto-Refresh for Arena
 */
function startArenaRefresh() {
    // Refresh every 10 seconds
    window.arenaRefreshInterval = setInterval(async () => {
        try {
            await loadOnlinePlayers();
            await loadActiveDuels();
        } catch (error) {
            console.error('Auto-refresh failed:', error);
        }
    }, 10000);
}

/**
 * Stop Auto-Refresh
 */
function stopArenaRefresh() {
    if (window.arenaRefreshInterval) {
        clearInterval(window.arenaRefreshInterval);
        window.arenaRefreshInterval = null;
    }
}

/**
 * Cleanup on route change
 */
window.addEventListener('routechange', (e) => {
    if (e.detail.route !== 'pvp-arena') {
        stopArenaRefresh();

        // Disconnect WebSocket when leaving arena
        if (typeof pvpWebSocket !== 'undefined') {
            pvpWebSocket.disconnect();
        }
    }
});

/**
 * HTML Escape Utility
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize selected opponent tracking
window.selectedOpponent = null;
