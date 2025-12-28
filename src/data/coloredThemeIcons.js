/**
 * Colored Medieval Fantasy Theme Icons
 * Using popular Game-Icons.net SVG collection with strategic color theming
 * License: CC BY 3.0 (https://game-icons.net)
 *
 * Design System: Neo-Medieval with Jewel-Tone Palette
 * - Combat: Ruby/Crimson (#C41E3A)
 * - Resources: Gold (#D4AF37), Emerald (#50C878), Sapphire (#0F52BA)
 * - Social: Amethyst (#9966CC)
 * - Magic: Mystic Purple (#8B00FF)
 * - Info: Parchment (#E8DCC4)
 */

const ColoredThemeIcons = {
    // Color palette constants
    colors: {
        ruby: '#C41E3A',
        crimson: '#DC143C',
        gold: '#D4AF37',
        brightGold: '#FFD700',
        emerald: '#50C878',
        sapphire: '#0F52BA',
        amethyst: '#9966CC',
        mysticPurple: '#8B00FF',
        parchment: '#E8DCC4',
        obsidian: '#0D0A0F',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        darkRed: '#8B0000',
        oceanBlue: '#006994',
    },

    // Medieval/Fantasy SVG Icons from Game-Icons.net
    icons: {
        // === RESOURCES & PROGRESSION ===

        // Stamina - Lightning bolt in electric blue
        stamina: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
            </svg>`,
            color: '#00D4FF'
        },

        // Gold - Coin in bright gold
        gold: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                <path d="M12 18V6"/>
            </svg>`,
            color: '#FFD700'
        },

        // Gems - Premium gem/diamond icon
        gems: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
                <path d="M11 3L8 9l4 13 4-13-3-6"/>
                <path d="M2 9h20"/>
            </svg>`,
            color: '#9966CC'
        },

        // Experience - Radiating star in bright gold
        exp: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>`,
            color: '#FFD700'
        },

        // Clock/Time - Clean clock icon in bright gold
        clock: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>`,
            color: '#FFD700'
        },

        // Level - Trending up chevron in bright gold
        level: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
            </svg>`,
            color: '#FFD700'
        },

        // === COMBAT & STATS ===

        // Attack - Crossed swords in ruby red
        attack: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="ICON_COLOR" d="M18.5 17.47l-1.03 106.03 68.41-68.4L18.5 17.47zM113.8 67.31L31.88 149.2l50.62 50.6 81.9-81.9-50.6-50.59zm138.7 46.97l-11.3 11.3 33.9 33.9 11.3-11.3-33.9-33.9zm56.6 56.52l-11.3 11.3L412.7 297l11.3-11.3-114.9-114.9zm-78.7 22.6l-113.9 113.9c-9.2 9.2-11.3 22.9-6 34.4-7.1 19.5-8.7 42.2-.4 64 11.3 30 36.7 55.4 66.7 66.7 21.8 8.3 44.5 6.7 64 .4 11.5 5.3 25.2 3.2 34.4-6l113.9-113.9L230.4 193.4zm39.7 158.2l-15 15 60.3 60.3 15-15-60.3-60.3zm-123.6 13c-4.1.1-8.3.9-12.3 2.5-14 5.5-26.3 16.1-33.3 29.9-7.2 13.7-8.9 29.6-5.1 44 3.8 14.4 13.3 27.2 26.3 35.2 12.9 8 28.1 11.1 42.5 8.4 14.4-2.7 27.9-10.9 37.5-23.1 9.6-12 15.1-26.9 15.1-42.1 0-8.4-1.6-16.7-4.7-24.5-.8-1.9-2.4-3.3-4.4-3.9-1.9-.4-3.9.1-5.3 1.5l-45.5 41.1c-1.7 1.6-2.5 4-2 6.3.5 2.4 2.3 4.4 4.5 5.2 2.3.9 4.9.7 6.9-.8l35-26c-.8 3.5-2 6.8-3.7 9.9-5.2 9.5-14.3 16.4-24.8 18.9-10.4 2.7-21.6.4-30.7-6-9.2-6.5-15.6-16.4-17.7-27.3-2.1-11.1-.1-22.7 5.6-31.9 5.7-9.3 15.1-15.9 25.5-18.1 1.7-.4 3.5-.5 5.1-.7z"/></svg>`,
            color: '#C41E3A'
        },

        // Stats - Character with stats in amethyst
        stats: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>`,
            color: '#9966CC'
        },

        // Defense - Shield in steel blue
        defense: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="ICON_COLOR" d="M256 25.14l-18.8 6.27-208 69.33-13.2 4.4v15.02c0 95.28 22.1 172.07 58.3 234.24 36.2 62.2 89.1 109.5 152.7 148.5l11.8 7.2 12.4-6.5c66.5-35.2 122.3-81.3 160.3-144.3 38-63 59.5-141.85 59.5-239.14v-15.02l-13.2-4.4-208-69.33-13.2-4.41-6.6 2.21zm0 33.92l192 64v14.52c0 91.52-20.2 163.32-53.9 220.12-33.7 56.9-84.5 100.2-147.5 134.2-57.7-35.4-105-77.3-138.6-134.5-33.6-57.1-51.9-127.21-52-217.82V123.06l200-64zm0 68.04l-80 144h48v96l80-144h-48v-96z"/></svg>`,
            color: '#4682B4'
        },

        // HP - Heart in crimson
        hp: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="ICON_COLOR" d="M352.92 23.734c-32.548 0-62.99 14.843-88.92 36.31-25.93-21.467-56.372-36.31-88.92-36.31-74.448 0-135.94 61.492-135.94 135.94 0 79.887 62.662 150.557 114.75 199.527 52.08 48.97 99.87 74.84 108.03 79.22l2.08 1.12 2.08-1.12c8.16-4.38 55.95-30.25 108.03-79.22 52.088-48.97 114.75-119.64 114.75-199.527 0-74.448-61.492-135.94-135.94-135.94z"/></svg>`,
            color: '#DC143C'
        },

        // === ACTIVITIES & NAVIGATION ===

        // Battle - Wide medieval broadsword icon
        battle: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <!-- Pointed tip -->
                <path d="M9 4 L12 2 L15 4" fill="ICON_COLOR" stroke-width="1"/>
                <!-- Wide blade with fuller (blood groove) -->
                <path d="M9 4 L9 15 L12 16 L15 15 L15 4 Z" fill="ICON_COLOR" opacity="0.8" stroke-width="1"/>
                <line x1="12" y1="4" x2="12" y2="14.5" stroke-width="0.5" opacity="0.3"/>
                <!-- Blade edges -->
                <line x1="9" y1="4" x2="9" y2="15" stroke-width="1.5"/>
                <line x1="15" y1="4" x2="15" y2="15" stroke-width="1.5"/>
                <!-- Crossguard -->
                <rect x="6" y="15" width="12" height="1.5" fill="ICON_COLOR" rx="0.5"/>
                <!-- Grip with wrapping -->
                <rect x="10.5" y="16.5" width="3" height="4" fill="ICON_COLOR" opacity="0.6" rx="0.5"/>
                <line x1="10.5" y1="17.5" x2="13.5" y2="17.5" stroke-width="0.3" opacity="0.4"/>
                <line x1="10.5" y1="19" x2="13.5" y2="19" stroke-width="0.3" opacity="0.4"/>
                <!-- Pommel -->
                <circle cx="12" cy="21.5" r="1.5" fill="ICON_COLOR"/>
                <circle cx="12" cy="21.5" r="0.8" fill="none" stroke-width="0.5" opacity="0.5"/>
            </svg>`,
            color: '#C41E3A'
        },

        // Menu - Clean hamburger menu icon
        menu: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>`,
            color: '#D4AF37'
        },

        // Inventory - Package/Box in leather brown
        inventory: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16.5 9.4 7.55 4.24"/>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.29 7 12 12 20.71 7"/>
                <line x1="12" y1="22" x2="12" y2="12"/>
            </svg>`,
            color: '#8B4513'
        },

        // Pets - Paw print in earthy green
        pets: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="4" r="2"/>
                <circle cx="18" cy="8" r="2"/>
                <circle cx="20" cy="16" r="2"/>
                <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
            </svg>`,
            color: '#50C878'
        },

        // Blacksmith - Anvil in dark iron
        blacksmith: {
            svg: `<svg xmlns="http://www.w3.org/2000/xmlns" viewBox="0 0 512 512"><path fill="ICON_COLOR" d="M280.8 16.03c-4.7-.01-9.4.11-14.1.36l-10 .54 3.1 9.47c10.2 31.28 27.2 66.67 47 102.47-29.5-6.5-60.2-16.6-82.3-24.9l-10.9-4.1-3.7 11.2c-3.5 10.7-5.7 21.6-6.7 32.6l44.6 22.3c-10.6 19.8-21.8 39.2-33.3 57.7-43.4-7.4-84.3-13.2-124.14-17.4l-11.12-1.2-2.45 10.9c-7.27 32.4-5.21 64.7 5.74 95.7l12.42 35.5 31.55-20.7c24.6-16.1 52.5-30.7 82.7-42.8 13.2 62.7 29.8 111.6 37.9 141.5l3.3 12.1 10.8-6.4c28.8-17.1 56.7-42.8 81.5-76.3 6.4 13.7 15.8 27 28.3 39.1l11.1 10.7 7.3-13.5c19.8-36.7 31.3-76.3 33.8-115.3 12.8-28.5 23.4-58.2 31.2-87.9l3.8-14.3-14.2 4c-29.3 8.2-58.4 19.4-85.7 32.1-7.5-22.1-15.6-44.1-24.2-65.5 25.7-7.9 51.2-13.7 76.7-17.4l14.3-2.1-7.7-12.3c-19.8-31.5-47.1-59.9-81.5-81.37l-11.9-7.44-6.4 13.01c-13.1 26.6-23.3 54.1-30.6 81.4-10.5-16.8-20.1-33.3-28.6-49.1 11.5-31.54 19.1-63.54 22.2-95.34l1.4-14.33-13.9 4.39c-7.5 2.36-14.9 5.12-22.1 8.25zm-67.3 196.77c-25.9 11-50.4 23.6-72.7 37.3-6.3-20.8-8.4-42.2-6.2-63.9 34.1 3.7 69.3 8.8 108.4 15.4-10.1 3.6-19.9 7.4-29.5 11.2zm125 13.4c23.6-10.7 48.4-20.2 73.2-27.5-6.5 24.6-14.9 48.9-25.2 72-15.2-15.4-29.8-29.8-48-44.5zm-84.6 21.8c11.9 21.5 31.2 42.3 54.7 60.1-18.1 24.9-37.7 44.9-58.2 59.4-6.9-25.2-19.9-65.9-31.3-119 11.4-.3 22.9-.5 34.8-.5z"/></svg>`,
            color: '#2F4F4F'
        },

        // Merchant - Shop/Store in dark purple
        merchant: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="ICON_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                <path d="M2 7h20"/>
                <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
            </svg>`,
            color: '#4B0082'
        },

        // Guild - Banner/fortress in royal blue
        guild: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="ICON_COLOR" d="M256.7 19.78L77.23 98.15l11.89 34.45 167.58-57.83 167.6 57.83 11.9-34.45L256.7 19.78zM53.48 125.5v290.4l203.22 71v-290.4l-203.22-71zm405.02 0l-203.2 71v290.4l203.2-71V125.5zM133.3 169.2l60.5 21.1v58.1l-60.5-21.1v-58.1zm246.2 0v58.1l-60.5 21.1v-58.1l60.5-21.1zM133.3 274l60.5 21.1v58.1l-60.5-21.1V274zm246.2 0V332l-60.5 21.1V295l60.5-21z"/></svg>`,
            color: '#0F52BA'
        },

        // Achievements - Trophy in gold with bronze/silver accents
        achievement: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <defs>
                    <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#D4AF37;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#CD7F32;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path fill="url(#trophyGradient)" d="M240.8 18l-10.4 51.5-51.5 10.4 10.4 51.5 51.5 10.4 10.4-51.5L303 80l-10.5-51.5L240.8 18zM118 79.42l-38.14 6.23L44.6 121.9l6.23 38.1 38.14 6.2 35.26-36.2-6.23-38.1-35.26-6.25L118 79.42zm276 0l-35.3 6.23-6.2 38.14 35.2 36.21 38.2-6.23 6.2-38.14-35.3-36.21-38.1 6.23 35.3-6.23zM256 110.7l-29.4 71.4-76.75 9.6 57.35 53.1-15.8 75.8L256 283.3l64.6 37.3-15.8-75.8 57.4-53.1-76.8-9.6-29.4-71.4zm-198.3 78.4L39.1 244.5l28.48 46.3 62.92-27.5-26.5-48.7-46.3-25.5zm340.6 0l-46.3 25.5-26.5 48.7 62.9 27.5 28.5-46.3-18.6-55.4zM256 315.8l-80 46.2v92.4l80-46.2 80 46.2V362l-80-46.2z"/>
            </svg>`,
            color: 'url(#trophyGradient)'
        },

        // === SOCIAL & COMMUNICATION ===

        // Chat - Crystal ball in mystic purple
        chat: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="ICON_COLOR" d="M256 32c-97.047 0-176 78.953-176 176 0 68.933 39.645 128.69 97.438 157.594-7.79 8.37-14.407 17.64-19.657 27.625C105.035 378.805 64 321.262 64 256 64 150.13 150.13 64 256 64s192 86.13 192 192c0 65.262-41.035 122.805-103.78 137.22-5.25-9.986-11.868-19.256-19.658-27.626C382.355 336.69 422 276.933 422 208c0-97.047-78.953-176-176-176zm0 80c-53.02 0-96 42.98-96 96 0 41.59 26.49 77.123 63.5 90.594-6.293 7.197-11.88 15.11-16.656 23.625-46.583-17.815-79.844-62.715-79.844-114.22 0-68.38 55.62-124 124-124s124 55.62 124 124c0 51.504-33.26 96.404-79.844 114.22-4.776-8.516-10.363-16.43-16.656-23.626C315.51 285.123 342 249.59 342 208c0-53.02-42.98-96-96-96zm-48 208c0-26.51 21.49-48 48-48s48 21.49 48 48v48H208v-48zm-48 80h192l-21.332 64H181.332L160 400z"/></svg>`,
            color: '#8B00FF'
        },

        // Login - Portal/lock in steel with gold keyhole
        login: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="#4682B4" d="M256 16c-53.02 0-96 42.98-96 96v32H64v320h384V144H352v-32c0-53.02-42.98-96-96-96zm0 32c35.348 0 64 28.652 64 64v32H192v-32c0-35.348 28.652-64 64-64zM96 176h320v256H96V176z"/>
                <path fill="#FFD700" d="M256 224c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80zm0 32c26.51 0 48 21.49 48 48s-21.49 48-48 48-48-21.49-48-48 21.49-48 48-48z"/>
            </svg>`,
            color: 'multi' // Special case with multiple colors
        },

        // Player/Referrals - Linked network in amethyst
        player: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="ICON_COLOR" d="M256 16c-35.468 0-64 28.532-64 64 0 26.51 16.145 49.195 39.188 59.063L200.03 280H105.97l-31.157-92.875C98.73 176.39 120 152.86 120 124c0-35.468-28.532-64-64-64S-8 88.532-8 124c0 28.86 21.27 52.39 48 62.125L71.875 280H16v32h56v77.875c-26.73 9.735-48 33.265-48 62.125 0 35.468 28.532 64 64 64s64-28.532 64-64c0-28.86-21.27-52.39-48-62.125V312h288v77.875c-26.73 9.735-48 33.265-48 62.125 0 35.468 28.532 64 64 64s64-28.532 64-64c0-28.86-21.27-52.39-48-62.125V312h56v-32h-55.875l31.875-93.875c26.73-9.735 48-33.265 48-62.125 0-35.468-28.532-64-64-64s-64 28.532-64 64c0 28.86 21.27 52.39 48 62.125L392 280h-94.063l-31.156-140.938C289.854 129.195 304 106.51 304 80c0-35.468-28.532-64-64-64zm0 32c17.674 0 32 14.326 32 32s-14.326 32-32 32-32-14.326-32-32 14.326-32 32-32zm-200 56c17.674 0 32 14.326 32 32s-14.326 32-32 32-32-14.326-32-32 14.326-32 32-32zm344 0c17.674 0 32 14.326 32 32s-14.326 32-32 32-32-14.326-32-32 14.326-32 32-32zM261.688 193.5L280.186 280h-48.372l18.5-86.5zM88 424c17.674 0 32 14.326 32 32s-14.326 32-32 32-32-14.326-32-32 14.326-32 32-32zm336 0c17.674 0 32 14.326 32 32s-14.326 32-32 32-32-14.326-32-32 14.326-32 32-32z"/></svg>`,
            color: '#9966CC'
        },

        // Leaderboard - Podium in gold/silver/bronze gradient
        leaderboard: {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <defs>
                    <linearGradient id="podiumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#CD7F32;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#FFD700;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#C0C0C0;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path fill="url(#podiumGradient)" d="M256 16L96 144v112h81v224h32V256h114v224h32V256h81V144L256 16zm-160 97.09v77.82l63.08-63.09zM256 55.62l126.63 115.1-116.54 116.53-10.09 10.1-10.09-10.1-116.54-116.53zM400 190.91l-63.09 63.09H400v-77.82zM133.22 274v208h37.56V274h-37.56zm102.89 0v208h39.78V274h-39.78zm102.89 0v208h39.78V274H339z"/>
            </svg>`,
            color: 'url(#podiumGradient)'
        },
    },

    /**
     * Render a colored icon as HTML
     * @param {string} iconName - Name of the icon
     * @param {object} options - Rendering options
     * @returns {string} HTML string
     */
    render(iconName, options = {}) {
        const {
            size = '1em',
            className = '',
            style = '',
            customColor = null
        } = options;

        const iconData = this.icons[iconName];

        if (!iconData) {
            // Fallback to question mark
            return `<span class="icon ${className}" style="font-size: ${size}; ${style}">❓</span>`;
        }

        let svg = iconData.svg;
        const color = customColor || iconData.color;

        // Replace ICON_COLOR placeholder with actual color
        if (svg.includes('ICON_COLOR')) {
            svg = svg.replace(/ICON_COLOR/g, color);
        }

        // Add size styling
        svg = svg.replace('<svg', `<svg style="width: ${size}; height: ${size};"`);

        return `<span class="icon ${className}" style="display: inline-flex; align-items: center; justify-content: center; width: ${size}; height: ${size}; ${style}">${svg}</span>`;
    },

    // Quick access properties
    get stamina() { return 'stamina'; },
    get gold() { return 'gold'; },
    get gems() { return 'gems'; },
    get exp() { return 'exp'; },
    get clock() { return 'clock'; },
    get level() { return 'level'; },
    get attack() { return 'attack'; },
    get defense() { return 'defense'; },
    get hp() { return 'hp'; },
    get stats() { return 'stats'; },
    get battle() { return 'battle'; },
    get menu() { return 'menu'; },
    get inventory() { return 'inventory'; },
    get merchant() { return 'merchant'; },
    get pets() { return 'pets'; },
    get blacksmith() { return 'blacksmith'; },
    get guild() { return 'guild'; },
    get achievement() { return 'achievement'; },
    get chat() { return 'chat'; },
    get login() { return 'login'; },
    get player() { return 'player'; },
    get leaderboard() { return 'leaderboard'; },
};

// Make globally available
window.ColoredThemeIcons = ColoredThemeIcons;
