/**
 * API-Backed Battle View Component
 * Shows real battles from the backend API
 */

async function createApiBattleView() {
    const container = document.createElement('div');

    try {
        container.appendChild(createBackButton());
        container.appendChild(createSectionHeader('⚔️', 'Multiplayer Battles'));

        // Battle type tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.style.cssText = 'display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--bg-secondary);';

        // Check URL parameters for initial tab (from hash)
        const hash = window.location.hash.slice(1); // Remove leading #
        const [route, queryString] = hash.split('?');
        const urlParams = new URLSearchParams(queryString || '');
        const tabParam = urlParams.get('tab');
        let activeTab = (tabParam && ['standard', 'boss_raid'].includes(tabParam)) ? tabParam : 'standard';

        const tabs = [
            { id: 'standard', label: 'Regular Battles', icon: '🗡️' },
            { id: 'boss_raid', label: 'Boss Raids', icon: '👹' }
        ];

        tabs.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.setAttribute('data-tab', tab.id);
            tabBtn.style.cssText = `
                padding: 12px 24px;
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1em;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                transition: all 0.2s;
            `;
            tabBtn.innerHTML = `${tab.icon} ${tab.label}`;

            if (tab.id === activeTab) {
                tabBtn.style.color = 'var(--color-legendary)';
                tabBtn.style.borderBottomColor = 'var(--color-legendary)';
            }

            tabBtn.addEventListener('mouseenter', () => {
                if (tab.id !== activeTab) {
                    tabBtn.style.color = 'var(--text-primary)';
                }
            });

            tabBtn.addEventListener('mouseleave', () => {
                if (tab.id !== activeTab) {
                    tabBtn.style.color = 'var(--text-secondary)';
                }
            });

            tabBtn.addEventListener('click', () => {
                activeTab = tab.id;

                // Update tab styling
                tabs.forEach(t => {
                    const btn = tabsContainer.querySelector(`button[data-tab="${t.id}"]`);
                    if (btn) {
                        if (t.id === activeTab) {
                            btn.style.color = 'var(--color-legendary)';
                            btn.style.borderBottomColor = 'var(--color-legendary)';
                        } else {
                            btn.style.color = 'var(--text-secondary)';
                            btn.style.borderBottomColor = 'transparent';
                        }
                    }
                });

                // Filter and re-render battles
                renderBattles(activeTab);
            });

            tabsContainer.appendChild(tabBtn);
        });

        container.appendChild(tabsContainer);

        // Loading state
        const loadingMsg = document.createElement('div');
        loadingMsg.textContent = 'Loading battles from server...';
        loadingMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
        container.appendChild(loadingMsg);

        // Fetch both regular battles and boss raids from API
        let standardBattles, bossRaids;
        try {
            [standardBattles, bossRaids] = await Promise.all([
                apiClient.getAvailableBattles(),
                apiClient.getAvailableBossRaids()
            ]);
        } catch (apiError) {
            console.error('[ApiBattleView] API call failed:', apiError);
            throw apiError; // Re-throw to be caught by outer try-catch
        }

        // Combine all battles
        const battles = [...standardBattles, ...bossRaids];

        // Remove loading message
        if (loadingMsg && loadingMsg.parentNode === container) {
            container.removeChild(loadingMsg);
        }

        // Action bar
        const actionBar = document.createElement('div');
        actionBar.style.cssText = 'display: flex; gap: 12px; margin-bottom: 20px; align-items: center;';

        // Refresh button
        const refreshBtn = createButton({
            text: '🔄 Refresh',
            variant: 'primary',
            onClick: () => {
                router.navigate('battles');
            }
        });
        actionBar.appendChild(refreshBtn);

        // Battle count
        const countLabel = document.createElement('span');
        countLabel.style.cssText = 'color: var(--text-secondary); margin-left: auto;';
        countLabel.textContent = `${battles.length} battle${battles.length !== 1 ? 's' : ''} available`;
        actionBar.appendChild(countLabel);

        container.appendChild(actionBar);

        // Create a container for battles that can be updated
        const battlesContainer = document.createElement('div');
        battlesContainer.id = 'battles-container';
        container.appendChild(battlesContainer);

        // Function to render battles based on active tab
        const renderBattles = (filterTab) => {
            battlesContainer.innerHTML = '';

            // Filter battles based on tab
            let filteredBattles;
            if (filterTab === 'standard') {
                filteredBattles = battles.filter(b => b.battle_type === 'standard');
            } else if (filterTab === 'boss_raid') {
                filteredBattles = battles.filter(b => b.battle_type === 'boss_raid');
            } else {
                filteredBattles = battles.filter(b => b.battle_type === 'standard');
            }

            // Update count label
            countLabel.textContent = `${filteredBattles.length} battle${filteredBattles.length !== 1 ? 's' : ''} available`;

            // Empty state
            if (filteredBattles.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.style.cssText = 'text-align: center; padding: 60px 20px; color: var(--text-secondary);';
                emptyMsg.innerHTML = `
                    <div style="font-size: 4em; margin-bottom: 16px;">⚔️</div>
                    <h3 style="color: var(--text-primary); margin-bottom: 12px;">No Battles Available</h3>
                    <p style="margin-bottom: 20px;">Be the first to create a battle and start fighting!</p>
                `;
                battlesContainer.appendChild(emptyMsg);
                return;
            }

            // Battle grid
            const grid = createGrid(3, []);

            filteredBattles.forEach(battle => {
                const card = createApiBattleCard(battle);
                grid.appendChild(card);
            });

            battlesContainer.appendChild(grid);
        };

        // Initial render
        renderBattles(activeTab);

    } catch (error) {
        console.error('[ApiBattleView] ERROR:', error);

        // Clear container and start fresh
        container.innerHTML = '';
        container.appendChild(createBackButton());
        container.appendChild(createSectionHeader('⚔️', 'Multiplayer Battles'));

        const errorCard = createCard({
            title: '❌ Error Loading Battles',
            body: ''
        });

        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'color: var(--text-secondary); margin-bottom: 16px;';
        errorMsg.textContent = error.message || 'Failed to load battles from server';
        errorCard.querySelector('.card-body').appendChild(errorMsg);

        // Check if auth error
        if (error.message && error.message.includes('Authentication')) {
            const loginBtn = createButton({
                text: '🔑 Login',
                variant: 'primary',
                onClick: () => router.navigate('auth')
            });
            errorCard.querySelector('.card-body').appendChild(loginBtn);
        } else {
            const retryBtn = createButton({
                text: '🔄 Retry',
                variant: 'secondary',
                onClick: () => router.navigate('battles-api')
            });
            errorCard.querySelector('.card-body').appendChild(retryBtn);
        }

        container.appendChild(errorCard);
    }

    return container;
}

