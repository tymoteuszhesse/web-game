/**
 * Pets & Eggs View Component
 * Displays pet collection, eggs inventory, and equipment management
 */

async function createPetsView() {
    const container = document.createElement('div');
    container.appendChild(createBackButton());
    container.appendChild(createSectionHeader('🐉', 'Pets & Eggs'));

    // Get pet state - this is async
    const petState = await PetData.getPetState();

    // Main layout - two columns
    const mainLayout = document.createElement('div');
    mainLayout.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;';

    // Left column - Collection and Eggs
    const leftColumn = document.createElement('div');
    leftColumn.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

    // Eggs section
    const eggsSection = createEggsSection(petState.eggs);
    leftColumn.appendChild(eggsSection);

    // Pet Collection section
    const collectionSection = createPetsCollectionSection(petState.collection);
    leftColumn.appendChild(collectionSection);

    // Right column - Equipment Sets
    const rightColumn = document.createElement('div');
    rightColumn.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

    // Attack Set
    const attackSetSection = createPetSetSection('attack', petState.attackSet, petState.collection);
    rightColumn.appendChild(attackSetSection);

    // Defense Set
    const defenseSetSection = createPetSetSection('defense', petState.defenseSet, petState.collection);
    rightColumn.appendChild(defenseSetSection);

    mainLayout.appendChild(leftColumn);
    mainLayout.appendChild(rightColumn);
    container.appendChild(mainLayout);

    return container;
}

/**
 * Create eggs inventory section
 */
