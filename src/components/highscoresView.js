/**
 * Highscores View - Hall of Legends
 * Displays leaderboards with dramatic ancient scroll aesthetic
 */

async function createHighscoresView() {
    const container = document.createElement('div');
    container.className = 'highscores-container';

    // Header with dramatic title
    const header = document.createElement('div');
    header.className = 'highscores-header';
    header.innerHTML = `
        <div class="hall-emblem">⚔️</div>
        <h1 class="hall-title">Hall of Legends</h1>
        <div class="hall-subtitle">Where Heroes Earn Immortality</div>
        <div class="decorative-divider">
            <span class="divider-ornament">✦</span>
            <span class="divider-line"></span>
            <span class="divider-ornament">✦</span>
        </div>
    `;
    container.appendChild(header);

    // Loading state
    const loadingEl = document.createElement('div');
    loadingEl.className = 'highscores-loading';
    loadingEl.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Consulting the Ancient Records...</div>
    `;
    container.appendChild(loadingEl);

    // Fetch highscores data
    try {
        const data = await apiClient.request('/api/highscores', {
            method: 'GET'
        });

        // Remove loading
        loadingEl.remove();

        // Create tab navigation
        const tabNav = document.createElement('div');
        tabNav.className = 'highscores-tabs';
        tabNav.innerHTML = `
            <button class="tab-button active" data-tab="level">
                <span class="tab-icon">👑</span>
                <span class="tab-label">Legendary Champions</span>
                <span class="tab-sublabel">Ranked by Power</span>
            </button>
            <button class="tab-button" data-tab="items">
                <span class="tab-icon">⚡</span>
                <span class="tab-label">Arsenal Masters</span>
                <span class="tab-sublabel">Ranked by Gear</span>
            </button>
        `;
        container.appendChild(tabNav);

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'highscores-content';
        container.appendChild(contentArea);

        // Render initial leaderboard
        renderLeaderboard(contentArea, data.by_level, 'level');

        // Tab switching
        const tabs = tabNav.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabType = tab.dataset.tab;
                const leaderboardData = tabType === 'level' ? data.by_level : data.by_item_score;
                renderLeaderboard(contentArea, leaderboardData, tabType);
            });
        });

    } catch (error) {
        console.error('[Highscores] Failed to load:', error);
        loadingEl.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-text">The Ancient Records are Unavailable</div>
                <div class="error-detail">Please try again later</div>
            </div>
        `;
    }

    return container;
}

function renderLeaderboard(container, data, type) {
    // Clear container with fade out
    container.style.opacity = '0';

    setTimeout(() => {
        container.innerHTML = '';

        // Create leaderboard table
        const table = document.createElement('div');
        table.className = 'leaderboard-table';

        // Render entries
        data.forEach((entry, index) => {
            const row = createLeaderboardRow(entry, type);
            row.style.animationDelay = `${index * 0.05}s`;
            table.appendChild(row);
        });

        container.appendChild(table);

        // Fade in
        requestAnimationFrame(() => {
            container.style.opacity = '1';
        });
    }, 300);
}

function createLeaderboardRow(entry, type) {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';

    // Add special styling for top 3
    if (entry.rank <= 3) {
        row.classList.add(`rank-${entry.rank}`);
    }

    // Rank badge
    const rankBadge = document.createElement('div');
    rankBadge.className = 'rank-badge';
    rankBadge.innerHTML = getRankDisplay(entry.rank);
    row.appendChild(rankBadge);

    // Player info
    const playerInfo = document.createElement('div');
    playerInfo.className = 'player-info';
    playerInfo.innerHTML = `
        <div class="player-name">${escapeHtml(entry.username)}</div>
        <div class="player-subtitle">Level ${entry.level} Adventurer</div>
    `;
    row.appendChild(playerInfo);

    // Stats display
    const stats = document.createElement('div');
    stats.className = 'player-stats';

    if (type === 'level') {
        stats.innerHTML = `
            <div class="stat-primary">
                <span class="stat-label">Level</span>
                <span class="stat-value">${entry.level}</span>
            </div>
            <div class="stat-secondary">
                <span class="stat-label">XP</span>
                <span class="stat-value">${formatNumber(entry.exp)}</span>
            </div>
            <div class="stat-secondary">
                <span class="stat-label">Gold</span>
                <span class="stat-value">${formatNumber(entry.gold)}</span>
            </div>
        `;
    } else {
        stats.innerHTML = `
            <div class="stat-primary">
                <span class="stat-label">Item Score</span>
                <span class="stat-value">${formatNumber(entry.item_score)}</span>
            </div>
            <div class="stat-secondary">
                <span class="stat-label">ATK</span>
                <span class="stat-value">${entry.base_attack}</span>
            </div>
            <div class="stat-secondary">
                <span class="stat-label">DEF</span>
                <span class="stat-value">${entry.base_defense}</span>
            </div>
            <div class="stat-secondary">
                <span class="stat-label">HP</span>
                <span class="stat-value">${entry.base_hp}</span>
            </div>
        `;
    }

    row.appendChild(stats);

    return row;
}

function getRankDisplay(rank) {
    switch (rank) {
        case 1:
            return '<div class="rank-medal gold">🥇</div><div class="rank-number">1st</div>';
        case 2:
            return '<div class="rank-medal silver">🥈</div><div class="rank-number">2nd</div>';
        case 3:
            return '<div class="rank-medal bronze">🥉</div><div class="rank-number">3rd</div>';
        default:
            return `<div class="rank-number">${rank}</div>`;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