/**
 * Create a battle card for API battle data
 */
function createApiBattleCard(battle) {
    const card = createCard({
        title: battle.name,
        body: ''
    });

    const body = card.querySelector('.card-body');

    // Boss Raid badge (if applicable)
    if (battle.is_boss_raid || battle.battle_type === 'boss_raid') {
        const bossBadge = document.createElement('div');
        bossBadge.style.cssText = `
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            margin-bottom: 8px;
            margin-right: 8px;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            color: white;
        `;
        bossBadge.textContent = '👹 BOSS RAID';
        body.appendChild(bossBadge);
    }

    // Battle status badge
    const statusBadge = document.createElement('div');
    statusBadge.style.cssText = `
        display: inline-block;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.85em;
        font-weight: bold;
        margin-bottom: 12px;
        background: ${getStatusColor(battle.status)};
        color: white;
    `;
    statusBadge.textContent = battle.status.toUpperCase();
    body.appendChild(statusBadge);

    // Battle info
    const info = document.createElement('div');
    info.style.cssText = 'margin-bottom: 16px;';

    const difficultyColor = getDifficultyColor(battle.difficulty);

    info.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div>
                <span style="color: var(--text-secondary); font-size: 0.9em;">Difficulty</span><br>
                <span style="color: ${difficultyColor}; font-weight: bold;">${battle.difficulty.toUpperCase()}</span>
            </div>
            <div>
                <span style="color: var(--text-secondary); font-size: 0.9em;">Wave</span><br>
                <span style="color: var(--text-primary); font-weight: bold;">${battle.wave_number}</span>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div>
                <span style="color: var(--text-secondary); font-size: 0.9em;">Players</span><br>
                <span style="color: var(--text-primary); font-weight: bold;">${battle.current_players}/${battle.max_players}</span>
            </div>
            <div>
                <span style="color: var(--text-secondary); font-size: 0.9em;">Required Level</span><br>
                <span style="color: var(--text-primary); font-weight: bold;">${battle.required_level}</span>
            </div>
        </div>
        <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); margin-top: 12px;">
            <div style="margin-bottom: 4px;">
                <span style="color: var(--text-gold);">💰 ${battle.gold_reward} Gold</span>
            </div>
            <div>
                <span style="color: var(--color-exp);">✨ ${battle.exp_reward} XP</span>
            </div>
        </div>
    `;
    body.appendChild(info);

    // Join button
    const status = (battle.status || '').toLowerCase();
    const canJoin = status === 'waiting' || status === 'in_progress';
    const isFull = battle.current_players >= battle.max_players;
    const playerLevel = gameState.getValue('player.level', 1);
    const meetsLevelReq = playerLevel >= battle.required_level;

    if (canJoin && !isFull) {
        // Check if player meets level requirement
        if (!meetsLevelReq) {
            const lockedMsg = document.createElement('div');
            lockedMsg.style.cssText = `
                padding: 12px;
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                text-align: center;
                color: var(--color-error);
                font-weight: bold;
            `;
            lockedMsg.innerHTML = `
                🔒 Requires Level ${battle.required_level}<br>
                <span style="font-size: 0.9em; color: var(--text-secondary);">Your level: ${playerLevel}</span>
            `;
            body.appendChild(lockedMsg);
        } else {
            const joinBtn = createButton({
                text: '⚔️ Join Battle',
                variant: 'primary',
                onClick: async () => {
                    joinBtn.disabled = true;
                    joinBtn.textContent = 'Joining...';

                    try {
                        const result = await apiClient.joinBattle(battle.id);
                        NotificationSystem.show(result.message, 'success');

                        // Navigate to real-time battle view
                        router.navigate(`battle-live/${battle.id}`);
                    } catch (error) {
                        NotificationSystem.show(error.message, 'error');
                    }
                    joinBtn.disabled = false;
                    joinBtn.textContent = '⚔️ Join Battle';
                }
            });
            body.appendChild(joinBtn);
        }
    } else if (isFull) {
        const fullMsg = document.createElement('div');
        fullMsg.textContent = '🚫 Battle Full';
        fullMsg.style.cssText = 'text-align: center; padding: 12px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-md);';
        body.appendChild(fullMsg);
    } else if (battle.status === 'completed') {
        const completedMsg = document.createElement('div');
        completedMsg.textContent = '✅ Completed';
        completedMsg.style.cssText = 'text-align: center; padding: 12px; color: var(--color-success); background: var(--bg-secondary); border-radius: var(--radius-md);';
        body.appendChild(completedMsg);
    }

    // View details button
    const detailsBtn = createButton({
        text: '📋 View Details',
        variant: 'secondary',
        onClick: async () => {
            try {
                const details = await apiClient.getBattleDetails(battle.id);
                showBattleDetailsModal(details);
            } catch (error) {
                NotificationSystem.show(error.message, 'error');
            }
        }
    });
    detailsBtn.style.marginTop = '8px';
    body.appendChild(detailsBtn);

    return card;
}

/**
 * Show battle details modal
 */
function showBattleDetailsModal(battle) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        width: 100%;
    `;

    // Modal header
    const header = document.createElement('h2');
    header.textContent = battle.name;
    header.style.cssText = 'color: var(--text-primary); margin-bottom: 16px;';
    modal.appendChild(header);

    // Battle info
    const info = document.createElement('div');
    info.style.cssText = 'margin-bottom: 20px;';
    info.innerHTML = `
        <div style="margin-bottom: 8px;">
            <strong>Status:</strong> <span style="color: ${getStatusColor(battle.status)};">${battle.status.toUpperCase()}</span>
        </div>
        <div style="margin-bottom: 8px;">
            <strong>Difficulty:</strong> <span style="color: ${getDifficultyColor(battle.difficulty)};">${battle.difficulty.toUpperCase()}</span>
        </div>
        <div style="margin-bottom: 8px;">
            <strong>Players:</strong> ${battle.current_players}/${battle.max_players}
        </div>
        <div style="margin-bottom: 8px;">
            <strong>Rewards:</strong> ${battle.gold_reward} gold, ${battle.exp_reward} XP
        </div>
    `;
    modal.appendChild(info);

    // Enemies section
    const enemiesTitle = document.createElement('h3');
    enemiesTitle.textContent = '👹 Enemies';
    enemiesTitle.style.cssText = 'color: var(--text-primary); margin-bottom: 12px;';
    modal.appendChild(enemiesTitle);

    const enemyList = document.createElement('div');
    enemyList.style.cssText = 'margin-bottom: 20px;';

    battle.enemies.forEach(enemy => {
        const enemyRow = document.createElement('div');
        enemyRow.style.cssText = `
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
            margin-bottom: 8px;
            display: flex;
            gap: 12px;
            align-items: center;
        `;

        const hpPercent = (enemy.hp_current / enemy.hp_max) * 100;
        const statusColor = enemy.is_defeated ? 'var(--text-secondary)' : 'var(--color-hp)';

        // Enemy icon
        let iconHTML = '';
        if (enemy.icon) {
            iconHTML = `
                <img
                    src="/assets/icons/enemies/${enemy.icon}"
                    alt="${enemy.name}"
                    style="width: 48px; height: 48px; object-fit: contain; border-radius: var(--radius-sm); background: var(--bg-primary); padding: 4px;"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                <div style="width: 48px; height: 48px; display: none; align-items: center; justify-content: center; font-size: 2em;">👹</div>
            `;
        }

        enemyRow.innerHTML = `
            ${iconHTML}
            <div style="flex: 1;">
                <strong style="color: ${enemy.is_defeated ? 'var(--text-secondary)' : 'var(--text-primary)'};">
                    ${enemy.name} ${enemy.is_defeated ? '☠️' : ''}
                </strong>
                <div style="font-size: 0.9em; color: var(--text-secondary);">
                    Level ${enemy.level}
                </div>
            </div>
            <div style="text-align: right;">
                <div style="color: ${statusColor}; font-weight: bold;">
                    ${enemy.hp_current} / ${enemy.hp_max} HP
                </div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    ${hpPercent.toFixed(0)}%
                </div>
            </div>
        `;

        enemyList.appendChild(enemyRow);
    });

    modal.appendChild(enemyList);

    // Close button
    const closeBtn = createButton({
        text: '✕ Close',
        variant: 'secondary',
        onClick: () => document.body.removeChild(overlay)
    });
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    document.body.appendChild(overlay);
}

/**
 * Get difficulty color
 */
function getDifficultyColor(difficulty) {
    const colors = {
        easy: '#22c55e',
        medium: '#f59e0b',
        hard: '#ef4444',
        epic: '#a855f7',
        legendary: '#ff6b35'
    };
    return colors[difficulty] || colors.medium;
}

/**
 * Get status color
 */
function getStatusColor(status) {
    const colors = {
        waiting: '#3b82f6',
        in_progress: '#22c55e',
        completed: '#6b7280'
    };
    return colors[status] || colors.waiting;
}

// Make it globally available
window.createApiBattleView = createApiBattleView;
