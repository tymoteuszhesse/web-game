/**
 * Mobile Header Smart Scroll Behavior
 * Auto-hides header on scroll down, shows on scroll up
 * Compact mode for better space utilization
 */

class MobileHeaderController {
    constructor() {
        this.header = null;
        this.lastScrollY = 0;
        this.scrollThreshold = 10; // Minimum scroll distance to trigger
        this.hideThreshold = 100; // Scroll distance before hiding
        this.isCompact = false;
        this.isHidden = false;
        this.isMobile = false;
        this.rafId = null;
        this.scrollTimeout = null;
    }

    init() {
        // Only run on mobile devices
        this.isMobile = window.innerWidth <= 768;

        if (!this.isMobile) {
            return;
        }

        this.header = document.querySelector('.game-header');

        if (!this.header) {
            console.warn('[MobileHeader] Header element not found');
            return;
        }

        this.setupScrollListener();
        this.setupResizeListener();

        console.log('[MobileHeader] Initialized');
    }

    setupScrollListener() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    setupResizeListener() {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth <= 768;

                // Reset header state if switching between mobile/desktop
                if (wasMobile !== this.isMobile) {
                    this.resetHeader();
                }
            }, 250);
        });
    }

    handleScroll() {
        if (!this.isMobile || !this.header) {
            return;
        }

        const currentScrollY = window.scrollY;
        const scrollDiff = currentScrollY - this.lastScrollY;

        // Skip if scroll is too small
        if (Math.abs(scrollDiff) < this.scrollThreshold) {
            return;
        }

        // Compact mode when scrolled past 50px
        if (currentScrollY > 50 && !this.isCompact) {
            this.setCompact(true);
        } else if (currentScrollY <= 50 && this.isCompact) {
            this.setCompact(false);
        }

        // Hide/show logic
        if (scrollDiff > 0) {
            // Scrolling down
            if (currentScrollY > this.hideThreshold && !this.isHidden) {
                this.hide();
            }
        } else {
            // Scrolling up
            if (this.isHidden) {
                this.show();
            }
        }

        this.lastScrollY = currentScrollY;
    }

    setCompact(compact) {
        if (this.isCompact === compact) return;

        this.isCompact = compact;

        if (compact) {
            this.header.classList.add('compact');
        } else {
            this.header.classList.remove('compact');
        }
    }

    hide() {
        if (this.isHidden) return;

        this.isHidden = true;
        this.header.classList.add('hidden');
        this.header.classList.remove('visible');
    }

    show() {
        if (!this.isHidden) return;

        this.isHidden = false;
        this.header.classList.remove('hidden');
        this.header.classList.add('visible');
    }

    resetHeader() {
        if (!this.header) return;

        this.header.classList.remove('compact', 'hidden', 'visible');
        this.isCompact = false;
        this.isHidden = false;
        this.lastScrollY = 0;
    }

    destroy() {
        this.resetHeader();
        // Event listeners will be garbage collected
        console.log('[MobileHeader] Destroyed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileHeaderController = new MobileHeaderController();
        window.mobileHeaderController.init();
    });
} else {
    window.mobileHeaderController = new MobileHeaderController();
    window.mobileHeaderController.init();
}

// Re-initialize on route changes (for SPA behavior)
window.addEventListener('hashchange', () => {
    if (window.mobileHeaderController) {
        window.mobileHeaderController.resetHeader();
    }
});