function createEggsSection(eggs) {
    const section = document.createElement('div');

    const header = document.createElement('h2');
    header.style.cssText = 'color: var(--text-gold); margin-bottom: 16px; font-size: 1.3em;';
    header.innerHTML = '🥚 Eggs Inventory';
    section.appendChild(header);

    if (eggs.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'card';
        emptyMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
        emptyMsg.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 12px;">🥚</div>
            <p>No eggs in inventory</p>
            <p style="font-size: 0.9em; margin-top: 8px;">Obtain eggs from battles and events!</p>
        `;
        section.appendChild(emptyMsg);
    } else {
        // Group eggs by petType (species) if they have one, otherwise by rarity type
        const eggsByType = {};
        eggs.forEach(egg => {
            // Use petType as the grouping key if available (e.g., "dragon", "wolf"), otherwise use rarity type
            const groupKey = egg.petType || egg.type;
            if (!eggsByType[groupKey]) {
                eggsByType[groupKey] = [];
            }
            eggsByType[groupKey].push(egg);
        });

        const eggsGrid = document.createElement('div');
        eggsGrid.className = 'grid grid-3';

        // Display each egg type
        Object.entries(eggsByType).forEach(([type, eggList]) => {
            const eggCard = createEggCard(type, eggList);
            eggsGrid.appendChild(eggCard);
        });

        section.appendChild(eggsGrid);
    }

    return section;
}

/**
 * Create a single egg card
 */
function createEggCard(eggType, eggList) {
    // Get the first egg to check if it has a specific pet type
    const firstEgg = eggList[0];
    const count = eggList.length;

    // Determine display info - show egg emoji with rarity-based coloring
    let displayInfo;
    if (firstEgg.petType) {
        // Specific egg - show colored egg based on species, hide the pet name until hatching
        const eggColors = {
            // Draconic - Purple/Dark
            dragon: { emoji: '🥚', name: 'Shadowed Egg', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
            wyvern: { emoji: '🥚', name: 'Crimson Egg', color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626, #991b1b)' },

            // Beasts - Blue/Green
            wolf: { emoji: '🥚', name: 'Frost Egg', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
            bear: { emoji: '🥚', name: 'Earthen Egg', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
            tiger: { emoji: '🥚', name: 'Infernal Egg', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
            lion: { emoji: '🥚', name: 'Golden Egg', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)' },

            // Mystical - Orange/Purple
            fox: { emoji: '🥚', name: 'Mystic Egg', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            raven: { emoji: '🥚', name: 'Darkened Egg', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #374151)' },
            owl: { emoji: '🥚', name: 'Moonlit Egg', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },

            // Reptilian - Green
            snake: { emoji: '🥚', name: 'Venomous Egg', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
            turtle: { emoji: '🥚', name: 'Ironshell Egg', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #15803d)' },

            // Mythical - Various
            spider: { emoji: '🥚', name: 'Void Egg', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
            scorpion: { emoji: '🥚', name: 'Scorched Egg', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
            unicorn: { emoji: '🥚', name: 'Cursed Egg', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' },
            cat: { emoji: '🥚', name: 'Shadow Egg', color: '#4b5563', gradient: 'linear-gradient(135deg, #4b5563, #1f2937)' }
        };
        displayInfo = eggColors[firstEgg.petType] || { emoji: '🥚', name: 'Ancient Egg', color: '#94a3b8', gradient: 'linear-gradient(135deg, #94a3b8, #64748b)' };
    } else {
        // Random egg - show by rarity type
        const typeInfo = {
            basic: { emoji: '🥚', name: 'Common Egg', color: '#94a3b8', gradient: 'linear-gradient(135deg, #94a3b8, #64748b)' },
            rare: { emoji: '🥚', name: 'Rare Egg', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
            legendary: { emoji: '🥚', name: 'Cursed Egg', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' }
        };
        displayInfo = typeInfo[eggType] || typeInfo.basic;
    }

    const card = createCard({
        body: `
            <div style="text-align: center;">
                <div style="
                    font-size: 6em;
                    margin-bottom: 12px;
                    background: ${displayInfo.gradient};
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(0 2px 8px ${displayInfo.color}40);
                ">${displayInfo.emoji}</div>
                <div style="font-weight: bold; color: ${displayInfo.color}; font-size: 1.1em; margin-bottom: 8px;">${displayInfo.name}</div>
                <div style="color: var(--text-secondary); margin-bottom: 16px;">Quantity: ${count}</div>
            </div>
        `,
        footer: [
            createButton({
                text: 'Hatch',
                variant: 'gold',
                onClick: async () => {
                    // Get the first egg from the list
                    const egg = eggList[0];
                    if (!egg) {
                        NotificationSystem.show('No egg available to hatch', 'error');
                        return;
                    }

                    // Prompt for pet name
                    const petName = prompt('Give your new pet a name:');
                    if (!petName || petName.trim() === '') {
                        NotificationSystem.show('Please enter a valid name', 'error');
                        return;
                    }

                    // Call API to hatch the egg
                    const result = await PetData.hatchEgg(egg.id, petName.trim());
                    if (result) {
                        // Refresh view
                        router.navigate('pets');
                    }
                }
            })
        ]
    });

    return card;
}

/**
 * Create pets collection section
 */
function createPetsCollectionSection(collection) {
    const section = document.createElement('div');

    const header = document.createElement('h2');
    header.style.cssText = 'color: var(--text-gold); margin-bottom: 16px; font-size: 1.3em;';
    header.innerHTML = `🐾 Pet Collection <span style="color: var(--text-secondary); font-size: 0.85em;">(${collection.length})</span>`;
    section.appendChild(header);

    if (collection.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'card';
        emptyMsg.style.cssText = 'text-align: center; padding: 40px; color: var(--text-secondary);';
        emptyMsg.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 12px;">🐉</div>
            <p>No pets in your collection</p>
            <p style="font-size: 0.9em; margin-top: 8px;">Hatch eggs to get your first pet!</p>
        `;
        section.appendChild(emptyMsg);
    } else {
        const petsGrid = document.createElement('div');
        petsGrid.className = 'grid grid-3';

        collection.forEach(pet => {
            const petCard = createPetCard(pet);
            petsGrid.appendChild(petCard);
        });

        section.appendChild(petsGrid);
    }

    return section;
}

/**
 * Create a single pet card
 */
