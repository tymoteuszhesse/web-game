/**
 * Shop View Component
 * Browse and purchase items from the shop
 */

async function createShopView() {
    const container = document.createElement('div');
    container.appendChild(createBackButton());

    // Enhanced Merchant Header
    const merchantHeader = document.createElement('div');
    merchantHeader.style.cssText = `
        background: linear-gradient(135deg, #8b4513 0%, #654321 100%);
        border: 2px solid #d4af37;
        border-radius: var(--radius-lg);
        padding: 24px;
        margin-bottom: 20px;
        text-align: center;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(139, 69, 19, 0.4);
    `;

    // Decorative background pattern
    const pattern = document.createElement('div');
    pattern.style.cssText = `
        position: absolute;
        inset: 0;
        background-image:
            radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 60%, rgba(212, 175, 55, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, rgba(212, 175, 55, 0.1) 1px, transparent 1px);
        background-size: 50px 50px;
        opacity: 0.5;
        pointer-events: none;
    `;
    merchantHeader.appendChild(pattern);

    const merchantTitle = document.createElement('div');
    merchantTitle.style.cssText = `
        position: relative;
        z-index: 1;
    `;
    merchantTitle.innerHTML = `
        <div style="font-size: 3em; margin-bottom: 8px;">🏪</div>
        <div style="font-size: 1.8em; font-weight: bold; color: #d4af37; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            Merchant's Emporium
        </div>
        <div style="font-size: 0.9em; color: #f5deb3; margin-top: 8px; font-style: italic;">
            "Quality goods for the discerning adventurer"
        </div>
    `;
    merchantHeader.appendChild(merchantTitle);
    container.appendChild(merchantHeader);

    // Load shop data first
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
    loadingMsg.textContent = 'Loading shop items...';
    container.appendChild(loadingMsg);

    // Fetch shop catalog from API
    await ShopData.getShopCatalog();

    // Remove loading message
    container.removeChild(loadingMsg);

    // Enhanced Player gold display
    const goldDisplay = document.createElement('div');
    goldDisplay.id = 'shop-gold-display';
    goldDisplay.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
        border: 2px solid rgba(255, 215, 0, 0.4);
        border-radius: var(--radius-lg);
        padding: 20px;
        margin-bottom: 20px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
        position: relative;
        overflow: hidden;
    `;

    // Shine effect
    const shine = document.createElement('div');
    shine.style.cssText = `
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
        );
        animation: goldShine 3s ease-in-out infinite;
        pointer-events: none;
    `;
    goldDisplay.appendChild(shine);

    function updateGoldDisplay() {
        const player = PlayerData.get();
        const contentDiv = goldDisplay.querySelector('.gold-content') || document.createElement('div');
        contentDiv.className = 'gold-content';
        contentDiv.style.cssText = 'position: relative; z-index: 1;';
        contentDiv.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.95em; margin-bottom: 6px; font-weight: 500;">Your Wealth</div>
            <div style="color: #ffd700; font-size: 2em; font-weight: bold; text-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);">
                🪙 ${Math.floor(player.gold || 0).toLocaleString('en-US')}
            </div>
            <div style="color: var(--text-secondary); font-size: 0.8em; margin-top: 4px;">Gold Coins</div>
        `;
        if (!goldDisplay.querySelector('.gold-content')) {
            goldDisplay.appendChild(contentDiv);
        }
    }

    updateGoldDisplay();
    container.appendChild(goldDisplay);

    // Tab state
    let currentTab = 'all';
    let currentSort = 'rarity'; // price-asc, price-desc, level-asc, level-desc, rarity, name, accessibility
    let searchQuery = '';
    let hideUnavailable = false; // Filter toggle

    // Tab buttons container
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = `
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    `;

    const tabs = [
        { id: 'all', label: '🛒 All Items', emoji: '🛒' },
        { id: 'weapons', label: '⚔️ Weapons', emoji: '⚔️' },
        { id: 'armor', label: '🛡️ Armor', emoji: '🛡️' },
        { id: 'accessories', label: '💍 Accessories', emoji: '💍' }
    ];

    // Content area that will be updated
    const contentArea = document.createElement('div');
    contentArea.id = 'shop-content';

    // Function to render items for current tab
    function renderItems(category) {
        currentTab = category;

        // Update gold display
        updateGoldDisplay();

        // Update tab button styles
        tabContainer.querySelectorAll('button').forEach(btn => {
            if (btn.dataset.tab === category) {
                btn.style.background = 'var(--color-success)';
                btn.style.borderColor = 'var(--color-success)';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'var(--bg-card)';
                btn.style.borderColor = 'var(--border-primary)';
                btn.style.color = 'var(--text-primary)';
            }
        });

        // Get items for this category
        let items = ShopData.getItemsByCategory(category);

        // Apply search filter
        if (searchQuery) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery) ||
                item.type.toLowerCase().includes(searchQuery) ||
                item.rarity.toLowerCase().includes(searchQuery)
            );
        }

        // Apply availability filter
        if (hideUnavailable) {
            const player = PlayerData.get();
            items = items.filter(item => {
                const canAfford = ShopData.canAfford(item);
                const meetsLevel = ShopData.meetsLevelRequirement(item);
                return canAfford && meetsLevel;
            });
        }

        // Apply sorting
        const rarityOrder = { 'LEGENDARY': 5, 'EPIC': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1 };
        items.sort((a, b) => {
            switch (currentSort) {
                case 'accessibility':
                    // Sort by can afford + meets level (available first), then by price
                    const aAfford = ShopData.canAfford(a) ? 1 : 0;
                    const bAfford = ShopData.canAfford(b) ? 1 : 0;
                    const aLevel = ShopData.meetsLevelRequirement(a) ? 1 : 0;
                    const bLevel = ShopData.meetsLevelRequirement(b) ? 1 : 0;
                    const aScore = (aAfford * 2) + aLevel;
                    const bScore = (bAfford * 2) + bLevel;
                    if (aScore !== bScore) return bScore - aScore;
                    // If same accessibility, sort by price (low to high)
                    return a.price - b.price;
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'level-asc':
                    return a.level - b.level;
                case 'level-desc':
                    return b.level - a.level;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rarity':
                default:
                    // Sort by rarity (legendary first), then by price
                    const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                    return rarityDiff !== 0 ? rarityDiff : b.price - a.price;
            }
        });

        // Clear content
        contentArea.innerHTML = '';

        if (items.length === 0) {
            const noResults = document.createElement('div');
            noResults.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
            noResults.textContent = searchQuery ? `No items found matching "${searchQuery}"` : 'No items in this category';
            contentArea.appendChild(noResults);
            return;
        }

        // Create grid
        const grid = createGrid(4, []);
        grid.style.marginBottom = '20px';

        // Add item cards
        items.forEach(item => {
            const card = createShopItemCard(item, renderItems, currentTab);
            grid.appendChild(card);
        });

        contentArea.appendChild(grid);

        // Show count
        const countText = document.createElement('div');
        countText.style.cssText = 'color: var(--text-secondary); text-align: center; margin-top: 20px;';
        countText.textContent = `Showing ${items.length} items`;
        contentArea.appendChild(countText);
    }

    // Create tab buttons
    tabs.forEach(tab => {
        const btn = createButton({
            text: tab.label,
            variant: 'secondary',
            onClick: () => renderItems(tab.id)
        });
        btn.dataset.tab = tab.id;
        btn.style.flex = '1';
        btn.style.minWidth = '120px';
        tabContainer.appendChild(btn);
    });

    container.appendChild(tabContainer);

    // Filter/Sort controls
    const controlsBar = document.createElement('div');
    controlsBar.style.cssText = `
        background: var(--bg-card);
        padding: 16px;
        border-radius: var(--radius-lg);
        margin-bottom: 20px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
    `;

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '🔍 Search items...';
    searchInput.style.cssText = `
        flex: 1;
        min-width: 200px;
        padding: 10px 14px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 0.95em;
    `;
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderItems(currentTab);
    });
    controlsBar.appendChild(searchInput);

    // Filter toggle button
    const filterToggle = createButton({
        text: hideUnavailable ? '✓ Available Only' : '👁️ Show All',
        variant: hideUnavailable ? 'success' : 'secondary',
        onClick: () => {
            hideUnavailable = !hideUnavailable;
            filterToggle.textContent = hideUnavailable ? '✓ Available Only' : '👁️ Show All';
            filterToggle.style.background = hideUnavailable ? 'var(--color-success)' : 'var(--bg-secondary)';
            filterToggle.style.borderColor = hideUnavailable ? 'var(--color-success)' : 'var(--border-primary)';
            filterToggle.style.color = hideUnavailable ? 'white' : 'var(--text-primary)';
            renderItems(currentTab);
        }
    });
    filterToggle.style.minWidth = '140px';
    filterToggle.title = 'Hide items you cannot afford or don\'t meet level requirements';
    controlsBar.appendChild(filterToggle);

    // Sort dropdown
    const sortLabel = document.createElement('label');
    sortLabel.textContent = 'Sort:';
    sortLabel.style.cssText = 'color: var(--text-secondary); font-size: 0.9em;';
    controlsBar.appendChild(sortLabel);

    const sortSelect = document.createElement('select');
    sortSelect.style.cssText = `
        padding: 10px 14px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 0.95em;
        cursor: pointer;
    `;

    const sortOptions = [
        { value: 'accessibility', label: '✨ Accessibility' },
        { value: 'rarity', label: 'Rarity' },
        { value: 'price-asc', label: 'Price (Low to High)' },
        { value: 'price-desc', label: 'Price (High to Low)' },
        { value: 'level-asc', label: 'Level (Low to High)' },
        { value: 'level-desc', label: 'Level (High to Low)' },
        { value: 'name', label: 'Name (A-Z)' }
    ];

    sortOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        sortSelect.appendChild(option);
    });

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderItems(currentTab);
    });
    controlsBar.appendChild(sortSelect);

    container.appendChild(controlsBar);
    container.appendChild(contentArea);

    // Initial render
    renderItems('all');

    return container;
}

