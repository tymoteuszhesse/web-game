/**
 * Real-Time Battle View Component
 * Live multiplayer battle with WebSocket updates
 */

async function createRealTimeBattleView(battleId) {
    const container = document.createElement('div');
    container.appendChild(createBackButton());
    container.appendChild(createSectionHeader('⚔️', 'Live Battle'));

    // Loading state
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = 'Loading battle...';
    loadingMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
    container.appendChild(loadingMsg);

    try {
        // Fetch battle details
        const battle = await apiClient.getBattleDetails(battleId);
        container.removeChild(loadingMsg);

        // Battle header
        const header = createBattleHeader(battle);
        container.appendChild(header);

        // Two-column layout
        const layout = document.createElement('div');
        layout.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;';

        // Left column: Enemies and actions
        const leftCol = document.createElement('div');

        // Enemy grid
        const enemySection = createSectionHeader('👹', 'Enemies');
        leftCol.appendChild(enemySection);

        const enemyGrid = document.createElement('div');
        enemyGrid.id = 'enemy-grid';
        enemyGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; margin-bottom: 20px;';
        leftCol.appendChild(enemyGrid);

        // Render enemies
        battle.enemies.forEach(enemy => {
            const enemyCard = createEnemyCard(enemy, battle);
            enemyGrid.appendChild(enemyCard);
        });

        // Battle completed - show loot claim
        if (battle.status === 'completed') {
            // Battle completed - show loot claim
            const lootCard = createCard({
                title: '🎁 Victory!',
                body: ''
            });

            const lootBody = lootCard.querySelector('.card-body');

            const victoryMsg = document.createElement('div');
            victoryMsg.style.cssText = 'text-align: center; margin-bottom: 20px;';
            victoryMsg.innerHTML = `
                <div style="font-size: 4em; margin-bottom: 12px;">🏆</div>
                <h2 style="color: var(--text-gold); margin-bottom: 8px;">Battle Complete!</h2>
                <p style="color: var(--text-secondary);">All enemies have been defeated!</p>
            `;
            lootBody.appendChild(victoryMsg);

            const claimBtn = createButton({
                text: '💰 Claim Loot',
                variant: 'success',
                onClick: async () => {
                    claimBtn.disabled = true;
                    claimBtn.textContent = 'Claiming...';

                    try {
                        const loot = await apiClient.claimLoot(battle.id);
                        NotificationSystem.show(`Claimed ${loot.gold} gold and ${loot.xp} XP!`, 'success');

                        // Fetch fresh player data from server
                        const updatedPlayer = await apiClient.getPlayerInfo();
                        gameState.set('player', updatedPlayer);
                        PlayerData.updateUI();

                        // Go back to battle list after claiming
                        setTimeout(() => {
                            router.navigate('battles');
                        }, 2000);
                    } catch (error) {
                        NotificationSystem.show(error.message, 'error');
                        claimBtn.disabled = false;
                        claimBtn.textContent = '💰 Claim Loot';
                    }
                }
            });
            lootBody.appendChild(claimBtn);

            leftCol.appendChild(lootCard);
        }

        layout.appendChild(leftCol);

        // Right column: Battle log and players
        const rightCol = document.createElement('div');

        // Connection status
        const statusCard = createCard({
            title: '📡 Connection',
            body: ''
        });
        const statusBody = statusCard.querySelector('.card-body');
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'connection-status';
        statusIndicator.style.cssText = 'padding: 12px; border-radius: var(--radius-md); text-align: center; background: var(--bg-secondary);';
        statusIndicator.innerHTML = '<span style="color: #f59e0b;">🔄 Connecting...</span>';
        statusBody.appendChild(statusIndicator);
        rightCol.appendChild(statusCard);

        // Battle log
        const logCard = createCard({
            title: '📜 Battle Log',
            body: ''
        });
        const logBody = logCard.querySelector('.card-body');
        const battleLog = document.createElement('div');
        battleLog.id = 'battle-log';
        battleLog.style.cssText = `
            max-height: 400px;
            overflow-y: auto;
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
            font-size: 0.9em;
        `;
        battleLog.innerHTML = '<div style="color: var(--text-secondary); font-style: italic;">Battle log will appear here...</div>';
        logBody.appendChild(battleLog);
        rightCol.appendChild(logCard);

        // Players card
        const playersCard = createCard({
            title: '👥 Players',
            body: ''
        });
        const playersBody = playersCard.querySelector('.card-body');
        const playersList = document.createElement('div');
        playersList.id = 'players-list';
        playersList.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
        playersBody.appendChild(playersList);

        // Initialize players list from battle data
        if (battle.participants && battle.participants.length > 0) {
            updatePlayersList(battle.participants);
        } else {
            playersList.innerHTML = '<div style="color: var(--text-secondary); font-style: italic;">Loading players...</div>';

            // Fetch updated battle data after a moment to get participants
            setTimeout(() => {
                apiClient.getBattleDetails(battle.id).then(updatedBattle => {
                    if (updatedBattle.participants && updatedBattle.participants.length > 0) {
                        updatePlayersList(updatedBattle.participants);
                    } else {
                        playersList.innerHTML = '<div style="color: var(--text-secondary); font-style: italic;">No players yet...</div>';
                    }
                });
            }, 1000);
        }

        rightCol.appendChild(playersCard);

        layout.appendChild(rightCol);
        container.appendChild(layout);

        // Initialize WebSocket connection
        initializeBattleWebSocket(battle);

    } catch (error) {
        container.removeChild(loadingMsg);

        const errorCard = createCard({
            title: '❌ Error Loading Battle',
            body: ''
        });

        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'color: var(--color-error); margin-bottom: 16px;';
        errorMsg.textContent = error.message || 'Failed to load battle';
        errorCard.querySelector('.card-body').appendChild(errorMsg);

        const backBtn = createButton({
            text: '⬅️ Back to Battles',
            variant: 'secondary',
            onClick: () => router.navigate('battles')
        });
        errorCard.querySelector('.card-body').appendChild(backBtn);

        container.appendChild(errorCard);
    }

    return container;
}