function createPetCard(pet) {
    const bonuses = PetData.calculatePetBonuses(pet);
    const isEquipped = pet.equipped;

    const card = createCard({
        body: `
            <div class="pet-card-content">
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 3.5em; margin-bottom: 8px;">${pet.emoji}</div>
                    <div style="font-weight: bold; color: var(--text-primary); font-size: 1.1em;">${pet.name}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9em; text-transform: capitalize;">${pet.species}</div>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: var(--text-secondary);">Level ${pet.level}</span>
                        <span style="color: var(--text-secondary);">${pet.xp} / ${pet.xpMax} XP</span>
                    </div>
                    ${createProgressBar({ current: pet.xp, max: pet.xpMax, type: 'exp', showText: false }).outerHTML}
                </div>

                <div style="background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-md); margin-bottom: 12px;">
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 8px; text-align: center; text-transform: uppercase; font-weight: bold;">Bonuses</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9em;">
                        <div>⚔️ ATK: <span style="color: var(--text-gold);">+${bonuses.attack}</span></div>
                        <div>🛡️ DEF: <span style="color: var(--text-gold);">+${bonuses.defense}</span></div>
                        <div>❤️ HP: <span style="color: var(--text-gold);">+${bonuses.hp}</span></div>
                        <div>💥 DMG: <span style="color: var(--text-gold);">+${bonuses.damageIncrease.toFixed(1)}%</span></div>
                    </div>
                </div>

                ${isEquipped ? `
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
                                padding: 8px; border-radius: var(--radius-md); text-align: center; margin-bottom: 12px;
                                border: 1px solid rgba(16, 185, 129, 0.5);">
                        <span style="color: #10b981; font-weight: bold;">✓ Equipped (${pet.equippedSet.toUpperCase()})</span>
                    </div>
                ` : ''}
            </div>
        `,
        footer: [
            createButton({
                text: 'Details',
                variant: 'primary',
                onClick: () => showPetDetailModal(pet)
            })
        ]
    });

    return card;
}

/**
 * Create pet equipment set section (attack or defense)
 */
function createPetSetSection(setType, petSet, collection) {
    const setIcon = setType === 'attack' ? '⚔️' : '🛡️';
    const setName = setType === 'attack' ? 'Attack Set' : 'Defense Set';

    const card = createCard({
        title: `${setIcon} ${setName}`
    });

    const bodyContent = document.createElement('div');

    // Calculate total bonuses from equipped pets in this set
    const totalBonuses = {
        damageIncrease: 0,
        attack: 0,
        defense: 0,
        hp: 0
    };

    // Sum up bonuses from all pets in the set
    Object.values(petSet).forEach(pet => {
        if (pet && pet.stats) {
            const bonuses = PetData.calculatePetBonuses(pet);
            totalBonuses.damageIncrease += bonuses.damageIncrease || 0;
            totalBonuses.attack += bonuses.attack || 0;
            totalBonuses.defense += bonuses.defense || 0;
            totalBonuses.hp += bonuses.hp || 0;
        }
    });

    const bonusesDisplay = document.createElement('div');
    bonusesDisplay.style.cssText = 'background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px;';
    bonusesDisplay.innerHTML = `
        <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 8px; text-align: center; text-transform: uppercase; font-weight: bold;">Total Set Bonuses</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9em;">
            <div>⚔️ ATK: <span style="color: var(--text-gold);">+${totalBonuses.attack}</span></div>
            <div>🛡️ DEF: <span style="color: var(--text-gold);">+${totalBonuses.defense}</span></div>
            <div>❤️ HP: <span style="color: var(--text-gold);">+${totalBonuses.hp}</span></div>
            <div>💥 DMG: <span style="color: var(--text-gold);">+${totalBonuses.damageIncrease.toFixed(1)}%</span></div>
        </div>
    `;
    bodyContent.appendChild(bonusesDisplay);

    // Pet slots (pet_1, pet_2, pet_3)
    for (let i = 1; i <= 3; i++) {
        const slotKey = `pet_${i}`;
        const pet = petSet[slotKey] || null;

        const slotDiv = document.createElement('div');
        slotDiv.style.cssText = 'background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-md); margin-bottom: 12px; border: 2px solid var(--border-primary);';

        if (pet) {
            slotDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 2.5em;">${pet.emoji}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: var(--text-primary);">${pet.name}</div>
                        <div style="color: var(--text-secondary); font-size: 0.9em;">Level ${pet.level} • ${pet.species}</div>
                    </div>
                </div>
            `;

            const unequipBtn = createButton({
                text: 'Unequip',
                variant: 'danger',
                className: 'btn-sm',
                onClick: () => {
                    PetData.unequipPet(slotKey, setType);
                    router.navigate('pets');
                }
            });
            unequipBtn.style.cssText = 'width: 100%; margin-top: 8px;';
            slotDiv.appendChild(unequipBtn);
        } else {
            slotDiv.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                    <div style="font-size: 2em; margin-bottom: 8px;">➕</div>
                    <div style="font-size: 0.9em;">Empty Slot ${i + 1}</div>
                </div>
            `;

            const equipBtn = createButton({
                text: 'Equip Pet',
                variant: 'success',
                onClick: () => showEquipPetModal(setType, slotKey, collection)
            });
            equipBtn.style.cssText = 'width: 100%;';
            slotDiv.appendChild(equipBtn);
        }

        bodyContent.appendChild(slotDiv);
    }

    card.querySelector('.card-body').appendChild(bodyContent);
    return card;
}

