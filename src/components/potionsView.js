/**
 * Potions View Component
 * Quick access to use potions from inventory
 */

async function createPotionsView() {
    const container = document.createElement('div');
    container.appendChild(createBackButton());
    container.appendChild(createSectionHeader('🧪', 'Potions'));

    // Loading state
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = 'Loading potions...';
    loadingMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
    container.appendChild(loadingMsg);

    try {
        // Fetch inventory
        const inventory = await InventoryData.getInventory();
        container.removeChild(loadingMsg);

        // Filter potions
        const potions = inventory.items.filter(item => item.item_type === 'consumable');

        if (potions.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'text-align: center; padding: 40px;';
            emptyMsg.innerHTML = `
                <div style="font-size: 3em; margin-bottom: 16px;">🧪</div>
                <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No Potions</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Purchase potions from the shop to get started!</p>
            `;
            const shopBtn = createButton({
                text: '🛒 Go to Shop',
                variant: 'primary',
                onClick: () => router.navigate('shop')
            });
            emptyMsg.appendChild(shopBtn);
            container.appendChild(emptyMsg);
            return container;
        }

        // Potions grid
        const potionsGrid = document.createElement('div');
        potionsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;';

        potions.forEach(potion => {
            const card = createPotionCard(potion);
            potionsGrid.appendChild(card);
        });

        container.appendChild(potionsGrid);

    } catch (error) {
        container.removeChild(loadingMsg);
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--color-danger);';
        errorMsg.textContent = `Error loading potions: ${error.message}`;
        container.appendChild(errorMsg);
    }

    return container;
}

function createPotionCard(potion) {
    const properties = potion.properties || {};
    const potionType = properties.potion_type;
    const effectValue = properties.effect_value || 0;
    const duration = properties.duration;

    // Determine card styling based on rarity
    const rarityColors = {
        common: '#9ca3af',
        uncommon: '#10b981',
        rare: '#3b82f6',
        epic: '#a855f7',
        legendary: '#f59e0b'
    };
    const rarityColor = rarityColors[potion.rarity] || rarityColors.common;

    const card = document.createElement('div');
    card.style.cssText = `
        background: var(--bg-secondary);
        border: 2px solid ${rarityColor}40;
        border-radius: var(--radius-lg);
        padding: 20px;
        box-shadow: 0 4px 12px ${rarityColor}20;
        transition: transform 0.2s, box-shadow 0.2s;
    `;

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = `0 6px 16px ${rarityColor}30`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = `0 4px 12px ${rarityColor}20`;
    });

    // Potion header with icon and name
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 16px;';

    const icon = document.createElement('div');
    icon.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: var(--radius-md);
        background: linear-gradient(135deg, ${rarityColor}40, ${rarityColor}10);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2em;
        border: 2px solid ${rarityColor}60;
    `;
    icon.textContent = '🧪';
    header.appendChild(icon);

    const nameSection = document.createElement('div');
    nameSection.style.flex = '1';

    const name = document.createElement('div');
    name.style.cssText = 'font-weight: bold; font-size: 1.1em; color: var(--text-primary); margin-bottom: 4px;';
    name.textContent = potion.name;
    nameSection.appendChild(name);

    const rarity = document.createElement('div');
    rarity.style.cssText = `color: ${rarityColor}; font-size: 0.85em; text-transform: uppercase; font-weight: 600;`;
    rarity.textContent = potion.rarity;
    nameSection.appendChild(rarity);

    const quantity = document.createElement('div');
    quantity.style.cssText = 'font-size: 0.9em; color: var(--text-secondary); margin-top: 4px;';
    quantity.innerHTML = `Quantity: <span style="color: var(--text-primary); font-weight: bold;">${potion.quantity}</span>`;
    nameSection.appendChild(quantity);

    header.appendChild(nameSection);
    card.appendChild(header);

    // Effects section
    const effectsSection = document.createElement('div');
    effectsSection.style.cssText = 'margin-bottom: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md);';

    if (potionType === 'STAMINA_RESTORE') {
        const restoreText = effectValue >= 9999 ? 'Full Stamina' : `${effectValue} Stamina`;
        effectsSection.innerHTML = `
            <div style="color: var(--text-secondary); margin-bottom: 4px;">⚡ Restores:</div>
            <div style="color: #3b82f6; font-weight: bold; font-size: 1.1em;">${restoreText}</div>
        `;
    } else if (potionType === 'STAMINA_BOOST') {
        effectsSection.innerHTML = `
            <div style="color: var(--text-secondary); margin-bottom: 4px;">⚡ Boosts Max Stamina to:</div>
            <div style="color: #3b82f6; font-weight: bold; font-size: 1.1em;">${effectValue}</div>
            <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 4px;">⏱️ Duration: ${duration / 60} minutes</div>
        `;
    } else if (potionType === 'ATTACK_BOOST') {
        effectsSection.innerHTML = `
            <div style="color: var(--text-secondary); margin-bottom: 4px;">⚔️ Attack Multiplier:</div>
            <div style="color: #ef4444; font-weight: bold; font-size: 1.1em;">${effectValue}x</div>
            <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 4px;">⏱️ Duration: ${duration / 60} minutes</div>
        `;
    }

    card.appendChild(effectsSection);

    // Description
    if (properties.description) {
        const description = document.createElement('div');
        description.style.cssText = 'font-size: 0.9em; color: var(--text-secondary); margin-bottom: 16px; font-style: italic;';
        description.textContent = properties.description;
        card.appendChild(description);
    }

    // Use button
    const useBtn = createButton({
        text: '✨ Use Potion',
        variant: 'success',
        onClick: async () => {
            useBtn.disabled = true;
            useBtn.textContent = 'Using...';

            try {
                const result = await apiClient.usePotion(potion.id);
                NotificationSystem.show(result.message, 'success');

                // Refresh player data from API
                await PlayerData.syncFromAPI();
                PlayerData.updateUI();

                // Refresh the view to update quantity
                setTimeout(() => {
                    router.navigate('potions');
                }, 1000);

            } catch (error) {
                NotificationSystem.show(error.message, 'error');
                useBtn.disabled = false;
                useBtn.textContent = '✨ Use Potion';
            }
        }
    });

    card.appendChild(useBtn);

    return card;
}

// Make it globally available
window.createPotionsView = createPotionsView;
