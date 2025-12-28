/**
 * Inventory View Component
 * Renders the full inventory interface with tabs and equipment
 */

async function createInventoryView() {
    const container = document.createElement('div');
    container.appendChild(createBackButton());
    container.appendChild(createSectionHeader('🎒', 'Inventory'));

    // Ensure shop catalog is loaded for icon enrichment
    if (window.ShopData && !ShopData._cache.length) {
        await ShopData.getShopCatalog();
    }

    // Debug: Log shop catalog state
    if (window.DEV_MODE) {
        console.log('=== Shop Catalog Status at Inventory Load ===');
        console.log('ShopData exists:', !!window.ShopData);
        console.log('Cache length:', window.ShopData?._cache?.length);
        console.log('Cache is array:', Array.isArray(window.ShopData?._cache));
        if (window.ShopData?._cache?.length > 0) {
            console.log('First 3 items:', window.ShopData._cache.slice(0, 3).map(item => ({
                name: item.name,
                type: item.type,
                icon: item.icon
            })));
            // Find weapons specifically
            const weapons = window.ShopData._cache.filter(item => item.type?.toUpperCase() === 'WEAPON');
            console.log(`Found ${weapons.length} weapons in shop catalog`);
            if (weapons.length > 0) {
                console.log('First weapon:', {
                    name: weapons[0].name,
                    type: weapons[0].type,
                    icon: weapons[0].icon
                });
            }
        } else {
            console.warn('⚠️ Shop catalog is empty or not loaded!');
        }
    }

    // Track current tab
    let currentTab = 'attack';

    // Tab buttons
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px; justify-content: center;';

    const attackTab = createButton({
        text: '⚔️ Attack Set',
        variant: 'primary',
        className: 'tab-active',
        onClick: () => switchTab('attack')
    });

    const defenseTab = createButton({
        text: '🛡️ Defense Set',
        variant: 'secondary',
        onClick: () => switchTab('defense')
    });

    tabContainer.appendChild(attackTab);
    tabContainer.appendChild(defenseTab);
    container.appendChild(tabContainer);

    // Current tab content
    const contentArea = document.createElement('div');
    contentArea.id = 'inventory-content';
    container.appendChild(contentArea);

    // Switch tab function
    function switchTab(tab) {
        currentTab = tab;
        attackTab.className = tab === 'attack' ? 'btn btn-primary tab-active' : 'btn btn-secondary';
        defenseTab.className = tab === 'defense' ? 'btn btn-primary tab-active' : 'btn btn-secondary';
        renderTabContent(tab);
    }

    // Render tab content
    function renderTabContent(tab) {
        contentArea.innerHTML = '';

        // Equipped Items Section
        const equippedSection = document.createElement('div');
        equippedSection.style.marginBottom = '40px';

        const equippedHeader = document.createElement('h2');
        equippedHeader.style.cssText = 'color: var(--text-primary); margin-bottom: 16px; font-size: 1.25em; text-align: center;';
        equippedHeader.textContent = `⚔️ Equipped Items — ${tab === 'attack' ? 'Attack' : 'Defense'} Set`;

        equippedSection.appendChild(equippedHeader);

        // Create flex container for paperdoll and stats panel
        const paperdollWrapper = document.createElement('div');
        paperdollWrapper.style.cssText = `
            display: flex;
            gap: 24px;
            justify-content: center;
            align-items: flex-start;
            max-width: 1400px;
            margin: 0 auto;
        `;

        // Equipped items grid
        const equippedGrid = renderEquippedItems(tab);
        paperdollWrapper.appendChild(equippedGrid);

        // Stats panel
        const statsPanel = createStatsPanel(tab);
        paperdollWrapper.appendChild(statsPanel);

        equippedSection.appendChild(paperdollWrapper);
        contentArea.appendChild(equippedSection);

        // Equipment Section (unequipped items)
        const equipmentSection = document.createElement('div');

        const equipmentHeader = document.createElement('h2');
        equipmentHeader.style.cssText = 'color: var(--text-primary); margin-bottom: 16px; font-size: 1.25em;';
        equipmentHeader.textContent = '⚙️ Equipment';

        equipmentSection.appendChild(equipmentHeader);

        // Equipment items grid
        const equipmentGrid = renderEquipment();
        equipmentSection.appendChild(equipmentGrid);

        contentArea.appendChild(equipmentSection);
    }

    // Render equipped items - MMORPG Paper Doll Style
    function renderEquippedItems(setType) {
        const equipped = InventoryData.getEquipped(setType);

        // Create main container with CSS Grid
        const paperdollContainer = document.createElement('div');
        paperdollContainer.className = 'paperdoll-container';
        paperdollContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(5, auto);
            gap: 12px;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background:
                linear-gradient(rgba(13, 10, 15, 0.3), rgba(13, 10, 15, 0.4)),
                url('/assets/background/hero_arsenal.png') center center / cover no-repeat;
            border: 3px solid var(--gold);
            border-radius: var(--radius-ornate);
            position: relative;
            box-shadow:
                0 0 30px rgba(212, 175, 55, 0.3),
                inset 0 0 50px rgba(0, 0, 0, 0.5);
        `;

        // No character silhouette needed - the background image has one
        // Just add a subtle overlay to ensure slot visibility

        // Equipment slots with grid positions
        const slots = [
            { slot: EquipmentSlot.HELMET, label: 'Helmet', gridColumn: '4', gridRow: '1' },
            { slot: EquipmentSlot.AMULET, label: 'Amulet', gridColumn: '4', gridRow: '2' },
            { slot: EquipmentSlot.WEAPON, label: 'Weapon', gridColumn: '1 / 3', gridRow: '3' },
            { slot: EquipmentSlot.ARMOR, label: 'Armor', gridColumn: '4', gridRow: '3' },
            { slot: EquipmentSlot.GLOVES, label: 'Gloves', gridColumn: '6 / 8', gridRow: '2' },
            { slot: EquipmentSlot.RING, label: 'Ring', gridColumn: '1 / 3', gridRow: '4' },
            { slot: EquipmentSlot.RING2, label: 'Ring 2', gridColumn: '6 / 8', gridRow: '4' },
            { slot: EquipmentSlot.BOOTS, label: 'Boots', gridColumn: '4', gridRow: '5' }
        ];

        slots.forEach(({ slot, label, gridColumn, gridRow }) => {
            const item = equipped[slot];
            const slotCard = item
                ? createPaperdollItemCard(item, true, setType, renderTabContent, currentTab, slot)
                : createPaperdollEmptySlot(label, slot);

            slotCard.style.gridColumn = gridColumn;
            slotCard.style.gridRow = gridRow;
            slotCard.style.zIndex = '1';

            paperdollContainer.appendChild(slotCard);
        });

        return paperdollContainer;
    }

    // Create stats panel with visual impact
    function createStatsPanel(setType) {
        const stats = InventoryData.getEquippedStats(setType);

        const panel = document.createElement('div');
        panel.className = 'stats-panel';
        panel.style.cssText = `
            min-width: 320px;
            max-width: 360px;
            background:
                linear-gradient(135deg, rgba(20, 15, 30, 0.95) 0%, rgba(35, 25, 45, 0.95) 100%);
            border: 3px solid var(--gold);
            border-radius: var(--radius-ornate);
            padding: 32px 24px;
            box-shadow:
                0 8px 32px rgba(0, 0, 0, 0.6),
                0 0 40px rgba(212, 175, 55, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        `;

        // Decorative corner accents
        const cornerTL = document.createElement('div');
        cornerTL.style.cssText = `
            position: absolute;
            top: -1px;
            left: -1px;
            width: 40px;
            height: 40px;
            border-top: 4px solid rgba(212, 175, 55, 0.6);
            border-left: 4px solid rgba(212, 175, 55, 0.6);
            border-radius: 12px 0 0 0;
        `;
        panel.appendChild(cornerTL);

        const cornerBR = document.createElement('div');
        cornerBR.style.cssText = `
            position: absolute;
            bottom: -1px;
            right: -1px;
            width: 40px;
            height: 40px;
            border-bottom: 4px solid rgba(212, 175, 55, 0.6);
            border-right: 4px solid rgba(212, 175, 55, 0.6);
            border-radius: 0 0 12px 0;
        `;
        panel.appendChild(cornerBR);

        // Panel header
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 28px;
            position: relative;
        `;

        const title = document.createElement('h3');
        title.style.cssText = `
            font-size: 1.5em;
            font-weight: 700;
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0 0 8px 0;
            text-shadow: 0 2px 8px rgba(212, 175, 55, 0.5);
        `;
        title.textContent = 'Equipment Stats';

        const subtitle = document.createElement('div');
        subtitle.style.cssText = `
            font-size: 0.9em;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        subtitle.textContent = `${setType} Set Bonuses`;

        header.appendChild(title);
        header.appendChild(subtitle);
        panel.appendChild(header);

        // Divider line
        const divider = document.createElement('div');
        divider.style.cssText = `
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            margin-bottom: 24px;
            opacity: 0.4;
        `;
        panel.appendChild(divider);

        // Stats list
        const statsList = document.createElement('div');
        statsList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
        `;

        // Create individual stat items
        const statItems = [
            {
                label: 'Attack Power',
                value: stats.attack,
                icon: 'attack',
                color: '#ef4444',
                gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
            },
            {
                label: 'Defense',
                value: stats.defense,
                icon: 'defense',
                color: '#3b82f6',
                gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
            },
            {
                label: 'Hit Points',
                value: stats.hp,
                icon: 'gems',
                color: '#22c55e',
                gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
            }
        ];

        statItems.forEach(({ label, value, icon, color, gradient }) => {
            const statItem = document.createElement('div');
            statItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 16px;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 16px;
                transition: all 0.3s ease;
                cursor: default;
            `;

            // Hover effect
            statItem.addEventListener('mouseenter', () => {
                statItem.style.background = 'rgba(0, 0, 0, 0.5)';
                statItem.style.borderColor = color;
                statItem.style.transform = 'translateX(4px)';
                statItem.style.boxShadow = `0 4px 16px ${color}40`;
            });

            statItem.addEventListener('mouseleave', () => {
                statItem.style.background = 'rgba(0, 0, 0, 0.3)';
                statItem.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                statItem.style.transform = 'translateX(0)';
                statItem.style.boxShadow = 'none';
            });

            // Icon container
            const iconContainer = document.createElement('div');
            iconContainer.style.cssText = `
                width: 56px;
                height: 56px;
                border-radius: 10px;
                background: ${gradient};
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow:
                    0 4px 12px ${color}40,
                    inset 0 2px 4px rgba(255, 255, 255, 0.2);
            `;

            if (window.ColoredThemeIcons) {
                iconContainer.innerHTML = ColoredThemeIcons.render(icon, '', '2em');
                // Override icon color to white
                const svgElement = iconContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.querySelectorAll('[fill]:not([fill="none"])').forEach(el => {
                        el.setAttribute('fill', '#ffffff');
                    });
                }
            }

            // Stat info
            const statInfo = document.createElement('div');
            statInfo.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            `;

            const statLabel = document.createElement('div');
            statLabel.style.cssText = `
                font-size: 0.85em;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
            `;
            statLabel.textContent = label;

            const statValue = document.createElement('div');
            statValue.style.cssText = `
                font-size: 1.8em;
                font-weight: 700;
                color: ${color};
                line-height: 1;
                text-shadow: 0 2px 8px ${color}60;
            `;
            statValue.textContent = value > 0 ? `+${value}` : value;

            statInfo.appendChild(statLabel);
            statInfo.appendChild(statValue);

            statItem.appendChild(iconContainer);
            statItem.appendChild(statInfo);

            statsList.appendChild(statItem);
        });

        panel.appendChild(statsList);

        // Total power indicator at bottom
        const totalPower = stats.attack + stats.defense + stats.hp;

        const totalSection = document.createElement('div');
        totalSection.style.cssText = `
            margin-top: 28px;
            padding-top: 20px;
            border-top: 2px solid rgba(212, 175, 55, 0.3);
            text-align: center;
        `;

        const totalLabel = document.createElement('div');
        totalLabel.style.cssText = `
            font-size: 0.85em;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        `;
        totalLabel.textContent = 'Total Equipment Power';

        const totalValue = document.createElement('div');
        totalValue.style.cssText = `
            font-size: 2.5em;
            font-weight: 800;
            background: linear-gradient(135deg, var(--gold) 0%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
            line-height: 1;
        `;
        totalValue.textContent = totalPower > 0 ? `+${totalPower}` : totalPower;

        totalSection.appendChild(totalLabel);
        totalSection.appendChild(totalValue);
        panel.appendChild(totalSection);

        return panel;
    }

    // Render equipment (unequipped items)
    function renderEquipment() {
        const items = InventoryData.getUnequippedItems();
        const grid = createGrid(4, []);

        if (items.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
            emptyMsg.textContent = 'No items in inventory. Use DevHelpers.giveItems() to add sample items!';
            return emptyMsg;
        }

        items.forEach(item => {
            const itemCard = createItemCard(item, false, currentTab, renderTabContent, currentTab);
            grid.appendChild(itemCard);
        });

        return grid;
    }

    // Initial render
    switchTab('attack');

    return container;
}

// Create item card
function createItemCard(item, equipped, setType = 'attack', renderTabContent, currentTab) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = `
        border: 2px solid ${InventoryData.getRarityColor(item.rarity)};
        background: linear-gradient(135deg, ${InventoryData.getRarityColor(item.rarity)}15, ${InventoryData.getRarityColor(item.rarity)}05);
        position: relative;
    `;

    // Rarity badge
    const rarityBadge = document.createElement('div');
    rarityBadge.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        background: ${InventoryData.getRarityColor(item.rarity)};
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.7em;
        font-weight: bold;
        letter-spacing: 0.5px;
    `;
    rarityBadge.textContent = InventoryData.getRarityLabel(item.rarity);
    card.appendChild(rarityBadge);

    // Get category-specific styling
    const categoryStyle = getCategoryStyle(item.type, item.rarity);

    // Item image placeholder - use weapon PNG icons or themed icons
    const imagePlaceholder = document.createElement('div');
    const legendaryClass = item.rarity === 'LEGENDARY' || item.rarity === 'legendary' ? 'legendary-particles' : '';
    imagePlaceholder.className = `inventory-item-icon ${categoryStyle.className} ${legendaryClass}`;
    imagePlaceholder.style.cssText = `
        width: 100%;
        height: 150px;
        background: ${categoryStyle.background};
        border-radius: 8px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4em;
        position: relative;
        box-shadow: ${categoryStyle.shadow};
        border: 2px solid ${categoryStyle.borderColor};
        overflow: visible;
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
            border-radius: 6px;
            ${categoryStyle.effectStyle}
        `;
        imagePlaceholder.appendChild(effectLayer);
    }

    // Use PNG icons for weapons if available (check both uppercase and lowercase)
    const itemType = (item.type || '').toUpperCase();

    // Debug logging
    if (window.DEV_MODE && itemType === 'WEAPON') {
        console.log('Weapon item:', {name: item.name, icon: item.icon, type: item.type, hasIcon: !!item.icon});
    }

    if (item.icon && itemType === 'WEAPON') {
        const iconImg = document.createElement('img');
        iconImg.src = `assets/icons/weapons/${item.icon}`;
        iconImg.alt = item.name;
        iconImg.style.cssText = `
            max-width: 80%;
            max-height: 80%;
            object-fit: contain;
            filter: drop-shadow(0 0 8px ${InventoryData.getRarityColor(item.rarity)}60);
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            position: relative;
            z-index: 2;
        `;

        iconImg.onload = function() {
            iconImg.style.opacity = '1';
            if (window.DEV_MODE) console.log('✓ Icon loaded:', item.icon);
        };

        iconImg.onerror = function() {
            if (window.DEV_MODE) console.error('✗ Failed to load icon:', item.icon, 'for', item.name);
            // Fallback to themed icon
            if (iconImg.parentNode) {
                imagePlaceholder.removeChild(iconImg);
            }
            const iconName = getThemeIconForSlot(item.type);
            if (iconName && window.ColoredThemeIcons) {
                imagePlaceholder.innerHTML = ColoredThemeIcons.render(iconName, '', '4em');
            } else {
                imagePlaceholder.textContent = getItemEmoji(item.type);
            }
        };

        imagePlaceholder.appendChild(iconImg);
    } else {
        // Use themed icons for non-weapons
        const iconName = getThemeIconForSlot(item.type);
        if (iconName && window.ColoredThemeIcons) {
            imagePlaceholder.innerHTML = ColoredThemeIcons.render(iconName, '', '4em');
        } else {
            imagePlaceholder.textContent = getItemEmoji(item.type);
        }
    }
    card.appendChild(imagePlaceholder);

    // Item name
    const name = document.createElement('div');
    name.style.cssText = 'font-weight: bold; color: var(--text-primary); margin-bottom: 8px; text-align: center;';
    name.textContent = item.name;
    card.appendChild(name);

    // Item type and level
    const typeLevel = document.createElement('div');
    typeLevel.style.cssText = 'color: var(--text-secondary); font-size: 0.85em; text-align: center; margin-bottom: 8px;';
    typeLevel.textContent = `${item.type} • Lv ${item.level}`;
    card.appendChild(typeLevel);

    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = 'margin: 12px 0; font-size: 0.9em;';

    if (item.stats && item.stats.attack > 0) {
        const attackStat = document.createElement('div');
        attackStat.style.cssText = 'color: #ef4444; margin-bottom: 4px;';
        attackStat.innerHTML = `⚔️ ${item.stats.attack} ATK`;
        stats.appendChild(attackStat);
    }

    if (item.stats && item.stats.defense > 0) {
        const defenseStat = document.createElement('div');
        defenseStat.style.cssText = 'color: #3b82f6; margin-bottom: 4px;';
        defenseStat.innerHTML = `🛡️ ${item.stats.defense} DEF`;
        stats.appendChild(defenseStat);
    }

    if (item.stats && item.stats.hp > 0) {
        const hpStat = document.createElement('div');
        hpStat.style.cssText = 'color: #22c55e;';
        hpStat.innerHTML = `❤️ ${item.stats.hp} HP`;
        stats.appendChild(hpStat);
    }

    card.appendChild(stats);

    // Button
    const button = createButton({
        text: equipped ? 'Unequip' : 'Equip',
        variant: equipped ? 'secondary' : 'success',
        onClick: async () => {
            // Disable button during operation
            button.disabled = true;
            button.textContent = 'Loading...';

            try {
                if (equipped) {
                    await InventoryData.unequip(item.type, setType);
                } else {
                    await InventoryData.equip(item.id, setType);
                }
                // Refresh the current tab after API completes
                renderTabContent(currentTab);
            } catch (error) {
                console.error('Equipment action failed:', error);
                button.disabled = false;
                button.textContent = equipped ? 'Unequip' : 'Equip';
            }
        }
    });
    button.style.width = '100%';
    card.appendChild(button);

    return card;
}

// Create empty slot card (for unequipped items grid)
function createEmptySlotCard(slotName) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'border: 2px dashed var(--border-primary); opacity: 0.6;';

    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
        width: 100%;
        height: 150px;
        background: var(--bg-secondary);
        border-radius: 8px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3em;
        color: var(--text-secondary);
    `;
    placeholder.textContent = '?';
    card.appendChild(placeholder);

    const name = document.createElement('div');
    name.style.cssText = 'color: var(--text-secondary); text-align: center; font-style: italic;';
    name.textContent = `Empty ${slotName}`;
    card.appendChild(name);

    return card;
}

