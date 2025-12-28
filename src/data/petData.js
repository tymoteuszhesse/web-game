/**
 * Pet & Egg System - API-First Version
 * All operations communicate directly with the backend API
 */

// Pet species definitions
const PetSpecies = {
    // Draconic Beasts
    DRAGON: { id: 'dragon', name: 'Shadow Dragon', emoji: '🐉', focus: 'attack' },
    WYVERN: { id: 'wyvern', name: 'Blood Wyvern', emoji: '🦇', focus: 'damage' },

    // Dire Beasts
    WOLF: { id: 'wolf', name: 'Direwolf', emoji: '🐺', focus: 'mixed' },
    BEAR: { id: 'bear', name: 'Abyssal Bear', emoji: '🐻', focus: 'hp' },
    TIGER: { id: 'tiger', name: 'Nightmare Tiger', emoji: '🐯', focus: 'attack' },
    LION: { id: 'lion', name: 'Infernal Lion', emoji: '🦁', focus: 'balanced' },

    // Mystical Creatures
    FOX: { id: 'fox', name: 'Spirit Fox', emoji: '🦊', focus: 'balanced' },
    RAVEN: { id: 'raven', name: 'Death Raven', emoji: '🦅', focus: 'damage' },
    OWL: { id: 'owl', name: 'Phantom Owl', emoji: '🦉', focus: 'defense' },

    // Reptilian
    SNAKE: { id: 'snake', name: 'Venom Serpent', emoji: '🐍', focus: 'attack' },
    TURTLE: { id: 'turtle', name: 'Ironshell Tortoise', emoji: '🐢', focus: 'defense' },

    // Mythical
    SPIDER: { id: 'spider', name: 'Void Spider', emoji: '🕷️', focus: 'mixed' },
    SCORPION: { id: 'scorpion', name: 'Crimson Scorpion', emoji: '🦂', focus: 'attack' },
    UNICORN: { id: 'unicorn', name: 'Dark Unicorn', emoji: '🦄', focus: 'hp' },
    CAT: { id: 'cat', name: 'Shadow Cat', emoji: '🐈‍⬛', focus: 'balanced' }
};