/**
 * Create battle header with info
 */
function createBattleHeader(battle) {
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px;
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        margin-bottom: 20px;
    `;

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
    header.appendChild(statusBadge);

    const title = document.createElement('h2');
    title.textContent = battle.name;
    title.style.cssText = 'color: var(--text-primary); margin-bottom: 16px;';
    header.appendChild(title);

    const infoGrid = document.createElement('div');
    infoGrid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;';

    const infos = [
        { label: 'Difficulty', value: battle.difficulty.toUpperCase(), color: getDifficultyColor(battle.difficulty) },
        { label: 'Wave', value: battle.wave_number, color: 'var(--text-primary)' },
        { label: 'Players', value: `${battle.current_players}/${battle.max_players}`, color: 'var(--text-primary)' },
        { label: 'Rewards', value: `${battle.gold_reward || battle.gold_base || battle.rewards?.gold || '?'} 💰 ${battle.exp_reward || battle.exp_base || battle.rewards?.exp || '?'} ✨`, color: 'var(--text-gold)' }
    ];

    infos.forEach(info => {
        const infoBox = document.createElement('div');
        infoBox.style.cssText = 'padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);';
        infoBox.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 4px;">${info.label}</div>
            <div style="color: ${info.color}; font-weight: bold;">${info.value}</div>
        `;
        infoGrid.appendChild(infoBox);
    });

    header.appendChild(infoGrid);

    // Boss Raid specific UI
    if (battle.is_boss_raid) {
        const bossInfo = document.createElement('div');
        bossInfo.style.cssText = `
            margin-top: 16px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
            border: 2px solid rgba(139, 92, 246, 0.3);
            border-radius: var(--radius-md);
        `;

        bossInfo.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <span style="font-size: 2em;">👹</span>
                <div>
                    <div style="color: var(--color-legendary); font-weight: bold; font-size: 1.1em;">BOSS RAID</div>
                    <div style="color: var(--text-secondary); font-size: 0.9em;">Epic encounter with phase transitions</div>
                </div>
            </div>
            <div id="boss-phase-indicator" style="margin-top: 12px;">
                <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 4px;">
                    Boss Phase: <span id="current-phase" style="color: var(--color-legendary); font-weight: bold;">${battle.boss_current_phase || 1}</span>/<span id="total-phases">${battle.boss_phase_count || 3}</span>
                </div>
                <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div id="phase-progress-bar" style="background: linear-gradient(90deg, #8b5cf6, #ec4899); height: 100%; width: ${(battle.boss_current_phase || 1) / (battle.boss_phase_count || 3) * 100}%; transition: width 0.5s;"></div>
                </div>
            </div>
            <div id="death-status" style="margin-top: 12px; display: none;">
                <div style="padding: 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: var(--radius-md); text-align: center;">
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 8px;">💀 You are dead!</div>
                    <div id="death-timer" style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 8px;">Resurrection in: <span style="color: #ef4444; font-weight: bold;">--:--</span></div>
                    <button id="resurrect-btn" style="display: none;" class="button-legendary">⚡ Resurrect (50 gems)</button>
                </div>
            </div>
        `;

        header.appendChild(bossInfo);
    }

    return header;
}

/**
 * Create enemy card
 */
function createEnemyCard(enemy, battle) {
    const card = createCard({
        title: `${enemy.name} ${enemy.is_defeated ? '☠️' : ''}`,
        body: ''
    });

    card.dataset.enemyId = enemy.id;

    const body = card.querySelector('.card-body');

    // Enemy icon with ornate frame (skip for boss raids - they have their own background image)
    if (enemy.icon && !battle.is_boss_raid) {
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
            width: 100%;
            height: 160px;
            margin-bottom: 20px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Radial glow effect behind enemy
        const glowEffect = document.createElement('div');
        glowEffect.style.cssText = `
            position: absolute;
            width: 140px;
            height: 140px;
            background: radial-gradient(
                circle at center,
                rgba(212, 175, 55, 0.2) 0%,
                rgba(212, 175, 55, 0.08) 30%,
                transparent 70%
            );
            border-radius: 50%;
            filter: blur(25px);
            animation: pulse 4s ease-in-out infinite;
        `;

        // Decorative corner elements
        const cornerStyle = `
            position: absolute;
            width: 28px;
            height: 28px;
            border-color: rgba(212, 175, 55, 0.5);
            border-style: solid;
            opacity: 0.8;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        const topLeftCorner = document.createElement('div');
        topLeftCorner.style.cssText = cornerStyle + `
            top: 8px;
            left: 8px;
            border-width: 2px 0 0 2px;
            border-radius: 6px 0 0 0;
        `;

        const topRightCorner = document.createElement('div');
        topRightCorner.style.cssText = cornerStyle + `
            top: 8px;
            right: 8px;
            border-width: 2px 2px 0 0;
            border-radius: 0 6px 0 0;
        `;

        const bottomLeftCorner = document.createElement('div');
        bottomLeftCorner.style.cssText = cornerStyle + `
            bottom: 8px;
            left: 8px;
            border-width: 0 0 2px 2px;
            border-radius: 0 0 0 6px;
        `;

        const bottomRightCorner = document.createElement('div');
        bottomRightCorner.style.cssText = cornerStyle + `
            bottom: 8px;
            right: 8px;
            border-width: 0 2px 2px 0;
            border-radius: 0 0 6px 0;
        `;

        // Decorative dots at corners
        const dotStyle = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--gold);
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
        `;

        const topLeftDot = document.createElement('div');
        topLeftDot.style.cssText = dotStyle + 'top: 6px; left: 6px;';

        const topRightDot = document.createElement('div');
        topRightDot.style.cssText = dotStyle + 'top: 6px; right: 6px;';

        const bottomLeftDot = document.createElement('div');
        bottomLeftDot.style.cssText = dotStyle + 'bottom: 6px; left: 6px;';

        const bottomRightDot = document.createElement('div');
        bottomRightDot.style.cssText = dotStyle + 'bottom: 6px; right: 6px;';

        // Enemy image with transparent background and pixel-perfect rendering
        const img = document.createElement('img');
        img.src = `/assets/icons/enemies/${enemy.icon}`;
        img.alt = enemy.name;
        img.style.cssText = `
            width: 110px;
            height: 110px;
            object-fit: contain;
            position: relative;
            z-index: 2;
            filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.7))
                    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9));
            transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
                        filter 0.3s ease;
            image-rendering: -moz-crisp-edges;
            image-rendering: -webkit-crisp-edges;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        `;

        console.log('[Battle] Loading enemy icon:', enemy.icon, 'Full path:', img.src);

        // Hover interaction - enemy "comes alive"
        iconContainer.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.15) translateY(-6px)';
            img.style.filter = `drop-shadow(0 8px 20px rgba(212, 175, 55, 0.4))
                                drop-shadow(0 4px 8px rgba(0, 0, 0, 0.9))`;
            [topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner].forEach(corner => {
                corner.style.borderColor = 'rgba(212, 175, 55, 0.9)';
                corner.style.opacity = '1';
            });
        });

        iconContainer.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1) translateY(0)';
            img.style.filter = `drop-shadow(0 6px 16px rgba(0, 0, 0, 0.7))
                                drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))`;
            [topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner].forEach(corner => {
                corner.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                corner.style.opacity = '0.8';
            });
        });

        // Fallback to themed emoji if image fails to load
        img.onerror = () => {
            const fallback = document.createElement('div');
            fallback.style.cssText = `
                width: 110px;
                height: 110px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 5em;
                position: relative;
                z-index: 2;
                filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.7));
            `;
            fallback.textContent = '👹';
            img.replaceWith(fallback);
        };

        img.onload = () => {
            // Add subtle entrance animation
            img.style.animation = 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        };

        // Assemble the ornate frame
        iconContainer.appendChild(glowEffect);
        iconContainer.appendChild(topLeftCorner);
        iconContainer.appendChild(topRightCorner);
        iconContainer.appendChild(bottomLeftCorner);
        iconContainer.appendChild(bottomRightCorner);
        iconContainer.appendChild(topLeftDot);
        iconContainer.appendChild(topRightDot);
        iconContainer.appendChild(bottomLeftDot);
        iconContainer.appendChild(bottomRightDot);
        iconContainer.appendChild(img);
        body.appendChild(iconContainer);
    }

    // Boss image (for boss raids - override icon with larger boss image)
    if (battle.is_boss_raid) {
        const bossImage = document.createElement('div');
        bossImage.style.cssText = `
            width: 100%;
            height: 200px;
            margin-bottom: 16px;
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 3px solid transparent;
            background: linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
                       linear-gradient(135deg, #8b5cf6, #ec4899) border-box;
        `;

        // Map boss names to image filenames
        const getBossImage = (bossName) => {
            const name = bossName.toLowerCase();
            if (name.includes('dark lord') || name.includes('malakar')) {
                return 'assets/bosses/dark_lord.png';
            }
            // Default fallback
            return 'assets/bosses/dark_lord.png';
        };

        const img = document.createElement('img');
        img.src = getBossImage(enemy.name);
        img.alt = enemy.name;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

        // Fallback to emoji if image fails to load
        img.onerror = () => {
            bossImage.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 8em;">
                    👹
                </div>
            `;
        };

        bossImage.appendChild(img);
        body.appendChild(bossImage);
    }

    // HP bar with medieval styling
    const hpPercent = (enemy.hp_current / enemy.hp_max) * 100;
    const hpBar = document.createElement('div');
    hpBar.style.cssText = 'margin-bottom: 16px;';
    hpBar.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="
                color: var(--text-secondary);
                font-size: 0.75rem;
                font-family: var(--font-display);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                font-weight: 600;
            ">❤️ Vitality</span>
            <span style="
                color: var(--ruby-light);
                font-weight: 700;
                font-family: var(--font-display);
                font-size: 0.95rem;
                letter-spacing: 0.5px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
            " class="enemy-hp-text">${enemy.hp_current} / ${enemy.hp_max}</span>
        </div>
        <div style="
            background: linear-gradient(180deg, rgba(13, 10, 15, 0.8), rgba(26, 20, 32, 0.9));
            border-radius: 6px;
            height: 12px;
            overflow: hidden;
            border: 1px solid rgba(212, 175, 55, 0.2);
            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.7);
            position: relative;
        ">
            <div class="enemy-hp-bar" style="
                background: linear-gradient(90deg,
                    var(--ruby-dark) 0%,
                    var(--ruby) 50%,
                    var(--ruby-light) 100%
                );
                height: 100%;
                width: ${hpPercent}%;
                transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow:
                    0 0 12px rgba(157, 31, 52, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                position: relative;
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 8px,
                        rgba(255, 255, 255, 0.05) 8px,
                        rgba(255, 255, 255, 0.05) 16px
                    );
                "></div>
            </div>
        </div>
    `;
    body.appendChild(hpBar);

    // Enemy info with ornate styling
    const info = document.createElement('div');
    info.style.cssText = `
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 12px;
        background: linear-gradient(135deg,
            rgba(212, 175, 55, 0.05) 0%,
            rgba(212, 175, 55, 0.02) 100%
        );
        border: 1px solid rgba(212, 175, 55, 0.15);
        border-radius: 6px;
    `;
    info.innerHTML = `
        <span style="
            font-family: var(--font-display);
            color: var(--gold);
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 600;
        ">⚔ Level ${enemy.level}</span>
    `;
    body.appendChild(info);

    // Attack type selector and button (only if not defeated)
    if (!enemy.is_defeated) {
        // Get current player stamina
        const currentPlayer = PlayerData.get();
        const playerStamina = currentPlayer.stamina || 100;

        // Attack type configurations
        const attackTypes = [
            { type: 'quick', name: 'Quick', stamina: 5, mult: '0.7x', emoji: '🗡️', color: '#78c991' },
            { type: 'normal', name: 'Normal', stamina: 10, mult: '1.0x', emoji: '⚔️', color: '#4a9eff' },
            { type: 'power', name: 'Power', stamina: 20, mult: '1.5x', emoji: '💪', color: '#dc8c2e' },
            { type: 'critical', name: 'Critical', stamina: 35, mult: '2.2x', emoji: '💥', color: '#e74c3c' },
            { type: 'ultimate', name: 'Ultimate', stamina: 50, mult: '3.0x', emoji: '💀', color: '#9b59b6' }
        ];

        // Attack type selector container
        const attackContainer = document.createElement('div');
        attackContainer.style.cssText = `
            margin-bottom: 12px;
            padding: 12px;
            background: linear-gradient(135deg, rgba(74, 158, 255, 0.05), rgba(155, 89, 182, 0.05));
            border: 1px solid rgba(212, 175, 55, 0.15);
            border-radius: 8px;
        `;

        // Current stamina display
        const staminaDisplay = document.createElement('div');
        staminaDisplay.style.cssText = `
            text-align: center;
            margin-bottom: 10px;
            font-size: 0.85em;
            color: var(--text-secondary);
        `;
        staminaDisplay.innerHTML = `<span style="color: var(--primary); font-weight: bold;">⚡ Stamina: <span class="stamina-value">${playerStamina}</span></span>`;
        attackContainer.appendChild(staminaDisplay);

        // Attack type buttons
        const buttonsGrid = document.createElement('div');
        buttonsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 8px;
        `;

        let selectedAttackType = 'normal';

        attackTypes.forEach(attack => {
            const btn = document.createElement('button');
            btn.dataset.attackType = attack.type;
            const canAfford = playerStamina >= attack.stamina;

            btn.style.cssText = `
                padding: 8px 10px;
                border: 2px solid ${canAfford ? attack.color : '#555'};
                background: ${canAfford ? attack.color + '22' : '#2a2a2a'};
                color: ${canAfford ? '#fff' : '#777'};
                border-radius: 6px;
                cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                font-size: 0.8em;
                font-weight: bold;
                transition: all 0.2s;
                opacity: ${canAfford ? '0.6' : '0.4'};
                text-align: left;
            `;

            btn.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${attack.emoji} ${attack.name}</span>
                    <span style="font-size: 0.85em; opacity: 0.8;">⚡${attack.stamina}</span>
                </div>
                <div style="font-size: 0.75em; opacity: 0.7; margin-top: 2px;">Dmg: ${attack.mult}</div>
            `;

            btn.disabled = !canAfford;

            btn.addEventListener('click', () => {
                if (!canAfford) return;

                selectedAttackType = attack.type;

                // Update button styles to show selection
                buttonsGrid.querySelectorAll('button').forEach(b => {
                    const bType = b.dataset.attackType;
                    const bConfig = attackTypes.find(a => a.type === bType);
                    const bCanAfford = playerStamina >= bConfig.stamina;
                    if (bCanAfford) {
                        b.style.opacity = b === btn ? '1' : '0.6';
                        b.style.borderWidth = b === btn ? '3px' : '2px';
                        b.style.transform = b === btn ? 'scale(1.05)' : 'scale(1)';
                    }
                });
            });

            // Set default selection (normal)
            if (attack.type === 'normal' && canAfford) {
                btn.style.opacity = '1';
                btn.style.borderWidth = '3px';
            }

            buttonsGrid.appendChild(btn);
        });

        attackContainer.appendChild(buttonsGrid);

        // Execute attack button
        const attackBtn = createButton({
            text: '⚔️ Execute Attack',
            variant: 'primary',
            onClick: async () => {
                attackBtn.disabled = true;
                const originalText = attackBtn.textContent;
                attackBtn.textContent = 'Attacking...';

                try {
                    const result = await apiClient.attackEnemy(battle.id, enemy.id, selectedAttackType);

                    // Update stamina in game state and UI
                    if (result.stamina_remaining !== undefined) {
                        // Update global player state
                        const currentPlayer = PlayerData.get();
                        currentPlayer.stamina = result.stamina_remaining;
                        gameState.set('player', currentPlayer);

                        // Update header display
                        PlayerData.updateUI();

                        // Update local battle stamina display
                        const staminaValueEl = staminaDisplay.querySelector('.stamina-value');
                        if (staminaValueEl) {
                            staminaValueEl.textContent = result.stamina_remaining;
                        }

                        // Update button availability based on new stamina
                        buttonsGrid.querySelectorAll('button').forEach(btn => {
                            const type = btn.dataset.attackType;
                            const config = attackTypes.find(a => a.type === type);
                            const canAfford = result.stamina_remaining >= config.stamina;

                            btn.disabled = !canAfford;
                            btn.style.opacity = canAfford ? (type === selectedAttackType ? '1' : '0.6') : '0.4';
                            btn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
                            btn.style.background = canAfford ? config.color + '22' : '#2a2a2a';
                            btn.style.color = canAfford ? '#fff' : '#777';
                            btn.style.borderColor = canAfford ? config.color : '#555';
                        });
                    }

                    // WebSocket will handle the UI update
                } catch (error) {
                    NotificationSystem.show(error.message, 'error');

                    // Check if error is due to death (for boss raids)
                    if (error.message && error.message.includes('dead')) {
                        showDeathStatus();
                    }

                    attackBtn.disabled = false;
                    attackBtn.textContent = originalText;
                }
            }
        });

        body.appendChild(attackContainer);
        body.appendChild(attackBtn);
    } else {
        const defeatedMsg = document.createElement('div');
        defeatedMsg.textContent = '☠️ Defeated';
        defeatedMsg.style.cssText = 'text-align: center; padding: 12px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-md);';
        body.appendChild(defeatedMsg);
    }

    // Grey out if defeated
    if (enemy.is_defeated) {
        card.style.opacity = '0.6';
    }

    return card;
}

/**
 * Show victory UI with animated chest popup
 */
function showVictoryUI(battle, battleWS) {
    // Create fullscreen overlay modal
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.92);
        backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.4s ease-out;
        padding: 20px;
    `;

    // Victory container
    const container = document.createElement('div');
    container.style.cssText = `
        max-width: 600px;
        width: 100%;
        text-align: center;
        animation: victorySlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    // Victory title with glow effect
    const title = document.createElement('h1');
    title.style.cssText = `
        font-family: 'Cinzel', serif;
        font-size: 4rem;
        font-weight: 900;
        color: #FFD700;
        text-shadow:
            0 0 20px rgba(255, 215, 0, 0.8),
            0 0 40px rgba(255, 215, 0, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.8);
        margin-bottom: 16px;
        letter-spacing: 4px;
        animation: titlePulse 2s ease-in-out infinite;
    `;
    title.innerHTML = '🏆 VICTORY! 🏆';
    container.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.style.cssText = `
        font-family: 'Cinzel', serif;
        font-size: 1.3rem;
        color: #D4AF37;
        margin-bottom: 48px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
        letter-spacing: 2px;
    `;
    subtitle.textContent = 'All Enemies Defeated';
    container.appendChild(subtitle);

    // Animated chest container
    const chestContainer = document.createElement('div');
    chestContainer.style.cssText = `
        position: relative;
        width: 200px;
        height: 200px;
        margin: 0 auto 48px;
    `;

    // Treasure chest (closed initially)
    const chest = document.createElement('div');
    chest.style.cssText = `
        font-size: 180px;
        line-height: 1;
        cursor: pointer;
        transition: all 0.3s ease;
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
        animation: chestBounce 1s ease-in-out infinite;
    `;
    chest.textContent = '📦';
    chestContainer.appendChild(chest);

    // Sparkles animation
    const sparkles = document.createElement('div');
    sparkles.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        opacity: 0;
        animation: sparkleFloat 2s ease-in-out infinite;
    `;
    sparkles.textContent = '✨ ✨ ✨';
    chestContainer.appendChild(sparkles);

    container.appendChild(chestContainer);

    // Rewards section (hidden initially)
    const rewardsSection = document.createElement('div');
    rewardsSection.style.cssText = `
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        margin-bottom: 32px;
    `;
    rewardsSection.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(218, 165, 32, 0.1));
            border: 2px solid rgba(212, 175, 55, 0.4);
            border-radius: 16px;
            padding: 32px 24px;
            backdrop-filter: blur(10px);
        ">
            <div style="font-size: 1.1rem; color: #D4AF37; margin-bottom: 20px; font-weight: 600; letter-spacing: 1px;">
                BATTLE REWARDS
            </div>
            <div id="reward-details" style="
                display: flex;
                justify-content: center;
                gap: 32px;
                font-size: 1.3rem;
                color: white;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 2rem;">💰</span>
                    <span id="gold-amount" style="font-weight: 700; color: #FFD700;">Loading...</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 2rem;">⭐</span>
                    <span id="xp-amount" style="font-weight: 700; color: #7C3AED;">Loading...</span>
                </div>
            </div>
        </div>
    `;
    container.appendChild(rewardsSection);

    // Claim button
    const claimBtn = document.createElement('button');
    claimBtn.style.cssText = `
        font-family: 'Cinzel', serif;
        font-size: 1.3rem;
        font-weight: 700;
        padding: 20px 60px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow:
            0 4px 12px rgba(16, 185, 129, 0.4),
            0 0 24px rgba(16, 185, 129, 0.2);
        letter-spacing: 2px;
        text-transform: uppercase;
        opacity: 0;
        transform: translateY(20px);
    `;
    claimBtn.textContent = 'Click Chest to Open';
    claimBtn.disabled = true;

    claimBtn.addEventListener('mouseenter', () => {
        if (!claimBtn.disabled) {
            claimBtn.style.transform = 'translateY(-4px) scale(1.05)';
            claimBtn.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.5), 0 0 32px rgba(16, 185, 129, 0.3)';
        }
    });

    claimBtn.addEventListener('mouseleave', () => {
        if (!claimBtn.disabled) {
            claimBtn.style.transform = 'translateY(0) scale(1)';
            claimBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4), 0 0 24px rgba(16, 185, 129, 0.2)';
        }
    });

    container.appendChild(claimBtn);
    overlay.appendChild(container);

    // Chest opening animation
    let chestOpened = false;
    const openChest = async () => {
        if (chestOpened) return;
        chestOpened = true;

        // Animate chest opening
        chest.style.animation = 'none';
        chest.style.transform = 'scale(1.2)';
        chest.textContent = '📭'; // Open chest

        // Show sparkles burst
        sparkles.style.animation = 'sparkleBurst 0.8s ease-out';
        sparkles.style.opacity = '1';

        // Fetch loot data
        try {
            const loot = await apiClient.claimLoot(battle.id);

            // Update reward amounts
            document.getElementById('gold-amount').textContent = `${loot.gold.toLocaleString()} Gold`;
            document.getElementById('xp-amount').textContent = `${loot.xp.toLocaleString()} XP`;

            // Show rewards with animation
            setTimeout(() => {
                rewardsSection.style.opacity = '1';
                rewardsSection.style.transform = 'scale(1)';
            }, 300);

            // Update player data - ensure we refresh from backend
            const updatedPlayer = await apiClient.getPlayerInfo();
            console.log('[Victory] Updated player data from backend:', updatedPlayer);

            // Set player data in game state
            gameState.set('player', updatedPlayer);

            // Immediately update UI with fresh data
            PlayerData.updateUI();

            // Double-check level is refreshed in header after short delay
            setTimeout(() => {
                const currentPlayer = PlayerData.get();
                console.log('[Victory] Current player state after update:', currentPlayer);
                if (currentPlayer.level !== updatedPlayer.level || currentPlayer.exp !== updatedPlayer.exp) {
                    console.warn('[Victory] Level mismatch detected, forcing refresh');
                    gameState.set('player', updatedPlayer);
                    PlayerData.updateUI();
                }
            }, 200);

            // Show claim button
            setTimeout(() => {
                claimBtn.style.opacity = '1';
                claimBtn.style.transform = 'translateY(0)';
                claimBtn.textContent = 'Continue';
                claimBtn.disabled = false;
                claimBtn.style.cursor = 'pointer';

                claimBtn.onclick = () => {
                    // Disconnect WebSocket
                    if (battleWS) {
                        battleWS.disconnect();
                    }

                    // Fade out and navigate
                    overlay.style.animation = 'fadeOut 0.4s ease-out';
                    setTimeout(() => {
                        overlay.remove();
                        router.navigate('battles');
                    }, 400);
                };
            }, 800);

        } catch (error) {
            console.error('Failed to claim loot:', error);
            NotificationSystem.show(error.message || 'Failed to claim rewards', 'error');
            overlay.remove();
        }
    };

    // Click chest to open
    chest.addEventListener('click', openChest);
    chestContainer.addEventListener('click', openChest);

    // Add to DOM
    document.body.appendChild(overlay);

    // Add animations CSS if not already present
    if (!document.getElementById('victory-animations')) {
        const style = document.createElement('style');
        style.id = 'victory-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes victorySlideUp {
                from {
                    opacity: 0;
                    transform: translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes titlePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            @keyframes chestBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-12px); }
            }
            @keyframes sparkleFloat {
                0%, 100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: translate(-50%, -70%) scale(1);
                }
            }
            @keyframes sparkleBurst {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -100%) scale(2);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Initialize WebSocket connection for battle
 */
function initializeBattleWebSocket(battle) {
    // Check if WebSocket already exists and is connected
    if (window.currentBattleWS && window.currentBattleWS.battleId === battle.id) {
        if (window.currentBattleWS.isConnected()) {
            console.log('[Battle] WebSocket already connected, reusing connection');
            return;
        } else {
            // Cleanup old connection
            console.log('[Battle] Cleaning up old disconnected WebSocket');
            window.currentBattleWS.removeAllHandlers();
            window.currentBattleWS.disconnect();
        }
    }

    const battleWS = new BattleWebSocket(battle.id);

    // Connection status updates
    battleWS.on('connected', () => {
        updateConnectionStatus('connected', '✅ Connected');
        addBattleLogEntry('Connected to battle server', 'success');
    });

    battleWS.on('reconnecting', (data) => {
        updateConnectionStatus('reconnecting', `🔄 Reconnecting... (${data.attempt}/${data.maxAttempts})`);
        addBattleLogEntry(`Connection lost, reconnecting (attempt ${data.attempt})...`, 'warning');
    });

    battleWS.on('error', (data) => {
        updateConnectionStatus('error', '❌ Connection Error');
        addBattleLogEntry(data.message || 'WebSocket error', 'error');
    });

    // Battle events
    battleWS.on('welcome', (data) => {
        addBattleLogEntry(data.message, 'info');
    });

    battleWS.on('player_joined', (data) => {
        addBattleLogEntry(`${data.username || data.player_name || 'A player'} joined the battle!`, 'info');

        // Refresh battle data to get full participant info
        apiClient.getBattleDetails(battle.id).then(updatedBattle => {
            if (updatedBattle.participants) {
                updatePlayersList(updatedBattle.participants);
            }
        }).catch(err => {
            console.error('Failed to refresh battle data:', err);
        });
    });

    battleWS.on('player_left', (data) => {
        addBattleLogEntry(`${data.player_name} left the battle`, 'warning');
        updatePlayersList(data.players);
    });

    battleWS.on('player_joined_battle', (data) => {
        addBattleLogEntry(`${data.player_name || 'A player'} joined the battle!`, 'success');

        // Refresh battle data to update participants list
        apiClient.getBattleDetails(battle.id).then(updatedBattle => {
            if (updatedBattle.participants) {
                updatePlayersList(updatedBattle.participants);
            }
        }).catch(err => {
            console.error('Failed to refresh battle data:', err);
        });
    });

    battleWS.on('attack', (data) => {
        // Find enemy name from battle data
        const enemy = battle.enemies.find(e => e.id === data.enemy_id);
        const enemyName = enemy ? enemy.name : 'Enemy';
        const enemyHpMax = enemy ? enemy.hp_max : 100;

        // Create battle log entry with critical strike styling
        if (data.is_critical) {
            addBattleLogEntry(
                `${data.player_name || 'Player'} dealt ${data.damage} damage to ${enemyName}! 💥 CRITICAL STRIKE!`,
                'critical'
            );
            // Add visual effect for critical strike
            showCriticalStrikeEffect(data.enemy_id);
        } else {
            addBattleLogEntry(
                `${data.player_name || 'Player'} dealt ${data.damage} damage to ${enemyName}!`,
                'attack'
            );
        }

        updateEnemyHP(data.enemy_id, data.enemy_hp_remaining, enemyHpMax);

        // Re-enable attack buttons
        const attackButtons = document.querySelectorAll('button');
        attackButtons.forEach(btn => {
            if (btn.textContent === 'Attacking...') {
                btn.disabled = false;
                btn.textContent = '⚔️ Attack';
            }
        });
    });

    battleWS.on('enemy_defeated', (data) => {
        // Find enemy name from battle data
        const enemy = battle.enemies.find(e => e.id === data.enemy_id);
        const enemyName = enemy ? enemy.name : 'Enemy';

        addBattleLogEntry(`💀 ${enemyName} has been defeated!`, 'success');
        markEnemyAsDefeated(data.enemy_id);
    });

    battleWS.on('battle_completed', (data) => {
        addBattleLogEntry('🏆 Victory! All enemies defeated!', 'victory');
        updateConnectionStatus('completed', '✅ Battle Complete');

        // Show victory UI dynamically instead of reloading
        showVictoryUI(battle, battleWS);
    });

    battleWS.on('loot_claimed', (data) => {
        addBattleLogEntry(
            `${data.player_name} claimed loot: ${data.gold_gained} gold, ${data.exp_gained} XP!`,
            'success'
        );
    });

    battleWS.on('chat', (data) => {
        addBattleLogEntry(`💬 ${data.player_name}: ${data.message}`, 'chat');
    });

    // Boss Raid specific events
    battleWS.on('boss_phase_change', (data) => {
        console.log('[Battle] Boss phase change:', data);

        addBattleLogEntry(
            `🔥 ${data.description || `Boss entered Phase ${data.new_phase}!`}`,
            'warning'
        );

        // Update phase indicator
        const currentPhaseEl = document.getElementById('current-phase');
        const phaseBarEl = document.getElementById('phase-progress-bar');
        const totalPhasesEl = document.getElementById('total-phases');

        if (currentPhaseEl) {
            currentPhaseEl.textContent = data.new_phase;
        }

        if (phaseBarEl && totalPhasesEl) {
            const totalPhases = parseInt(totalPhasesEl.textContent) || 3;
            const progress = (data.new_phase / totalPhases) * 100;
            phaseBarEl.style.width = `${progress}%`;
        }

        // Visual effect
        NotificationSystem.show(`Boss Phase ${data.new_phase}!`, 'warning', 3000);
    });

    battleWS.on('player_resurrected', (data) => {
        addBattleLogEntry(
            `✨ ${data.message || `${data.player_name} has been resurrected!`}`,
            'success'
        );

        // Hide death status if it's us
        const deathStatus = document.getElementById('death-status');
        if (deathStatus && deathStatus.style.display !== 'none') {
            deathStatus.style.display = 'none';
        }
    });

    // Connect
    battleWS.connect();

    // Store globally for cleanup
    window.currentBattleWS = battleWS;
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(status, text) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    const colors = {
        connected: '#22c55e',
        reconnecting: '#f59e0b',
        error: '#ef4444',
        completed: '#6b7280'
    };

    statusEl.innerHTML = `<span style="color: ${colors[status] || colors.reconnecting};">${text}</span>`;
}

/**
 * Add entry to battle log
 */
function addBattleLogEntry(message, type = 'info') {
    const logEl = document.getElementById('battle-log');
    if (!logEl) return;

    // Clear placeholder
    if (logEl.querySelector('div[style*="font-style: italic"]')) {
        logEl.innerHTML = '';
    }

    const entry = document.createElement('div');

    // Special styling for critical strikes
    if (type === 'critical') {
        entry.style.cssText = `
            padding: 10px 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1));
            border: 2px solid rgba(239, 68, 68, 0.6);
            animation: criticalPulse 0.6s ease-out;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
        `;
    } else {
        entry.style.cssText = 'padding: 8px; margin-bottom: 8px; border-radius: 4px; background: var(--bg-primary);';
    }

    const colors = {
        info: 'var(--text-secondary)',
        success: 'var(--color-success)',
        warning: '#f59e0b',
        error: 'var(--color-error)',
        attack: 'var(--text-gold)',
        critical: '#ef4444',
        victory: 'var(--text-gold)',
        chat: '#3b82f6'
    };

    const timestamp = new Date().toLocaleTimeString();

    // Special formatting for critical strikes
    if (type === 'critical') {
        entry.innerHTML = `
            <span style="color: var(--text-secondary); font-size: 0.85em;">[${timestamp}]</span>
            <span style="
                color: ${colors[type]};
                margin-left: 8px;
                font-weight: 900;
                font-size: 1.05em;
                text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
                letter-spacing: 0.3px;
            ">${message}</span>
        `;
    } else {
        entry.innerHTML = `
            <span style="color: var(--text-secondary); font-size: 0.85em;">[${timestamp}]</span>
            <span style="color: ${colors[type] || colors.info}; margin-left: 8px;">${message}</span>
        `;
    }

    logEl.appendChild(entry);

    // Auto-scroll to bottom
    logEl.scrollTop = logEl.scrollHeight;

    // Limit log entries to last 50
    while (logEl.children.length > 50) {
        logEl.removeChild(logEl.firstChild);
    }
}

/**
 * Show critical strike visual effect on enemy card
 */
function showCriticalStrikeEffect(enemyId) {
    const card = document.querySelector(`[data-enemy-id="${enemyId}"]`);
    if (!card) return;

    // Create critical strike overlay
    const critOverlay = document.createElement('div');
    critOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%);
        border-radius: var(--radius-lg);
        pointer-events: none;
        z-index: 100;
        animation: criticalFlash 0.6s ease-out;
    `;

    // Add flash effect to card
    const originalPosition = card.style.position;
    card.style.position = 'relative';
    card.appendChild(critOverlay);

    // Shake effect on the card
    card.style.animation = 'criticalShake 0.5s ease-out';

    // Remove overlay after animation
    setTimeout(() => {
        if (critOverlay.parentNode) {
            critOverlay.remove();
        }
        card.style.animation = '';
        if (originalPosition) {
            card.style.position = originalPosition;
        }
    }, 600);

    // Add floating damage text
    const damageText = document.createElement('div');
    damageText.textContent = 'CRITICAL!';
    damageText.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2em;
        font-weight: 900;
        color: #ef4444;
        text-shadow: 0 0 20px rgba(239, 68, 68, 0.8),
                     0 0 40px rgba(239, 68, 68, 0.6),
                     2px 2px 4px rgba(0, 0, 0, 0.8);
        pointer-events: none;
        z-index: 101;
        animation: criticalTextFloat 0.8s ease-out forwards;
        letter-spacing: 2px;
    `;
    card.appendChild(damageText);

    setTimeout(() => {
        if (damageText.parentNode) {
            damageText.remove();
        }
    }, 800);
}

/**
 * Update enemy HP display
 */
function updateEnemyHP(enemyId, hpCurrent, hpMax) {
    const card = document.querySelector(`[data-enemy-id="${enemyId}"]`);

    if (!card) {
        return;
    }

    const hpText = card.querySelector('.enemy-hp-text');
    const hpBar = card.querySelector('.enemy-hp-bar');

    if (hpText) {
        hpText.textContent = `${hpCurrent} / ${hpMax}`;
    }

    if (hpBar) {
        const percent = (hpCurrent / hpMax) * 100;
        hpBar.style.width = `${percent}%`;
    }
}

/**
 * Mark enemy as defeated
 */
function markEnemyAsDefeated(enemyId) {
    const card = document.querySelector(`[data-enemy-id="${enemyId}"]`);
    if (!card) return;

    // Update title
    const title = card.querySelector('.card-title');
    if (title && !title.textContent.includes('☠️')) {
        title.textContent += ' ☠️';
    }

    // Replace attack button with defeated message
    const body = card.querySelector('.card-body');
    const attackBtn = body.querySelector('button');
    if (attackBtn) {
        attackBtn.remove();

        const defeatedMsg = document.createElement('div');
        defeatedMsg.textContent = '☠️ Defeated';
        defeatedMsg.style.cssText = 'text-align: center; padding: 12px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-md);';
        body.appendChild(defeatedMsg);
    }

    // Grey out card
    card.style.opacity = '0.6';
}

/**
 * Update players list
 */
function updatePlayersList(players) {
    const listEl = document.getElementById('players-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    players.forEach(player => {
        const playerRow = document.createElement('div');
        playerRow.style.cssText = `
            padding: 8px 12px;
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        playerRow.innerHTML = `
            <span style="font-size: 1.2em;">👤</span>
            <span style="color: var(--text-primary); font-weight: bold;">${player.username || player.name || 'Player'}</span>
            <span style="color: var(--text-secondary); font-size: 0.85em; margin-left: auto;">Lv ${player.level || '?'}</span>
        `;

        listEl.appendChild(playerRow);
    });
}