// Create paperdoll-style item card (compact version for equipment slots)
function createPaperdollItemCard(item, equipped, setType, renderTabContent, currentTab, slot) {
    const card = document.createElement('div');
    card.className = 'paperdoll-slot';
    card.style.cssText = `
        border: 2px solid ${InventoryData.getRarityColor(item.rarity)};
        background: linear-gradient(135deg, ${InventoryData.getRarityColor(item.rarity)}25, ${InventoryData.getRarityColor(item.rarity)}10);
        border-radius: var(--radius-lg);
        padding: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-smooth);
        position: relative;
        min-height: 100px;
    `;

    // Rarity badge - triangle in top-right corner (no text)
    const rarityBadge = document.createElement('div');
    rarityBadge.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 30px 30px 0;
        border-color: transparent ${InventoryData.getRarityColor(item.rarity)} transparent transparent;
    `;
    card.appendChild(rarityBadge);

    // Get category-specific styling
    const categoryStyle = getCategoryStyle(item.type, item.rarity);

    // Item icon - use weapon PNG icons for weapons, themed icons for others
    const icon = document.createElement('div');
    const legendaryClass = item.rarity === 'LEGENDARY' || item.rarity === 'legendary' ? 'legendary-particles' : '';
    icon.className = `paperdoll-item-icon ${categoryStyle.className} ${legendaryClass}`;
    icon.style.cssText = `
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        font-size: 2.5em;
        background: ${categoryStyle.background};
        border-radius: 6px;
        box-shadow: ${categoryStyle.shadow};
        border: 1px solid ${categoryStyle.borderColor};
        overflow: visible;
    `;

    // Add animated background effects for special item types
    if (categoryStyle.hasEffect) {
        const effectLayer = document.createElement('div');
        effectLayer.className = categoryStyle.effectClass;
        effectLayer.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            border-radius: 4px;
            ${categoryStyle.effectStyle}
        `;
        icon.appendChild(effectLayer);
    }

    // Use PNG icons for weapons if available (check both uppercase and lowercase)
    const itemType = (item.type || '').toUpperCase();

    // Debug logging for paperdoll
    if (window.DEV_MODE && itemType === 'WEAPON') {
        console.log('Paperdoll weapon:', {name: item.name, icon: item.icon, type: item.type, hasIcon: !!item.icon});
    }

    if (item.icon && itemType === 'WEAPON') {
        const iconImg = document.createElement('img');
        iconImg.src = `assets/icons/weapons/${item.icon}`;
        iconImg.alt = item.name;
        iconImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 0 6px ${InventoryData.getRarityColor(item.rarity)}60);
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            position: relative;
            z-index: 2;
        `;

        iconImg.onload = function() {
            iconImg.style.opacity = '1';
            if (window.DEV_MODE) console.log('✓ Paperdoll icon loaded:', item.icon);
        };

        iconImg.onerror = function() {
            if (window.DEV_MODE) console.error('✗ Failed to load paperdoll icon:', item.icon, 'for', item.name);
            // Fallback to themed icon
            if (iconImg.parentNode) {
                icon.removeChild(iconImg);
            }
            const iconName = getThemeIconForSlot(item.type);
            if (iconName && window.ColoredThemeIcons) {
                icon.innerHTML = ColoredThemeIcons.render(iconName, '', '2.5em');
            } else {
                icon.textContent = getItemEmoji(item.type);
                icon.style.filter = `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))`;
            }
        };

        icon.appendChild(iconImg);
    } else {
        // Use themed icons for non-weapons
        const iconName = getThemeIconForSlot(item.type);
        if (iconName && window.ColoredThemeIcons) {
            icon.innerHTML = ColoredThemeIcons.render(iconName, '', '2.5em');
        } else {
            icon.textContent = getItemEmoji(item.type);
            icon.style.filter = `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))`;
        }
    }
    card.appendChild(icon);

    // Item name
    const name = document.createElement('div');
    name.style.cssText = `
        font-size: 0.75em;
        font-weight: bold;
        color: var(--text-primary);
        text-align: center;
        line-height: 1.2;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    `;
    name.textContent = item.name;
    name.title = item.name; // Show full name on hover
    card.appendChild(name);

    // Stats summary
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
        display: flex;
        gap: 6px;
        font-size: 0.7em;
        flex-wrap: wrap;
        justify-content: center;
    `;

    if (item.stats && item.stats.attack > 0) {
        const atk = document.createElement('span');
        atk.style.color = '#ef4444';
        atk.textContent = `⚔️${item.stats.attack}`;
        statsContainer.appendChild(atk);
    }

    if (item.stats && item.stats.defense > 0) {
        const def = document.createElement('span');
        def.style.color = '#3b82f6';
        def.textContent = `🛡️${item.stats.defense}`;
        statsContainer.appendChild(def);
    }

    if (item.stats && item.stats.hp > 0) {
        const hp = document.createElement('span');
        hp.style.color = '#22c55e';
        hp.textContent = `❤️${item.stats.hp}`;
        statsContainer.appendChild(hp);
    }

    card.appendChild(statsContainer);

    // Hover effect
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-3px) scale(1.05)';
        card.style.boxShadow = `0 6px 20px ${InventoryData.getRarityColor(item.rarity)}60`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'none';
        card.style.boxShadow = 'none';
    });

    // Click to unequip
    card.addEventListener('click', async () => {
        await InventoryData.unequip(slot, setType);
        renderTabContent(currentTab);
    });

    return card;
}

