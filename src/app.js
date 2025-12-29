/**
 * Main Application Entry Point
 */

// Register all routes
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize icons in header
    if (window.ColoredThemeIcons) {
        document.getElementById('stamina-icon').innerHTML = ColoredThemeIcons.render('stamina');
        document.getElementById('gold-icon').innerHTML = ColoredThemeIcons.render('gold');
        document.getElementById('gems-icon').innerHTML = ColoredThemeIcons.render('gems');
        document.getElementById('exp-icon').innerHTML = ColoredThemeIcons.render('exp');
        document.getElementById('time-icon').innerHTML = ColoredThemeIcons.render('clock');
    }

    // Initialize auth button
    initializeAuthButton();

    // Initialize potions resource button (replaces gems)
    const potionsResourceButton = document.getElementById('potions-resource-button');
    if (potionsResourceButton) {
        potionsResourceButton.addEventListener('click', () => {
            router.navigate('potions');
        });

        // Add hover effect
        potionsResourceButton.addEventListener('mouseenter', () => {
            potionsResourceButton.style.transform = 'scale(1.05)';
            potionsResourceButton.style.transition = 'transform 0.2s';
        });
        potionsResourceButton.addEventListener('mouseleave', () => {
            potionsResourceButton.style.transform = 'scale(1)';
        });
    }

    // Auth route (must be registered first, before auth check)
    router.register('auth', () => {
        return createAuthView();
    });

    // Load initial data for authenticated users
    if (apiClient.isAuthenticated()) {
        try {
            // Fetch player info first
            const playerData = await apiClient.getPlayerInfo();
            gameState.set('player', playerData);

            // Then load other data in parallel
            await Promise.all([
                InventoryData.getInventory(),
                ShopData.getShopCatalog(),
                PetData.getPetState()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    // Optional: Uncomment to enforce authentication
    /*
    if (!apiClient.isAuthenticated()) {
        router.start();
        router.navigate('auth');
        return;
    }
    */

    // Dashboard route
    router.register('dashboard', () => {
        const container = document.createElement('div');
        container.style.cssText = 'max-width: 1400px; margin: 0 auto; padding: 20px;';

        // Welcome Section
        const welcomeSection = document.createElement('div');
        welcomeSection.style.cssText = `
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
            padding: 24px 32px;
            margin-bottom: 32px;
        `;
        welcomeSection.innerHTML = `
            <h1 style="color: var(--text-primary); font-size: 2em; margin: 0 0 8px 0;">
                Welcome to Fantasy RPG
            </h1>
            <p style="color: var(--text-secondary); margin: 0; font-size: 1.1em;">
                Embark on epic adventures, battle fearsome monsters, and become a legend
            </p>
        `;
        container.appendChild(welcomeSection);

        // Core Activities Section
        const coreSection = createSectionHeader(ColoredThemeIcons.render('battle'), 'Core Activities');
        coreSection.style.marginBottom = '16px';
        container.appendChild(coreSection);

        const coreActivities = [
            {
                title: 'Battles',
                body: 'Multiplayer battles and boss raids<br><small>Fight with others in epic encounters!</small>',
                badge: 'HOT',
                onClick: () => router.navigate('battles?tab=standard')
            },
            {
                title: 'Boss Raids',
                body: 'Epic boss encounters<br><small>Team up to defeat legendary foes!</small>',
                badge: 'NEW',
                onClick: () => router.navigate('battles?tab=boss_raid')
            },
            {
                title: 'PVP Arena — Dueling',
                body: 'Challenge players to honorable combat<br><small>Fight for gold and glory!</small>',
                badge: 'NEW',
                onClick: () => router.navigate('pvp-arena')
            },
            {
                title: 'Live Events',
                body: 'The Goblin Feast of Shadows<br><small>Limited time event!</small>',
                badge: 'LIVE',
                onClick: () => NotificationSystem.show('Events coming soon!', 'info')
            }
        ];

        const coreGrid = document.createElement('div');
        coreGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;';

        coreActivities.forEach(activity => {
            const card = createCard({
                title: activity.title,
                body: activity.body,
                onClick: activity.onClick
            });

            // Enhanced card styling
            card.style.cssText = `
                background: var(--bg-card);
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            `;

            // Add hover effect
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)';
                card.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
                card.style.borderColor = 'rgba(139, 92, 246, 0.2)';
            });

            if (activity.badge) {
                const badge = createBadge(activity.badge, activity.badge === 'NEW' ? 'success' : 'legendary');
                badge.style.cssText = 'position: absolute; top: 12px; right: 12px; z-index: 1;';
                card.insertBefore(badge, card.firstChild);
            }

            coreGrid.appendChild(card);
        });

        container.appendChild(coreGrid);

        // Game Menu Section
        const menuSection = createSectionHeader(ColoredThemeIcons.render('menu'), 'Game Menu');
        menuSection.style.cssText = 'margin-top: 48px; margin-bottom: 16px;';
        container.appendChild(menuSection);

        const menuItems = [
            { icon: ColoredThemeIcons.render('battle'), title: 'Battles', route: 'battles', description: 'Epic multiplayer encounters', highlight: true },
            { icon: '🍺', title: 'The Tavern', route: 'chat', description: 'Chat with other players', highlight: false },
            { icon: ColoredThemeIcons.render('inventory'), title: 'Inventory', route: 'inventory', description: 'Manage equipment & items' },
            { icon: ColoredThemeIcons.render('pets'), title: 'Companions', route: 'pets', description: 'Your loyal battle pets' },
            { icon: ColoredThemeIcons.render('stats'), title: 'Character', route: 'stats', description: 'Stats & progression' },
            { icon: ColoredThemeIcons.render('merchant'), title: 'Shop', route: 'merchant', description: 'Buy items & equipment' }
        ];

        const menuGrid = document.createElement('div');
        menuGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;';

        menuItems.forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: ${item.highlight ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))' : 'var(--bg-card)'};
                border: 1px solid ${item.highlight ? 'rgba(34, 197, 94, 0.3)' : 'rgba(139, 92, 246, 0.15)'};
                border-radius: 8px;
                padding: 20px 16px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
            `;

            card.innerHTML = `
                <div style="font-size: 2.5em; margin-bottom: 12px;">${item.icon}</div>
                <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95em; margin-bottom: 6px;">${item.title}</div>
                ${item.description ? `<div style="font-size: 0.75em; color: var(--text-secondary); font-style: italic; line-height: 1.3;">${item.description}</div>` : ''}
            `;

            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.borderColor = item.highlight ? 'rgba(34, 197, 94, 0.6)' : 'rgba(139, 92, 246, 0.4)';
                card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.borderColor = item.highlight ? 'rgba(34, 197, 94, 0.3)' : 'rgba(139, 92, 246, 0.15)';
                card.style.boxShadow = 'none';
            });

            card.addEventListener('click', () => {
                if (item.route === 'inventory' || item.route === 'stats' ||
                    item.route === 'achievements' || item.route === 'battles' ||
                    item.route === 'merchant' || item.route === 'shop' ||
                    item.route === 'pets' || item.route === 'auth' || item.route === 'chat') {
                    router.navigate(item.route);
                } else {
                    NotificationSystem.show(`${item.title} coming soon!`, 'info');
                }
            });

            menuGrid.appendChild(card);
        });

        container.appendChild(menuGrid);

        return container;
    });

    // Battles route - Multiplayer battles (regular and boss raids)
    router.register('battles', async () => {
        return await createApiBattleView();
    });

    // Real-time Battle route - Live multiplayer battle
    router.register('battle-live/:battleId', async (params) => {
        return await createRealTimeBattleView(params.battleId);
    });

    // Inventory route - Full implementation
    router.register('inventory', () => {
        return createInventoryView();
    });

    // Shop/Merchant route
    router.register('merchant', async () => {
        return await createShopView();
    });

    router.register('shop', async () => {
        return await createShopView();
    });

    // Stats route
    router.register('stats', () => {
        const container = document.createElement('div');
        container.appendChild(createBackButton());
        container.appendChild(createSectionHeader('📊', 'Stats'));

        const player = PlayerData.get();

        // Create two-column layout
        const layout = document.createElement('div');
        layout.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;';

        // Allocate Stat Points Card
        const allocateCard = createCard({
            title: '🎯 Allocate Stat Points',
            body: ''
        });

        const unspentEl = document.createElement('div');
        unspentEl.style.cssText = 'margin-bottom: 20px; font-size: 1.2em;';
        unspentEl.innerHTML = `<strong>Unspent Points:</strong> <span style="color: var(--text-gold);" id="unspent-points">${player.unspent_stat_points || 0}</span>`;
        allocateCard.querySelector('.card-body').appendChild(unspentEl);

        const stats = [
            { key: 'attack', label: 'ATTACK' },
            { key: 'defense', label: 'DEFENSE' },
            { key: 'maxStamina', label: 'MAX STAMINA' }
        ];

        stats.forEach(stat => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);';

            const label = document.createElement('span');
            label.textContent = stat.label;
            label.style.cssText = 'color: var(--text-gold); font-weight: bold;';

            const controls = document.createElement('div');
            controls.style.cssText = 'display: flex; gap: 8px; align-items: center;';

            const btn1 = createButton({
                text: '+1',
                variant: 'primary',
                onClick: async () => {
                    btn1.disabled = true;
                    const success = await PlayerData.allocateStats(stat.key, 1);
                    if (success) {
                        updateStatsDisplay();
                    }
                    btn1.disabled = false;
                }
            });

            const btn5 = createButton({
                text: '+5',
                variant: 'success',
                onClick: async () => {
                    btn5.disabled = true;
                    const success = await PlayerData.allocateStats(stat.key, 5);
                    if (success) {
                        updateStatsDisplay();
                    }
                    btn5.disabled = false;
                }
            });

            controls.appendChild(btn1);
            controls.appendChild(btn5);

            row.appendChild(label);
            row.appendChild(controls);
            allocateCard.querySelector('.card-body').appendChild(row);
        });

        const note = document.createElement('p');
        note.style.cssText = 'margin-top: 16px; font-size: 0.85em; color: var(--text-secondary); font-style: italic;';
        note.textContent = 'Each point adds +1 to the chosen stat.';
        allocateCard.querySelector('.card-body').appendChild(note);

        function updateStatsDisplay() {
            const player = PlayerData.get();
            document.getElementById('unspent-points').textContent = player.unspent_stat_points || 0;
            document.getElementById('attack-value').textContent = PlayerData.getTotalAttack();
            document.getElementById('defense-value').textContent = PlayerData.getTotalDefense();
            document.getElementById('stamina-value-display').textContent = player.stamina_max;
        }

        layout.appendChild(allocateCard);

        // Current Stats Card
        const currentCard = createCard({
            title: '⚔️ Current Stats',
            body: ''
        });

        const currentStats = [
            { label: 'ATTACK', value: PlayerData.getTotalAttack(), id: 'attack-value' },
            { label: 'DEFENSE', value: PlayerData.getTotalDefense(), id: 'defense-value' },
            { label: 'MAX STAMINA', value: player.stamina_max, id: 'stamina-value-display' }
        ];

        currentStats.forEach(stat => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);';

            const label = document.createElement('span');
            label.textContent = stat.label;
            label.style.cssText = 'color: var(--text-secondary);';

            const value = document.createElement('span');
            value.id = stat.id;
            value.textContent = stat.value;
            value.style.cssText = 'color: var(--text-primary); font-weight: bold; font-size: 1.2em;';

            row.appendChild(label);
            row.appendChild(value);
            currentCard.querySelector('.card-body').appendChild(row);
        });

        layout.appendChild(currentCard);
        container.appendChild(layout);

        return container;
    });

    // Pets route - Full implementation
    router.register('pets', () => {
        return createPetsView();
    });

    // Potions route - Quick access to use potions
    router.register('potions', async () => {
        return await createPotionsView();
    });

    // Chat route - Tavern chat system
    router.register('chat', async () => {
        return await createChatView();
    });

    // PVP Arena route - Dueling system
    router.register('pvp-arena', async () => {
        return await createPvpArenaView();
    });

    // Real-time PVP Battle route
    router.register('pvp-battle/:battleId/:duelId', async (params) => {
        return await createRealTimePvpBattleView(params.battleId, params.duelId);
    });

    // Achievements route (placeholder)
    router.register('achievements', () => {
        const container = document.createElement('div');
        container.appendChild(createBackButton());
        container.appendChild(createSectionHeader('🏆', 'Achievements'));

        const info = document.createElement('div');
        info.style.cssText = 'text-align: center; margin: 20px 0; color: var(--text-secondary);';
        info.innerHTML = `
            <p style="margin-bottom: 10px;">Achievements system will be implemented in Phase 9</p>
            <p>Progress tracking • Rewards • Requirements • Claim functionality</p>
        `;
        container.appendChild(info);

        return container;
    });

    // Start the router after all routes are registered
    router.start();

    // Initialize player data UI (delayed to ensure DOM is ready)
    setTimeout(() => {
        PlayerData.updateUI();
    }, 100);

    // Show welcome message
    setTimeout(() => {
        NotificationSystem.show('Welcome to Fantasy RPG!', 'success', 4000);
    }, 500);
});

/**
 * Sync player data from API (for when authentication is enabled)
 */
async function syncPlayerData() {
    try {
        const player = await apiClient.getPlayerInfo();

        if (typeof PlayerData !== 'undefined' && PlayerData.setApiData) {
            PlayerData.setApiData(player);
        }

        if (typeof PlayerData !== 'undefined' && PlayerData.updateUI) {
            PlayerData.updateUI();
        }

        return player;
    } catch (error) {
        console.error('Failed to sync player data:', error);
        throw error;
    }
}

/**
 * Initialize auth button in header
 */
function initializeAuthButton() {
    const authButton = document.getElementById('auth-button');
    const authButtonIcon = authButton.querySelector('.auth-button-icon');
    const authButtonText = authButton.querySelector('.auth-button-text');

    function updateAuthButton() {
        if (apiClient.isAuthenticated()) {
            // Logged in - show logout button
            authButtonIcon.textContent = '🚪';
            authButtonText.textContent = 'Logout';
            authButton.classList.add('logout');
            
            authButton.onclick = () => {
                apiClient.logout();
                NotificationSystem.show('Logged out successfully', 'success');
                updateAuthButton();
                router.navigate('auth');
            };
        } else {
            // Logged out - show login button
            authButtonIcon.textContent = '🔑';
            authButtonText.textContent = 'Login';
            authButton.classList.remove('logout');
            
            authButton.onclick = () => {
                router.navigate('auth');
            };
        }
    }

    // Initial update
    updateAuthButton();

    // Update when auth state changes
    window.addEventListener('auth-state-changed', updateAuthButton);
}
