/**
 * Simple Router for Single Page Application
 */

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.viewContainer = null;

        // Initialize on DOM load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.viewContainer = document.getElementById('view-container');

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const route = e.state?.route || window.location.hash.slice(1) || 'dashboard';
            this.navigate(route, false);
        });

        // Defer initial navigation until routes are registered
        // Keep the encoded hash as-is
        this.initialRoute = window.location.hash.slice(1) || 'dashboard';
    }

    /**
     * Start the router (call after all routes are registered)
     */
    start() {
        if (this.initialRoute) {
            this.navigate(this.initialRoute, true);
            this.initialRoute = null;
        }
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., 'dashboard', 'inventory')
     * @param {Function} handler - Function that returns HTML string or DOM element
     */
    register(path, handler) {
        this.routes[path] = handler;
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path
     * @param {boolean} pushState - Whether to push state to history
     */
    navigate(path, pushState = true) {
        // Store original path for URL
        const originalPath = path;

        // Try to decode the path, but handle already-decoded paths gracefully
        let decodedPath;
        try {
            decodedPath = decodeURIComponent(path);
        } catch (e) {
            // If decoding fails, path is probably already decoded
            decodedPath = path;
        }

        // Separate route path from query parameters
        const [routePath, queryString] = decodedPath.split('?');

        // Try to match parameterized routes
        let handler = this.routes[routePath];
        let params = {};

        if (!handler) {
            // Check for parameterized routes (e.g., battle/:enemyId)
            for (const registeredRoute in this.routes) {
                if (registeredRoute.includes(':')) {
                    const routeParts = registeredRoute.split('/');
                    const pathParts = routePath.split('/');

                    if (routeParts.length === pathParts.length) {
                        let match = true;
                        const extractedParams = {};

                        for (let i = 0; i < routeParts.length; i++) {
                            if (routeParts[i].startsWith(':')) {
                                // This is a parameter (already decoded)
                                const paramName = routeParts[i].slice(1);
                                extractedParams[paramName] = pathParts[i];
                            } else if (routeParts[i] !== pathParts[i]) {
                                match = false;
                                break;
                            }
                        }

                        if (match) {
                            handler = this.routes[registeredRoute];
                            params = extractedParams;
                            break;
                        }
                    }
                }
            }
        }

        if (!handler) {
            console.error(`Route not found: ${routePath}`);
            // Redirect to dashboard
            this.currentRoute = 'dashboard';
            this.currentParams = {};
            handler = this.routes['dashboard'];
            params = {};

            // Update URL to dashboard
            if (pushState) {
                window.history.pushState({ route: 'dashboard' }, '', '#dashboard');
            }
            window.location.hash = 'dashboard';
        } else {
            // Route found - store current route and update URL with original path
            this.currentRoute = routePath;
            this.currentParams = params;

            // Update URL with original (possibly encoded) path
            if (pushState) {
                window.history.pushState({ route: originalPath }, '', `#${originalPath}`);
            }
            window.location.hash = originalPath;
        }

        // Render the view
        this.render(handler, params);
    }

    /**
     * Render the current route
     * @param {Function} handler - Route handler function
     * @param {Object} params - Route parameters
     */
    async render(handler, params = {}) {
        if (!this.viewContainer) {
            console.error('View container not found');
            return;
        }

        const content = await handler(params);

        // Clear previous content
        this.viewContainer.innerHTML = '';

        // Render new content
        if (typeof content === 'string') {
            this.viewContainer.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.viewContainer.appendChild(content);
        }

        // Update body class for dashboard background
        if (this.currentRoute === 'dashboard') {
            document.body.classList.add('dashboard-view');
        } else {
            document.body.classList.remove('dashboard-view');
        }

        // Scroll to top
        window.scrollTo(0, 0);

        // Trigger custom event for route change
        window.dispatchEvent(new CustomEvent('routechange', { detail: { route: this.currentRoute } }));
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Go back to previous route
     */
    back() {
        window.history.back();
    }
}

// Create global router instance
const router = new Router();

/**
 * Helper function to create navigation links
 * @param {string} path - Route path
 * @param {string} text - Link text
 * @param {string} className - Optional CSS class
 */
function createNavLink(path, text, className = '') {
    const link = document.createElement('a');
    link.href = `#${path}`;
    link.textContent = text;
    link.className = className;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate(path);
    });
    return link;
}

/**
 * Helper function to create back button
 * @param {string} text - Button text (default: "← Back to Dashboard")
 * @param {string} route - Route to navigate to (default: "dashboard")
 */
function createBackButton(text = '← Back to Dashboard', route = 'dashboard') {
    const btn = document.createElement('a');
    btn.href = `#${route}`;
    btn.className = 'back-button';
    btn.textContent = text;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate(route);
    });
    return btn;
}
