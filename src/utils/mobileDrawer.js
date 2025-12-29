/**
 * Mobile Stats Drawer Controller
 * Neo-Medieval illuminated manuscript drawer for mobile
 */

class MobileDrawerController {
    constructor() {
        this.isOpen = false;
        this.drawer = null;
        this.overlay = null;
        this.trigger = null;
        this.isMobile = false;
    }

    init() {
        // Only run on mobile devices
        this.isMobile = window.innerWidth <= 768;

        if (!this.isMobile) {
            return;
        }

        this.createDrawerHTML();
        this.setupEventListeners();
        this.startDataSync();

        console.log('[MobileDrawer] Initialized');
    }

    createDrawerHTML() {
        // Create trigger button
        const trigger = document.createElement('button');
        trigger.className = 'mobile-codex-trigger';
        trigger.setAttribute('aria-label', 'Open stats drawer');
        document.body.appendChild(trigger);
        this.trigger = trigger;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-drawer-overlay';
        document.body.appendChild(overlay);
        this.overlay = overlay;

        // Create drawer
        const drawer = document.createElement('div');
        drawer.className = 'mobile-stats-drawer';
        drawer.innerHTML = `
            <div class="drawer-scroll-content">
                <!-- Corner decorations -->
                <div class="drawer-corner-decoration top-left"></div>
                <div class="drawer-corner-decoration top-right"></div>

                <!-- Header -->
                <div class="drawer-header">
                    <h2 class="drawer-title">⚔ Character Status ⚔</h2>
                </div>

                <!-- Resources Grid -->
                <div class="drawer-resources-grid">
                    <div class="drawer-resource-item">
                        <div class="drawer-resource-icon" id="drawer-stamina-icon">⚡</div>
                        <div class="drawer-resource-info">
                            <div class="drawer-resource-label">Stamina</div>
                            <div class="drawer-resource-value" id="drawer-stamina-value">100</div>
                        </div>
                    </div>
                    <div class="drawer-resource-item">
                        <div class="drawer-resource-icon" id="drawer-gold-icon">🪙</div>
                        <div class="drawer-resource-info">
                            <div class="drawer-resource-label">Gold</div>
                            <div class="drawer-resource-value" id="drawer-gold-value">1,000</div>
                        </div>
                    </div>
                    <div class="drawer-resource-item">
                        <div class="drawer-resource-icon" id="drawer-gems-icon">💎</div>
                        <div class="drawer-resource-info">
                            <div class="drawer-resource-label">Gems</div>
                            <div class="drawer-resource-value" id="drawer-gems-value">50</div>
                        </div>
                    </div>
                    <div class="drawer-resource-item">
                        <div class="drawer-resource-icon" id="drawer-time-icon">🕐</div>
                        <div class="drawer-resource-info">
                            <div class="drawer-resource-label">Server Time</div>
                            <div class="drawer-resource-value" id="drawer-server-time">12:00</div>
                        </div>
                    </div>
                </div>

                <!-- Player Progress -->
                <div class="drawer-player-progress">
                    <div class="drawer-level-row">
                        <div class="drawer-level-badge">
                            <span class="drawer-level-label">Level</span>
                            <span class="drawer-level-value" id="drawer-player-level">1</span>
                        </div>
                        <div class="drawer-exp-container">
                            <div class="drawer-exp-text">
                                <span class="drawer-exp-label">✨ Experience</span>
                                <span class="drawer-exp-values">
                                    <span id="drawer-current-exp">0</span> / <span id="drawer-max-exp">100</span>
                                </span>
                            </div>
                            <div class="drawer-exp-bar">
                                <div class="drawer-exp-bar-fill" id="drawer-exp-bar-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Close Handle -->
                <div class="drawer-close-handle">
                    <div>
                        <div class="drawer-handle-bar"></div>
                        <div class="drawer-close-text">Tap to close</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(drawer);
        this.drawer = drawer;

        // Initialize with colored icons if available
        if (window.ColoredThemeIcons) {
            document.getElementById('drawer-stamina-icon').innerHTML = ColoredThemeIcons.render('stamina');
            document.getElementById('drawer-gold-icon').innerHTML = ColoredThemeIcons.render('gold');
            document.getElementById('drawer-gems-icon').innerHTML = ColoredThemeIcons.render('gems');
            document.getElementById('drawer-time-icon').innerHTML = ColoredThemeIcons.render('clock');
        }
    }

    setupEventListeners() {
        // Trigger button opens drawer
        this.trigger.addEventListener('click', () => {
            this.open();
        });

        // Overlay closes drawer
        this.overlay.addEventListener('click', () => {
            this.close();
        });

        // Close handle closes drawer
        const closeHandle = this.drawer.querySelector('.drawer-close-handle');
        closeHandle.addEventListener('click', () => {
            this.close();
        });

        // Prevent drawer content clicks from closing
        this.drawer.querySelector('.drawer-scroll-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;

            if (wasMobile !== this.isMobile) {
                this.close();
            }
        });

        // ESC key closes drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    startDataSync() {
        // Sync data every second
        setInterval(() => {
            if (this.isMobile) {
                this.syncPlayerData();
            }
        }, 1000);

        // Initial sync
        this.syncPlayerData();
    }

    syncPlayerData() {
        if (!window.PlayerData) return;

        const player = PlayerData.get();

        // Update resources
        document.getElementById('drawer-stamina-value').textContent = player.stamina || '0';
        document.getElementById('drawer-gold-value').textContent = PlayerData.formatNumber(player.gold || 0);
        document.getElementById('drawer-gems-value').textContent = PlayerData.formatNumber(player.gems || 0);

        // Update level
        document.getElementById('drawer-player-level').textContent = player.level || '1';

        // Update XP
        const currentExp = player.exp || 0;
        const maxExp = player.exp_max || 100;
        const expPercent = (currentExp / maxExp) * 100;

        document.getElementById('drawer-current-exp').textContent = currentExp;
        document.getElementById('drawer-max-exp').textContent = maxExp;
        document.getElementById('drawer-exp-bar-fill').style.width = `${expPercent}%`;

        // Update server time
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        document.getElementById('drawer-server-time').textContent = `${hours}:${minutes}`;
    }

    open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.drawer.classList.add('open');
        this.overlay.classList.add('active');
        this.trigger.classList.add('drawer-open');

        // Sync data when opening
        this.syncPlayerData();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        console.log('[MobileDrawer] Opened');
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.drawer.classList.remove('open');
        this.overlay.classList.remove('active');
        this.trigger.classList.remove('drawer-open');

        // Restore body scroll
        document.body.style.overflow = '';

        console.log('[MobileDrawer] Closed');
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    destroy() {
        if (this.trigger) this.trigger.remove();
        if (this.overlay) this.overlay.remove();
        if (this.drawer) this.drawer.remove();

        console.log('[MobileDrawer] Destroyed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileDrawerController = new MobileDrawerController();
        window.mobileDrawerController.init();
    });
} else {
    window.mobileDrawerController = new MobileDrawerController();
    window.mobileDrawerController.init();
}