/**
 * Show egg detail modal with hatching option
 */
function showEggDetailModal(egg) {
    // Determine egg color/gradient based on species if available
    const eggColors = {
        // Draconic - Purple/Dark
        dragon: { emoji: '🥚', name: 'Shadowed Egg', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
        wyvern: { emoji: '🥚', name: 'Crimson Egg', color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626, #991b1b)' },

        // Beasts - Blue/Green
        wolf: { emoji: '🥚', name: 'Frost Egg', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
        bear: { emoji: '🥚', name: 'Earthen Egg', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
        tiger: { emoji: '🥚', name: 'Infernal Egg', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
        lion: { emoji: '🥚', name: 'Golden Egg', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)' },

        // Mystical - Orange/Purple
        fox: { emoji: '🥚', name: 'Mystic Egg', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
        raven: { emoji: '🥚', name: 'Darkened Egg', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #374151)' },
        owl: { emoji: '🥚', name: 'Moonlit Egg', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },

        // Reptilian - Green
        snake: { emoji: '🥚', name: 'Venomous Egg', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
        turtle: { emoji: '🥚', name: 'Ironshell Egg', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #15803d)' },

        // Mythical - Various
        spider: { emoji: '🥚', name: 'Void Egg', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
        scorpion: { emoji: '🥚', name: 'Scorched Egg', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
        unicorn: { emoji: '🥚', name: 'Cursed Egg', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' },
        cat: { emoji: '🥚', name: 'Shadow Egg', color: '#4b5563', gradient: 'linear-gradient(135deg, #4b5563, #1f2937)' }
    };

    // Get egg display info based on species
    const eggInfo = eggColors[egg.species?.toLowerCase()] || {
        emoji: '🥚',
        name: 'Mystery Egg',
        color: '#94a3b8',
        gradient: 'linear-gradient(135deg, #94a3b8, #64748b)'
    };

    const modalBody = document.createElement('div');
    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="
                font-size: 8em;
                margin-bottom: 16px;
                background: ${eggInfo.gradient};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 4px 12px ${eggInfo.color}60);
            ">${eggInfo.emoji}</div>
            <div style="font-size: 1.8em; font-weight: bold; color: ${eggInfo.color}; margin-bottom: 8px;">${eggInfo.name}</div>
            <div style="color: var(--text-secondary); font-size: 1.1em;">Unhatched</div>
        </div>

        <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--radius-md); margin-bottom: 20px;">
            <div style="text-align: center; color: var(--text-secondary); line-height: 1.6;">
                <div style="font-size: 2em; margin-bottom: 12px;">❓</div>
                <p style="margin-bottom: 12px;">This egg contains a mysterious companion waiting to be hatched!</p>
                <p style="font-size: 0.9em; color: var(--text-tertiary);">Species, stats, and abilities will be revealed upon hatching.</p>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15));
                    padding: 16px; border-radius: var(--radius-md);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    text-align: center;">
            <div style="color: var(--text-gold); font-weight: bold; margin-bottom: 8px;">Ready to Hatch</div>
            <div style="color: var(--text-secondary); font-size: 0.9em;">Give your new companion a name to begin your journey together!</div>
        </div>
    `;

    const modal = createModal({
        title: `${eggInfo.emoji} Egg Details`,
        body: modalBody,
        footer: [
            createButton({
                text: 'Hatch Egg',
                variant: 'gold',
                onClick: async () => {
                    // Prompt for pet name
                    const petName = prompt('Give your new pet a name:');
                    if (!petName || petName.trim() === '') {
                        NotificationSystem.show('Please enter a valid name', 'error');
                        return;
                    }

                    // Call API to hatch the egg
                    const result = await PetData.hatchEgg(egg.id, petName.trim());
                    if (result) {
                        // Close modal
                        document.body.removeChild(modal);

                        // Show success and refresh view
                        NotificationSystem.show(`${petName} has hatched!`, 'success');
                        router.navigate('pets');
                    }
                }
            }),
            createButton({
                text: 'Close',
                variant: 'secondary',
                onClick: () => document.body.removeChild(modal)
            })
        ]
    });

    document.body.appendChild(modal);
}

/**
 * Show pet detail modal with full stats and actions
 */
function showPetDetailModal(pet, isNewlyHatched = false) {
    // Check if this is an egg (not yet hatched)
    if (pet.is_egg || !pet.hatched) {
        showEggDetailModal(pet);
        return;
    }

    const bonuses = PetData.calculatePetBonuses(pet);

    // Get available pet food from inventory
    const inventory = InventoryData.getInventory();
    const petFood = (inventory.items || []).filter(item => item.type === 'FOOD');

    const modalBody = document.createElement('div');
    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 5em; margin-bottom: 12px;">${pet.emoji || '🐾'}</div>
            <div style="font-size: 1.5em; font-weight: bold; color: var(--text-primary); margin-bottom: 4px;">${pet.name || 'Unnamed'}</div>
            <div style="color: var(--text-secondary); text-transform: capitalize;">Species: ${pet.species || 'Unknown'} • Focus: ${pet.focus || 'Unknown'}</div>
            ${isNewlyHatched ? '<div style="color: var(--text-gold); margin-top: 8px; font-weight: bold;">🎉 Just Hatched!</div>' : ''}
        </div>

        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-bottom: 16px;">
            <div style="font-weight: bold; color: var(--text-gold); margin-bottom: 12px; text-align: center;">Level ${pet.level}</div>
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: var(--text-secondary);">Experience</span>
                    <span style="color: var(--text-secondary);">${pet.xp} / ${pet.xpMax}</span>
                </div>
                ${createProgressBar({ current: pet.xp, max: pet.xpMax, type: 'exp', showText: false }).outerHTML}
            </div>
            ${pet.level < 100 ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-primary);">
                    <div style="font-weight: bold; color: var(--text-gold); margin-bottom: 12px; text-align: center;">
                        Feed Pet Food
                    </div>
                    ${petFood.length > 0 ? `
                        <div id="pet-food-list" style="display: flex; flex-direction: column; gap: 8px;">
                            ${petFood.map(food => `
                                <button class="btn btn-primary feed-food-btn" data-food-id="${food.id}" style="display: flex; justify-content: space-between; align-items: center; text-align: left;">
                                    <span>${food.name}</span>
                                    <span style="color: var(--text-gold);">+${food.petExp || 10} XP</span>
                                </button>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 20px; color: var(--text-secondary); background: var(--bg-primary); border-radius: var(--radius-md);">
                            <div style="font-size: 2em; margin-bottom: 8px;">🍖</div>
                            <div>No pet food available</div>
                            <div style="font-size: 0.85em; margin-top: 4px;">Buy pet food from the merchant!</div>
                        </div>
                    `}
                </div>
            ` : '<div style="color: var(--text-gold); text-align: center; font-weight: bold; margin-top: 12px;">✨ MAX LEVEL ✨</div>'}
        </div>

        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-bottom: 16px;">
            <div style="font-weight: bold; color: var(--text-gold); margin-bottom: 12px; text-align: center;">Stat Bonuses</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="text-align: center; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-md);">
                    <div style="font-size: 1.5em; margin-bottom: 4px;">⚔️</div>
                    <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 4px;">Attack</div>
                    <div style="color: var(--text-gold); font-weight: bold;">+${bonuses.attack}</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-md);">
                    <div style="font-size: 1.5em; margin-bottom: 4px;">🛡️</div>
                    <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 4px;">Defense</div>
                    <div style="color: var(--text-gold); font-weight: bold;">+${bonuses.defense}</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-md);">
                    <div style="font-size: 1.5em; margin-bottom: 4px;">❤️</div>
                    <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 4px;">HP</div>
                    <div style="color: var(--text-gold); font-weight: bold;">+${bonuses.hp}</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-md);">
                    <div style="font-size: 1.5em; margin-bottom: 4px;">💥</div>
                    <div style="color: var(--text-secondary); font-size: 0.85em; margin-bottom: 4px;">Damage</div>
                    <div style="color: var(--text-gold); font-weight: bold;">+${bonuses.damageIncrease.toFixed(1)}%</div>
                </div>
            </div>
        </div>

        ${pet.equipped ? `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
                        padding: 12px; border-radius: var(--radius-md); text-align: center;
                        border: 1px solid rgba(16, 185, 129, 0.5);">
                <span style="color: #10b981; font-weight: bold;">Currently Equipped in ${pet.equippedSet.toUpperCase()} Set (Slot ${pet.equippedSlot + 1})</span>
            </div>
        ` : ''}
    `;

    const modal = createModal({
        title: `${pet.emoji} Pet Details`,
        body: modalBody,
        footer: [
            createButton({
                text: 'Close',
                variant: 'secondary',
                onClick: () => modal.close()
            })
        ]
    });

    modal.show();

    // Add feed food functionality
    if (pet.level < 100) {
        const feedButtons = document.querySelectorAll('.feed-food-btn');
        feedButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const foodId = btn.dataset.foodId;
                const foodItem = petFood.find(f => f.id === foodId);

                if (foodItem && PetData.feedFood(pet.id, foodItem)) {
                    // Get updated pet data
                    const petState = PetData.getPetState();
                    const updatedPet = petState.collection.find(p => p.id === pet.id);

                    modal.close();
                    showPetDetailModal(updatedPet); // Refresh modal with updated pet
                }
            });
        });
    }
}

/**
 * Show modal to select a pet to equip
 */
function showEquipPetModal(setType, slot, collection) {
    // Filter unequipped pets
    const availablePets = collection.filter(p => !p.equipped);

    const modalBody = document.createElement('div');

    // Extract slot number from slot key (e.g., "pet_1" -> 1)
    const slotNumber = slot.split('_')[1];

    // Create modal first so it's available in closures
    const modal = createModal({
        title: `Select Pet for ${setType === 'attack' ? '⚔️ Attack' : '🛡️ Defense'} Slot ${slotNumber}`,
        body: modalBody,
        footer: [
            createButton({
                text: 'Cancel',
                variant: 'secondary',
                onClick: () => modal.close()
            })
        ]
    });

    if (availablePets.length === 0) {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 3em; margin-bottom: 12px;">🐾</div>
                <p>No pets available to equip</p>
                <p style="font-size: 0.9em; margin-top: 8px;">All your pets are already equipped!</p>
            </div>
        `;
    } else {
        const petsGrid = document.createElement('div');
        petsGrid.className = 'grid grid-2';
        petsGrid.style.marginTop = '16px';

        availablePets.forEach(pet => {
            const bonuses = PetData.calculatePetBonuses(pet);

            const petCard = document.createElement('div');
            petCard.className = 'card';
            petCard.style.cursor = 'pointer';
            petCard.innerHTML = `
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 3em; margin-bottom: 8px;">${pet.emoji}</div>
                    <div style="font-weight: bold; color: var(--text-primary);">${pet.name}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9em;">Level ${pet.level} • ${pet.species}</div>
                </div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    <div>⚔️ ATK: +${bonuses.attack} | 🛡️ DEF: +${bonuses.defense}</div>
                    <div>❤️ HP: +${bonuses.hp} | 💥 DMG: +${bonuses.damageIncrease.toFixed(1)}%</div>
                </div>
            `;

            petCard.addEventListener('click', async () => {
                await PetData.equipPet(pet.id, slot, setType);
                modal.close();
                router.navigate('pets');
            });

            petsGrid.appendChild(petCard);
        });

        modalBody.appendChild(petsGrid);
    }

    modal.show();
}

// Make it globally available
window.createPetsView = createPetsView;