// Create paperdoll-style empty slot
function createPaperdollEmptySlot(slotName, slot) {
    const card = document.createElement('div');
    card.className = 'paperdoll-slot-empty';
    card.style.cssText = `
        border: 2px dashed var(--border-subtle);
        background: rgba(13, 10, 15, 0.4);
        border-radius: var(--radius-lg);
        padding: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        opacity: 0.5;
        transition: all var(--duration-fast) var(--ease-smooth);
        min-height: 100px;
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
        font-size: 2em;
        color: var(--text-secondary);
        opacity: 0.5;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Use themed icons for empty slots too
    const iconName = getThemeIconForSlot(slot);
    if (iconName && window.ColoredThemeIcons) {
        icon.innerHTML = ColoredThemeIcons.render(iconName, '', '2em');
        icon.style.opacity = '0.3';
    } else {
        icon.textContent = getItemEmoji(slot);
    }
    card.appendChild(icon);

    const name = document.createElement('div');
    name.style.cssText = `
        font-size: 0.7em;
        color: var(--text-secondary);
        text-align: center;
        font-style: italic;
    `;
    name.textContent = slotName;
    card.appendChild(name);

    // Hover effect
    card.addEventListener('mouseenter', () => {
        card.style.opacity = '0.7';
        card.style.borderColor = 'var(--border-medium)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.opacity = '0.5';
        card.style.borderColor = 'var(--border-subtle)';
    });

    return card;
}

/**
 * Get category-specific visual styling for item cards
 * @param {string} type - Item type (WEAPON, EGG, ARMOR, etc.)
 * @param {string} rarity - Item rarity
 */
function getCategoryStyle(type, rarity) {
    const rarityColor = InventoryData.getRarityColor(rarity);
    const normalizedType = (type || '').toUpperCase();

    const styles = {
        'WEAPON': {
            className: 'weapon-icon',
            background: `linear-gradient(135deg, ${rarityColor}30, ${rarityColor}10)`,
            shadow: `0 4px 12px ${rarityColor}50`,
            borderColor: `${rarityColor}60`,
            hasEffect: false
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
        }
    };

    return styles[normalizedType] || {
        className: 'default-icon',
        background: `linear-gradient(135deg, ${rarityColor}30, ${rarityColor}10)`,
        shadow: `0 4px 12px ${rarityColor}40`,
        borderColor: `${rarityColor}50`,
        hasEffect: false
    };
}

// Get themed icon name for equipment slot
function getThemeIconForSlot(type) {
    const normalizedType = type.toLowerCase();

    const iconMap = {
        'weapon': 'attack',      // Crossed swords icon
        'helmet': 'defense',     // Shield icon (represents head protection)
        'armor': 'defense',      // Shield icon
        'boots': 'defense',      // Shield icon (represents leg protection)
        'gloves': 'attack',      // Crossed swords (represents hand weapons)
        'ring': 'gems',          // Gem/diamond icon (precious jewelry)
        'ring2': 'gems',         // Gem/diamond icon
        'amulet': 'gems'         // Gem/diamond icon (precious jewelry)
    };

    return iconMap[normalizedType] || null;
}

// Get emoji for item type (fallback)
function getItemEmoji(type) {
    // Normalize to lowercase for lookup
    const normalizedType = type.toLowerCase();

    const emojis = {
        [EquipmentSlot.WEAPON]: '⚔️',
        [EquipmentSlot.HELMET]: '🎩',
        [EquipmentSlot.ARMOR]: '🛡️',
        [EquipmentSlot.BOOTS]: '👢',
        [EquipmentSlot.GLOVES]: '🧤',
        [EquipmentSlot.RING]: '💍',
        [EquipmentSlot.RING2]: '💍',
        [EquipmentSlot.AMULET]: '📿'
    };
    return emojis[normalizedType] || '❓';
}