/**
 * Create a shop item card
 * @param {object} item - Shop item
 * @param {function} renderItems - Function to re-render items
 * @param {string} currentTab - Current active tab
 */
function createShopItemCard(item, renderItems, currentTab) {
    const player = PlayerData.get();
    const canAfford = ShopData.canAfford(item);
    const meetsLevel = ShopData.meetsLevelRequirement(item);
    const canPurchase = canAfford && meetsLevel;

    // Check if player already owns this item (by name and type)
    // Use cached inventory data (already loaded in app.js)
    const allItems = [...(InventoryData._cache.items || [])];
    // Also check equipped items
    const attackSet = InventoryData.getEquipped('attack');
    const defenseSet = InventoryData.getEquipped('defense');
    Object.values(attackSet).forEach(i => { if (i) allItems.push(i); });
    Object.values(defenseSet).forEach(i => { if (i) allItems.push(i); });

    const alreadyOwned = allItems.some(ownedItem =>
        ownedItem.name === item.name && ownedItem.type === item.type
    );

    const card = document.createElement('div');
    card.className = 'card shop-item-card';

    // Determine card visual state based on affordability
    let cardOpacity = '1';
    let cardBorderStyle = `2px solid ${InventoryData.getRarityColor(item.rarity)}`;

    if (!meetsLevel) {
        cardOpacity = '0.5';
        cardBorderStyle = `2px dashed #ef4444`;
    } else if (!canAfford) {
        cardOpacity = '0.75';
        cardBorderStyle = `2px solid ${InventoryData.getRarityColor(item.rarity)}60`;
    } else {
        // Can afford and meets level - add glow effect
        cardBorderStyle = `2px solid ${InventoryData.getRarityColor(item.rarity)}`;
    }

    card.style.cssText = `
        border: ${cardBorderStyle};
        background: linear-gradient(135deg, ${InventoryData.getRarityColor(item.rarity)}15, ${InventoryData.getRarityColor(item.rarity)}05);
        position: relative;
        opacity: ${cardOpacity};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: visible;
        ${canPurchase ? `box-shadow: 0 0 20px ${InventoryData.getRarityColor(item.rarity)}20;` : ''}
    `;

    // Add hover state handlers
    card.addEventListener('mouseenter', () => {
        if (meetsLevel) {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = `
                0 12px 24px ${InventoryData.getRarityColor(item.rarity)}40,
                0 0 0 3px ${InventoryData.getRarityColor(item.rarity)}30
            `;
        }
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    });

    // Availability status badge (top left)
    const statusBadge = document.createElement('div');
    statusBadge.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.7em;
        font-weight: bold;
        z-index: 3;
    `;

    if (alreadyOwned) {
        statusBadge.style.background = 'var(--color-info)';
        statusBadge.style.color = 'white';
        statusBadge.textContent = '✓ OWNED';
    } else if (!meetsLevel) {
        statusBadge.style.background = '#ef4444';
        statusBadge.style.color = 'white';
        statusBadge.textContent = '🔒 LOCKED';
    } else if (canPurchase) {
        statusBadge.style.background = 'var(--color-success)';
        statusBadge.style.color = 'white';
        statusBadge.textContent = '✓ AVAILABLE';
    } else if (!canAfford) {
        statusBadge.style.background = '#fbbf24';
        statusBadge.style.color = '#1a1a1a';
        statusBadge.textContent = '💰 TOO EXPENSIVE';
    }
    card.appendChild(statusBadge);

    // Rarity badge (top right)
    const rarityBadge = document.createElement('div');
    rarityBadge.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: ${InventoryData.getRarityColor(item.rarity)};
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.7em;
        font-weight: bold;
        z-index: 3;
    `;
    rarityBadge.textContent = item.rarity;
    card.appendChild(rarityBadge);

    // Get category-specific styling
    const categoryStyle = getCategoryStyle(item.type, item.rarity);

    // Item icon placeholder - Enhanced version with category-specific treatments
    const iconPlaceholder = document.createElement('div');
    const legendaryClass = item.rarity === 'LEGENDARY' ? 'legendary-particles' : '';
    iconPlaceholder.className = `shop-item-icon ${categoryStyle.className} ${legendaryClass}`;
    iconPlaceholder.style.cssText = `
        width: 80px;
        height: 80px;
        background: ${categoryStyle.background};
        border-radius: 8px;
        margin: 8px auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5em;
        position: relative;
        overflow: visible;
        box-shadow: ${categoryStyle.shadow};
        border: 2px solid ${categoryStyle.borderColor};
        transition: all 0.3s ease;
    `;

    // Add animated background effects for special item types
    if (categoryStyle.hasEffect) {
        const effectLayer = document.createElement('div');
        effectLayer.className = categoryStyle.effectClass;
        effectLayer.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            ${categoryStyle.effectStyle}
        `;
        iconPlaceholder.appendChild(effectLayer);
    }

    // Enhanced icon loading for weapons with custom PNG icons
    if (item.icon && item.type === 'WEAPON') {
        const iconImg = document.createElement('img');
        iconImg.src = `assets/icons/weapons/${item.icon}`;
        iconImg.alt = item.name;
        iconImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 8px;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            filter: drop-shadow(0 0 8px ${InventoryData.getRarityColor(item.rarity)}60);
        `;

        iconImg.onload = function() {
            // Fade in the image smoothly
            iconImg.style.opacity = '1';
        };

        iconImg.onerror = function() {
            // Remove failed image
            if (iconImg.parentNode) {
                iconPlaceholder.removeChild(iconImg);
            }
            // Show emoji fallback with nice styling
            const emojiIcon = document.createElement('div');
            emojiIcon.style.cssText = `
                font-size: 2.5em;
                text-shadow: 0 2px 8px ${InventoryData.getRarityColor(item.rarity)}80;
                animation: fadeIn 0.3s ease-in-out;
            `;
            emojiIcon.textContent = getItemEmoji(item);
            iconPlaceholder.appendChild(emojiIcon);
        };

        iconPlaceholder.appendChild(iconImg);
    } else {
        // Use emoji for items without icon property
        const emojiIcon = document.createElement('div');
        emojiIcon.style.cssText = `
            font-size: 2.5em;
            text-shadow:
                0 0 12px ${InventoryData.getRarityColor(item.rarity)}80,
                0 2px 8px rgba(0, 0, 0, 0.5),
                0 4px 16px ${InventoryData.getRarityColor(item.rarity)}40;
            filter: drop-shadow(0 0 4px ${InventoryData.getRarityColor(item.rarity)}60);
            z-index: 2;
            position: relative;
        `;
        emojiIcon.textContent = getItemEmoji(item);
        iconPlaceholder.appendChild(emojiIcon);
    }

    card.appendChild(iconPlaceholder);

    // Item name
    const name = document.createElement('div');
    name.style.cssText = `
        font-weight: bold;
        color: ${InventoryData.getRarityColor(item.rarity)};
        margin-bottom: 8px;
        text-align: center;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    name.textContent = item.name;
    card.appendChild(name);

    // Level requirement
    const levelReq = document.createElement('div');
    levelReq.style.cssText = `
        color: ${meetsLevel ? 'var(--text-secondary)' : '#ef4444'};
        font-size: 0.85em;
        margin-bottom: 8px;
        text-align: center;
        font-weight: ${meetsLevel ? 'normal' : 'bold'};
    `;
    levelReq.textContent = `Level ${item.level} Required`;
    if (!meetsLevel) {
        levelReq.textContent += ` (You: ${player.level})`;
    }
    card.appendChild(levelReq);

    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = 'margin: 12px 0; font-size: 0.9em;';

    if (item.stats && item.stats.attack > 0) {
        const attackDiv = document.createElement('div');
        attackDiv.style.cssText = 'color: var(--text-secondary); margin-bottom: 4px;';
        attackDiv.innerHTML = `⚔️ ATK: <span style="color: var(--text-primary); font-weight: bold;">+${item.stats.attack}</span>`;
        stats.appendChild(attackDiv);
    }

    if (item.stats && item.stats.defense > 0) {
        const defenseDiv = document.createElement('div');
        defenseDiv.style.cssText = 'color: var(--text-secondary); margin-bottom: 4px;';
        defenseDiv.innerHTML = `🛡️ DEF: <span style="color: var(--text-primary); font-weight: bold;">+${item.stats.defense}</span>`;
        stats.appendChild(defenseDiv);
    }

    if (item.stats && item.stats.hp > 0) {
        const hpDiv = document.createElement('div');
        hpDiv.style.cssText = 'color: var(--text-secondary); margin-bottom: 4px;';
        hpDiv.innerHTML = `❤️ HP: <span style="color: var(--text-primary); font-weight: bold;">+${item.stats.hp}</span>`;
        stats.appendChild(hpDiv);
    }

    card.appendChild(stats);

    // Price
    const priceContainer = document.createElement('div');
    priceContainer.style.cssText = `
        background: ${canAfford ? 'var(--color-success)' : '#ef4444'}20;
        border: 2px solid ${canAfford ? 'var(--color-success)' : '#ef4444'};
        border-radius: 8px;
        padding: 8px;
        margin: 12px 0;
        text-align: center;
    `;

    const priceText = document.createElement('div');
    priceText.style.cssText = `
        color: ${canAfford ? 'var(--color-success)' : '#ef4444'};
        font-weight: bold;
        font-size: 1.1em;
    `;
    priceText.textContent = ShopData.formatPrice(item.price);
    priceContainer.appendChild(priceText);

    if (!canAfford) {
        const needText = document.createElement('div');
        needText.style.cssText = 'color: #ef4444; font-size: 0.8em; margin-top: 4px;';
        const needed = item.price - player.gold;
        needText.textContent = `Need ${ShopData.formatPrice(needed)} more`;
        priceContainer.appendChild(needText);
    }

    card.appendChild(priceContainer);

    // Buy button
    const buyBtn = createButton({
        text: canPurchase ? '💰 Buy Now' : (meetsLevel ? '🔒 Cannot Afford' : '🔒 Level Locked'),
        variant: canPurchase ? 'success' : 'secondary',
        onClick: () => {
            if (canPurchase) {
                if (ShopData.purchaseItem(item.id)) {
                    // Refresh the current tab without scrolling
                    renderItems(currentTab);
                }
            }
        }
    });
    buyBtn.disabled = !canPurchase;
    buyBtn.style.width = '100%';
    buyBtn.style.marginTop = '8px';
    card.appendChild(buyBtn);

    // Description (if available)
    if (item.description) {
        const desc = document.createElement('div');
        desc.style.cssText = `
            color: var(--text-secondary);
            font-size: 0.85em;
            margin-top: 12px;
            font-style: italic;
            text-align: center;
            padding-top: 12px;
            border-top: 1px solid var(--border-primary);
        `;
        desc.textContent = `"${item.description}"`;
        card.appendChild(desc);
    }

    return card;
}

/**
 * Get category-specific visual styling for item cards
 * @param {string} type - Item type (WEAPON, EGG, ARMOR, etc.)
 * @param {string} rarity - Item rarity
 */
function getCategoryStyle(type, rarity) {
    const rarityColor = InventoryData.getRarityColor(rarity);

    const styles = {
        'EGG': {
            className: 'egg-icon',
            background: `
                radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.3), transparent 50%),
                radial-gradient(circle at center, ${rarityColor}40, ${rarityColor}15)
            `,
            shadow: `
                0 4px 16px ${rarityColor}60,
                inset 0 2px 8px rgba(255, 255, 255, 0.2)
            `,
            borderColor: `${rarityColor}80`,
            hasEffect: true,
            effectClass: 'egg-sparkle',
            effectStyle: `
                background:
                    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                    radial-gradient(circle at 80% 60%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                    radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
                background-size: 100% 100%;
                animation: sparkleFloat 3s ease-in-out infinite;
            `
        },
        'ARMOR': {
            className: 'armor-icon',
            background: `
                linear-gradient(135deg,
                    ${rarityColor}30 0%,
                    ${rarityColor}10 50%,
                    rgba(139, 139, 139, 0.15) 100%
                )
            `,
            shadow: `
                0 4px 12px ${rarityColor}40,
                inset -2px -2px 8px rgba(0, 0, 0, 0.3),
                inset 2px 2px 8px rgba(255, 255, 255, 0.1)
            `,
            borderColor: `${rarityColor}60`,
            hasEffect: true,
            effectClass: 'armor-shine',
            effectStyle: `
                background: linear-gradient(
                    110deg,
                    transparent 30%,
                    rgba(255, 255, 255, 0.3) 50%,
                    transparent 70%
                );
                background-size: 200% 100%;
                animation: armorShine 2.5s ease-in-out infinite;
            `
        },
        'HELMET': {
            className: 'helmet-icon',
            background: `
                linear-gradient(180deg,
                    ${rarityColor}35 0%,
                    ${rarityColor}15 50%,
                    ${rarityColor}25 100%
                )
            `,
            shadow: `0 4px 12px ${rarityColor}50, inset 0 2px 4px rgba(255, 255, 255, 0.15)`,
            borderColor: `${rarityColor}70`,
            hasEffect: true,
            effectClass: 'helmet-gleam',
            effectStyle: `
                background: radial-gradient(
                    circle at 50% 30%,
                    rgba(255, 255, 255, 0.2) 0%,
                    transparent 60%
                );
                animation: gleamPulse 2s ease-in-out infinite;
            `
        },
        'BOOTS': {
            className: 'boots-icon',
            background: `linear-gradient(135deg, ${rarityColor}25, ${rarityColor}08)`,
            shadow: `0 6px 16px ${rarityColor}40, 0 2px 8px rgba(0, 0, 0, 0.3)`,
            borderColor: `${rarityColor}50`,
            hasEffect: false
        },
        'GLOVES': {
            className: 'gloves-icon',
            background: `
                linear-gradient(225deg,
                    ${rarityColor}30 0%,
                    ${rarityColor}10 100%
                )
            `,
            shadow: `0 4px 12px ${rarityColor}40`,
            borderColor: `${rarityColor}60`,
            hasEffect: true,
            effectClass: 'gloves-aura',
            effectStyle: `
                background: radial-gradient(
                    circle at center,
                    ${rarityColor}20 0%,
                    transparent 70%
                );
                animation: auraPulse 2.5s ease-in-out infinite;
            `
        },
        'RING': {
            className: 'ring-icon',
            background: `
                radial-gradient(circle at center,
                    rgba(255, 215, 0, 0.2),
                    ${rarityColor}15
                )
            `,
            shadow: `
                0 2px 8px ${rarityColor}60,
                0 0 20px rgba(255, 215, 0, 0.3),
                inset 0 1px 2px rgba(255, 255, 255, 0.3)
            `,
            borderColor: `rgba(255, 215, 0, 0.6)`,
            hasEffect: true,
            effectClass: 'ring-shimmer',
            effectStyle: `
                background: conic-gradient(
                    from 0deg at 50% 50%,
                    transparent 0deg,
                    rgba(255, 255, 255, 0.3) 60deg,
                    transparent 120deg,
                    rgba(255, 255, 255, 0.2) 180deg,
                    transparent 240deg,
                    rgba(255, 255, 255, 0.3) 300deg,
                    transparent 360deg
                );
                animation: ringRotate 4s linear infinite;
            `
        },
        'RING2': {
            className: 'ring-icon',
            background: `
                radial-gradient(circle at center,
                    rgba(255, 215, 0, 0.2),
                    ${rarityColor}15
                )
            `,
            shadow: `
                0 2px 8px ${rarityColor}60,
                0 0 20px rgba(255, 215, 0, 0.3),
                inset 0 1px 2px rgba(255, 255, 255, 0.3)
            `,
            borderColor: `rgba(255, 215, 0, 0.6)`,
            hasEffect: true,
            effectClass: 'ring-shimmer',
            effectStyle: `
                background: conic-gradient(
                    from 0deg at 50% 50%,
                    transparent 0deg,
                    rgba(255, 255, 255, 0.3) 60deg,
                    transparent 120deg,
                    rgba(255, 255, 255, 0.2) 180deg,
                    transparent 240deg,
                    rgba(255, 255, 255, 0.3) 300deg,
                    transparent 360deg
                );
                animation: ringRotate 4s linear infinite;
            `
        },
        'AMULET': {
            className: 'amulet-icon',
            background: `
                radial-gradient(ellipse at center,
                    ${rarityColor}40 0%,
                    ${rarityColor}15 60%,
                    transparent 100%
                )
            `,
            shadow: `
                0 4px 16px ${rarityColor}70,
                0 0 24px ${rarityColor}40,
                inset 0 2px 8px rgba(255, 255, 255, 0.2)
            `,
            borderColor: `${rarityColor}80`,
            hasEffect: true,
            effectClass: 'amulet-glow',
            effectStyle: `
                background: radial-gradient(
                    circle at center,
                    ${rarityColor}30 0%,
                    transparent 60%
                );
                animation: amuletGlow 2s ease-in-out infinite alternate;
            `
        },
        'FOOD': {
            className: 'food-icon',
            background: `
                linear-gradient(135deg,
                    rgba(139, 69, 19, 0.3) 0%,
                    rgba(205, 133, 63, 0.2) 50%,
                    ${rarityColor}15 100%
                )
            `,
            shadow: `0 4px 12px rgba(139, 69, 19, 0.4)`,
            borderColor: `rgba(205, 133, 63, 0.6)`,
            hasEffect: true,
            effectClass: 'food-steam',
            effectStyle: `
                background:
                    radial-gradient(ellipse at 50% 90%, rgba(255, 255, 255, 0.2) 0%, transparent 40%),
                    radial-gradient(ellipse at 30% 85%, rgba(255, 255, 255, 0.15) 0%, transparent 35%),
                    radial-gradient(ellipse at 70% 88%, rgba(255, 255, 255, 0.18) 0%, transparent 38%);
                animation: steamRise 3s ease-in-out infinite;
            `
        },
        'WEAPON': {
            className: 'weapon-icon',
            background: `linear-gradient(135deg, ${rarityColor}30, ${rarityColor}10)`,
            shadow: `0 4px 12px ${rarityColor}50`,
            borderColor: `${rarityColor}60`,
            hasEffect: false
        }
    };

    return styles[type] || {
        className: 'default-icon',
        background: `linear-gradient(135deg, ${rarityColor}30, ${rarityColor}10)`,
        shadow: `0 4px 12px ${rarityColor}40`,
        borderColor: `${rarityColor}50`,
        hasEffect: false
    };
}

/**
 * Get emoji for any item type (equipment, eggs, food, etc.)
 * @param {object} item - Shop item
 */
function getItemEmoji(item) {
    // Handle eggs - show actual egg emoji for all rarities
    if (item.type === 'EGG') {
        return '🥚';  // Use egg emoji for all eggs
    }

    // Handle food - show meat/food emoji
    if (item.type === 'FOOD') {
        const foodEmojis = {
            'LEGENDARY': '🍖',  // Meat on bone
            'RARE': '🥩',       // Cut of meat
            'UNCOMMON': '🦴',   // Bone
            'COMMON': '🍞'      // Bread
        };
        return foodEmojis[item.rarity] || '🍖';
    }

    // Handle equipment
    const emojis = {
        WEAPON: '⚔️',
        HELMET: '🪖',
        ARMOR: '🛡️',
        BOOTS: '👢',
        GLOVES: '🧤',
        RING: '💍',
        RING2: '💍',
        AMULET: '📿'
    };
    return emojis[item.type] || '📦';
}