const PetData = {
    _cache: [],
    _loading: false,

    /**
     * Get pets from API
     */
    async getPetState() {
        if (this._loading) {
            return {
                collection: this._cache,
                attackSet: {},
                defenseSet: {},
                eggs: []
            };
        }

        if (!apiClient.isAuthenticated()) {
            return {
                collection: [],
                attackSet: {},
                defenseSet: {},
                eggs: []
            };
        }

        try {
            this._loading = true;
            const response = await apiClient.getPets();

            // API returns: { pets: [], attack_set: {}, defense_set: {} }
            const pets = response.pets || [];
            const attackSet = response.attack_set || {};
            const defenseSet = response.defense_set || {};

            // Transform API pets to UI format
            this._cache = pets.map(pet => {
                const speciesData = PetSpecies[pet.species?.toUpperCase()] || PetSpecies.CAT;
                return {
                    id: pet.id,
                    name: pet.name,
                    species: pet.species,
                    emoji: speciesData.emoji,
                    focus: pet.focus || speciesData.focus,
                    level: pet.level,
                    xp: pet.exp || 0,
                    xpMax: pet.exp_max || 100,
                    hatched: !pet.is_egg,
                    stats: {
                        attack: pet.attack_bonus || 0,
                        defense: pet.defense_bonus || 0,
                        hp: pet.hp_bonus || 0
                    },
                    is_egg: pet.is_egg || false
                };
            });

            // Separate eggs from hatched pets
            const eggs = this._cache.filter(pet => pet.is_egg);
            const collection = this._cache.filter(pet => !pet.is_egg);

            // Transform pet sets from API response
            const transformPetSet = (setData) => {
                const result = {};
                if (setData.pet_1) {
                    const pet = collection.find(p => p.id === setData.pet_1.id);
                    if (pet) result['pet_1'] = pet;
                }
                if (setData.pet_2) {
                    const pet = collection.find(p => p.id === setData.pet_2.id);
                    if (pet) result['pet_2'] = pet;
                }
                if (setData.pet_3) {
                    const pet = collection.find(p => p.id === setData.pet_3.id);
                    if (pet) result['pet_3'] = pet;
                }
                return result;
            };

            return {
                collection,
                attackSet: transformPetSet(attackSet),
                defenseSet: transformPetSet(defenseSet),
                eggs
            };

        } catch (error) {
            console.error('Failed to get pets:', error);
            return {
                collection: this._cache,
                attackSet: {},
                defenseSet: {},
                eggs: []
            };
        } finally {
            this._loading = false;
        }
    },

    /**
     * Calculate XP required for next level
     */
    calculateXPForLevel(level) {
        const baseXP = 100;
        return Math.floor(baseXP * Math.pow(level, 1.5));
    },

    /**
     * Calculate pet bonuses based on level and focus
     */
    calculatePetBonuses(pet) {
        const baseBonus = 5;
        const levelBonus = 0.5;
        const damageIncrease = baseBonus + (pet.level * levelBonus);

        const statMultiplier = pet.level * 2;

        const bonuses = {
            damageIncrease,
            attack: 0,
            defense: 0,
            hp: 0
        };

        switch (pet.focus) {
            case 'attack':
                bonuses.attack = statMultiplier * 3;
                break;
            case 'defense':
                bonuses.defense = statMultiplier * 3;
                break;
            case 'hp':
                bonuses.hp = statMultiplier * 5;
                break;
            case 'damage':
                bonuses.attack = statMultiplier * 2;
                bonuses.damageIncrease += 2;
                break;
            case 'mixed':
                bonuses.attack = statMultiplier;
                bonuses.defense = statMultiplier;
                break;
            case 'balanced':
                bonuses.attack = statMultiplier;
                bonuses.defense = statMultiplier;
                bonuses.hp = statMultiplier * 2;
                break;
        }

        return bonuses;
    },

    /**
     * Get total bonuses from all equipped pets in a set
     */
    async getTotalBonuses(setType = 'attack') {
        const petState = await this.getPetState();
        const equippedPets = setType === 'attack' ? petState.attackSet : petState.defenseSet;

        const totalBonuses = {
            damageIncrease: 0,
            attack: 0,
            defense: 0,
            hp: 0
        };

        Object.values(equippedPets).forEach(pet => {
            if (pet) {
                const bonuses = this.calculatePetBonuses(pet);
                totalBonuses.damageIncrease += bonuses.damageIncrease;
                totalBonuses.attack += bonuses.attack;
                totalBonuses.defense += bonuses.defense;
                totalBonuses.hp += bonuses.hp;
            }
        });

        return totalBonuses;
    },

    /**
     * Buy pet egg from API
     */
    async buyEgg() {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return null;
        }

        try {
            const egg = await apiClient.buyPetEgg();

            // Update player gold
            const player = await apiClient.getPlayerInfo();
            gameState.set('player', player);
            PlayerData.updateUI();

            // Refresh pets
            await this.getPetState();

            NotificationSystem.show('Purchased mystery egg!', 'success');
            return egg;

        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to buy egg', 'error');
            return null;
        }
    },

    /**
     * Hatch pet egg with API
     */
    async hatchEgg(eggId, name) {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return null;
        }

        try {
            const response = await apiClient.hatchPet(eggId, name);

            // Refresh pets
            await this.getPetState();

            // Use the message from the backend or construct one
            const message = response.message || `${name} hatched! It's a ${response.pet?.species || 'pet'}!`;
            NotificationSystem.show(message, 'success');
            return response.pet || response;

        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to hatch egg', 'error');
            return null;
        }
    },

    /**
     * Feed pet with API
     */
    async feedPet(petId, foodAmount) {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return null;
        }

        try {
            const result = await apiClient.feedPet(petId, foodAmount);

            // Refresh pets
            await this.getPetState();

            if (result.leveled_up) {
                NotificationSystem.show(`Level up! Now level ${result.new_level}!`, 'success');
            } else {
                NotificationSystem.show(`Pet fed! +${foodAmount} XP`, 'success');
            }

            return result;

        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to feed pet', 'error');
            return null;
        }
    },

    /**
     * Equip pet with API
     */
    async equipPet(petId, slot, setType = 'attack') {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return false;
        }

        try {
            await apiClient.equipPet(petId, slot, setType);

            // Refresh pets
            await this.getPetState();

            NotificationSystem.show('Pet equipped!', 'success');
            return true;

        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to equip pet', 'error');
            return false;
        }
    },

    /**
     * Unequip pet with API
     */
    async unequipPet(slot, setType = 'attack') {
        if (!apiClient.isAuthenticated()) {
            NotificationSystem.show('Please login first', 'error');
            return false;
        }

        try {
            await apiClient.unequipPet(slot, setType);

            // Refresh pets
            await this.getPetState();

            NotificationSystem.show('Pet unequipped!', 'info');
            return true;

        } catch (error) {
            NotificationSystem.show(error.message || 'Failed to unequip pet', 'error');
            return false;
        }
    },

    /**
     * Get all owned pets
     */
    async getAllPets() {
        const petState = await this.getPetState();
        return petState.collection || [];
    },

    /**
     * Get equipped pets for a set
     */
    async getEquippedPets(setType = 'attack') {
        const petState = await this.getPetState();
        const equipped = setType === 'attack' ? petState.attackSet : petState.defenseSet;
        return Object.values(equipped).filter(pet => pet !== null);
    },

    /**
     * Get all species data
     */
    getAllSpecies() {
        return Object.values(PetSpecies);
    }
};

// Make it globally available
window.PetData = PetData;
window.PetSpecies = PetSpecies;