/**
 * Helper functions for colors
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

function getStatusColor(status) {
    const colors = {
        waiting: '#3b82f6',
        in_progress: '#22c55e',
        completed: '#6b7280'
    };
    return colors[status] || colors.waiting;
}

/**
 * Show death status UI (for boss raids)
 */
function showDeathStatus() {
    const deathStatus = document.getElementById('death-status');
    if (!deathStatus) return;

    deathStatus.style.display = 'block';

    // Show resurrection button
    const resurrectBtn = document.getElementById('resurrect-btn');
    if (resurrectBtn) {
        resurrectBtn.style.display = 'inline-block';

        // Remove old handlers and add new one
        const newBtn = resurrectBtn.cloneNode(true);
        resurrectBtn.parentNode.replaceChild(newBtn, resurrectBtn);

        newBtn.addEventListener('click', async () => {
            newBtn.disabled = true;
            newBtn.textContent = 'Resurrecting...';

            try {
                const battleId = window.location.hash.split('/')[1];
                const response = await fetch(`${apiClient.baseURL}/battles/${battleId}/resurrect?use_potion=true`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiClient.getToken()}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Failed to resurrect');
                }

                NotificationSystem.show('You have been resurrected!', 'success');
                deathStatus.style.display = 'none';
            } catch (error) {
                NotificationSystem.show(error.message, 'error');
                newBtn.disabled = false;
                newBtn.textContent = '⚡ Resurrect (50 gems)';
            }
        });
    }

    // TODO: Start countdown timer for natural resurrection (15 minutes)
    // For now, we'll just show the button option
}

// Cleanup on page navigation (only add listener once)
if (!window.battleWSCleanupRegistered) {
    window.battleWSCleanupRegistered = true;
    window.addEventListener('hashchange', () => {
        if (window.currentBattleWS) {
            console.log('[Battle] Cleaning up WebSocket on navigation');
            window.currentBattleWS.removeAllHandlers();
            window.currentBattleWS.disconnect();
            window.currentBattleWS = null;
        }
    });
}

// Make it globally available
window.createRealTimeBattleView = createRealTimeBattleView;
