/**
 * Reusable UI Components
 */

// === Card Component ===
function createCard(options = {}) {
    const {
        title = '',
        body = '',
        footer = null,
        className = '',
        legendary = false,
        onClick = null
    } = options;

    const card = document.createElement('div');
    card.className = `card ${legendary ? 'card-legendary' : ''} ${className}`;

    if (onClick) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', onClick);
    }

    // Header
    if (title) {
        const header = document.createElement('div');
        header.className = 'card-header';

        const titleEl = document.createElement('h3');
        titleEl.className = 'card-title';
        titleEl.textContent = title;

        header.appendChild(titleEl);
        card.appendChild(header);
    }

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'card-body';

    if (typeof body === 'string') {
        bodyEl.innerHTML = body;
    } else if (body instanceof HTMLElement) {
        bodyEl.appendChild(body);
    }

    card.appendChild(bodyEl);

    // Footer
    if (footer) {
        const footerEl = document.createElement('div');
        footerEl.className = 'card-footer';

        if (typeof footer === 'string') {
            footerEl.innerHTML = footer;
        } else if (footer instanceof HTMLElement) {
            footerEl.appendChild(footer);
        } else if (Array.isArray(footer)) {
            footer.forEach(el => footerEl.appendChild(el));
        }

        card.appendChild(footerEl);
    }

    return card;
}

// === Button Component ===
function createButton(options = {}) {
    const {
        text = 'Button',
        variant = 'primary', // primary, success, danger, gold, secondary
        onClick = null,
        disabled = false,
        className = ''
    } = options;

    const button = document.createElement('button');
    button.className = `btn btn-${variant} ${className}`;
    button.textContent = text;
    button.disabled = disabled;

    if (onClick) {
        button.addEventListener('click', onClick);
    }

    return button;
}

// === Progress Bar Component ===
function createProgressBar(options = {}) {
    const {
        current = 0,
        max = 100,
        type = '', // hp, exp
        showText = true,
        className = ''
    } = options;

    const percentage = Math.min(100, Math.max(0, (current / max) * 100));

    const container = document.createElement('div');
    container.className = `progress-bar ${type ? `progress-bar-${type}` : ''} ${className}`;

    const fill = document.createElement('div');
    fill.className = 'progress-bar-fill';
    fill.style.width = `${percentage}%`;

    if (showText) {
        const text = document.createElement('span');
        text.className = 'progress-bar-text';
        text.textContent = `${current} / ${max} (${percentage.toFixed(1)}%)`;
        container.appendChild(text);
    }

    container.appendChild(fill);

    // Add update method
    container.update = function(newCurrent, newMax) {
        const newPercentage = Math.min(100, Math.max(0, (newCurrent / newMax) * 100));
        fill.style.width = `${newPercentage}%`;
        if (showText) {
            container.querySelector('.progress-bar-text').textContent =
                `${newCurrent} / ${newMax} (${newPercentage.toFixed(1)}%)`;
        }
    };

    return container;
}

// === Modal Component ===
function createModal(options = {}) {
    const {
        title = 'Modal',
        body = '',
        footer = null,
        onClose = null
    } = options;

    const modal = document.createElement('div');
    modal.className = 'modal';

    const content = document.createElement('div');
    content.className = 'modal-content';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        modal.close();
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    content.appendChild(header);

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'modal-body';

    if (typeof body === 'string') {
        bodyEl.innerHTML = body;
    } else if (body instanceof HTMLElement) {
        bodyEl.appendChild(body);
    }

    content.appendChild(bodyEl);

    // Footer
    if (footer) {
        const footerEl = document.createElement('div');
        footerEl.className = 'modal-footer';

        if (Array.isArray(footer)) {
            footer.forEach(el => footerEl.appendChild(el));
        } else {
            footerEl.appendChild(footer);
        }

        content.appendChild(footerEl);
    }

    modal.appendChild(content);

    // Methods
    modal.show = function() {
        modal.classList.add('active');
        document.body.appendChild(modal);
    };

    modal.close = function() {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
        if (onClose) onClose();
    };

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.close();
        }
    });

    return modal;
}

// === Badge Component ===
function createBadge(text, variant = 'common') {
    const badge = document.createElement('span');
    badge.className = `badge badge-${variant}`;
    badge.textContent = text;
    return badge;
}

// === Section Header Component ===
function createSectionHeader(icon, title) {
    const header = document.createElement('div');
    header.className = 'section-header';

    const iconEl = document.createElement('span');
    iconEl.className = 'section-icon';
    iconEl.innerHTML = icon; // Changed from textContent to innerHTML to render HTML

    const titleEl = document.createElement('h1');
    titleEl.className = 'section-title';
    titleEl.textContent = title;

    header.appendChild(iconEl);
    header.appendChild(titleEl);

    return header;
}

// === Grid Component ===
function createGrid(columns = 3, items = []) {
    const grid = document.createElement('div');
    grid.className = `grid grid-${columns}`;

    items.forEach(item => {
        grid.appendChild(item);
    });

    return grid;
}

// === Notification System ===
const NotificationSystem = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 2000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const notification = document.createElement('div');
        notification.style.cssText = `
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            min-width: 250px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
            background: ${this.getColor(type)};
        `;
        notification.textContent = message;

        this.container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },

    getColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        return colors[type] || colors.info;
    }
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
