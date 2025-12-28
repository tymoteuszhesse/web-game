/**
 * Authentication View Component
 * Handles login and registration UI
 */

function createAuthView() {
    const container = document.createElement('div');
    container.style.cssText = `
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background:
            radial-gradient(ellipse at top, rgba(88, 28, 135, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(20, 15, 30, 0.8) 0%, transparent 50%),
            var(--bg-primary);
        position: relative;
        overflow: hidden;
    `;

    // Animated background particles
    const particleLayer = document.createElement('div');
    particleLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
    `;

    // Create floating particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * -20;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: var(--gold);
            border-radius: 50%;
            opacity: ${Math.random() * 0.3 + 0.1};
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${duration}s infinite ease-in-out;
            animation-delay: ${delay}s;
        `;
        particleLayer.appendChild(particle);
    }
    container.appendChild(particleLayer);

    // Add keyframes for particle animation
    if (!document.querySelector('#auth-animations')) {
        const style = document.createElement('style');
        style.id = 'auth-animations';
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translate(0, 0) scale(1); }
                25% { transform: translate(10px, -15px) scale(1.1); }
                50% { transform: translate(-5px, -25px) scale(0.9); }
                75% { transform: translate(-15px, -10px) scale(1.05); }
            }
            @keyframes glow-pulse {
                0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3), 0 8px 32px rgba(0, 0, 0, 0.6); }
                50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.5), 0 8px 32px rgba(0, 0, 0, 0.6); }
            }
            @keyframes slide-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Check if already logged in
    if (apiClient.isAuthenticated()) {
        const welcomePanel = createWelcomePanel();
        container.appendChild(welcomePanel);
        return container;
    }

    // Main auth panel
    const authPanel = document.createElement('div');
    authPanel.style.cssText = `
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 480px;
        background:
            linear-gradient(135deg, rgba(20, 15, 30, 0.98) 0%, rgba(35, 25, 45, 0.98) 100%);
        border: 3px solid var(--gold);
        border-radius: 24px;
        padding: 48px 40px;
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.3), 0 8px 32px rgba(0, 0, 0, 0.6);
        animation: glow-pulse 3s infinite, slide-up 0.6s ease-out;
        backdrop-filter: blur(10px);
    `;

    // Decorative corner accents
    const cornerTL = document.createElement('div');
    cornerTL.style.cssText = `
        position: absolute;
        top: -2px;
        left: -2px;
        width: 60px;
        height: 60px;
        border-top: 5px solid rgba(212, 175, 55, 0.8);
        border-left: 5px solid rgba(212, 175, 55, 0.8);
        border-radius: 24px 0 0 0;
    `;
    authPanel.appendChild(cornerTL);

    const cornerBR = document.createElement('div');
    cornerBR.style.cssText = `
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 60px;
        height: 60px;
        border-bottom: 5px solid rgba(212, 175, 55, 0.8);
        border-right: 5px solid rgba(212, 175, 55, 0.8);
        border-radius: 0 0 24px 0;
    `;
    authPanel.appendChild(cornerBR);

    // Logo/Title
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 40px;';

    const logo = document.createElement('div');
    logo.style.cssText = `
        font-size: 4em;
        margin-bottom: 12px;
        filter: drop-shadow(0 4px 12px rgba(212, 175, 55, 0.6));
    `;
    logo.textContent = '⚔️';

    const title = document.createElement('h1');
    title.style.cssText = `
        font-size: 2.2em;
        font-weight: 800;
        color: var(--gold);
        text-transform: uppercase;
        letter-spacing: 3px;
        margin: 0 0 8px 0;
        text-shadow: 0 2px 12px rgba(212, 175, 55, 0.6);
    `;
    title.textContent = 'Fantasy RPG';

    const subtitle = document.createElement('div');
    subtitle.style.cssText = `
        font-size: 1em;
        color: var(--text-secondary);
        letter-spacing: 2px;
        text-transform: uppercase;
    `;
    subtitle.textContent = 'Enter the Realm';

    header.appendChild(logo);
    header.appendChild(title);
    header.appendChild(subtitle);
    authPanel.appendChild(header);

    // Tab state
    let currentTab = 'login';

    // Tab switcher
    const tabSwitcher = document.createElement('div');
    tabSwitcher.style.cssText = `
        display: flex;
        gap: 0;
        margin-bottom: 32px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: 4px;
        border: 2px solid rgba(255, 255, 255, 0.1);
    `;

    const loginTab = document.createElement('button');
    loginTab.textContent = 'Login';
    loginTab.style.cssText = `
        flex: 1;
        padding: 14px 24px;
        font-size: 1em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: linear-gradient(135deg, var(--gold) 0%, #ffd700 100%);
        color: #1a1520;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
    `;

    const registerTab = document.createElement('button');
    registerTab.textContent = 'Register';
    registerTab.style.cssText = `
        flex: 1;
        padding: 14px 24px;
        font-size: 1em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: transparent;
        color: var(--text-secondary);
    `;

    // Tab click handlers
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));

    tabSwitcher.appendChild(loginTab);
    tabSwitcher.appendChild(registerTab);
    authPanel.appendChild(tabSwitcher);

    // Content area
    const contentArea = document.createElement('div');
    contentArea.id = 'auth-content';
    authPanel.appendChild(contentArea);

    container.appendChild(authPanel);

    // Switch tab function
    function switchTab(tab) {
        currentTab = tab;

        if (tab === 'login') {
            loginTab.style.cssText = `
                flex: 1;
                padding: 14px 24px;
                font-size: 1em;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: linear-gradient(135deg, var(--gold) 0%, #ffd700 100%);
                color: #1a1520;
                box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
            `;
            registerTab.style.cssText = `
                flex: 1;
                padding: 14px 24px;
                font-size: 1em;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: transparent;
                color: var(--text-secondary);
            `;
        } else {
            registerTab.style.cssText = `
                flex: 1;
                padding: 14px 24px;
                font-size: 1em;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: linear-gradient(135deg, var(--gold) 0%, #ffd700 100%);
                color: #1a1520;
                box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
            `;
            loginTab.style.cssText = `
                flex: 1;
                padding: 14px 24px;
                font-size: 1em;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: transparent;
                color: var(--text-secondary);
            `;
        }

        renderContent();
    }

    // Render content
    function renderContent() {
        contentArea.innerHTML = '';

        if (currentTab === 'login') {
            contentArea.appendChild(createLoginForm());
        } else {
            contentArea.appendChild(createRegisterForm());
        }
    }

    // Create login form
    function createLoginForm() {
        const form = document.createElement('form');
        form.style.cssText = 'display: flex; flex-direction: column; gap: 24px;';

        // Email input group
        const emailGroup = document.createElement('div');
        emailGroup.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'EMAIL ADDRESS';
        emailLabel.style.cssText = `
            color: var(--text-secondary);
            font-weight: 700;
            font-size: 0.85em;
            letter-spacing: 1px;
            text-transform: uppercase;
        `;

        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.placeholder = 'your.email@example.com';
        emailInput.required = true;
        emailInput.style.cssText = `
            padding: 16px 18px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 1em;
            transition: all 0.3s ease;
            outline: none;
        `;

        emailInput.addEventListener('focus', () => {
            emailInput.style.borderColor = 'var(--gold)';
            emailInput.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
        });

        emailInput.addEventListener('blur', () => {
            emailInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            emailInput.style.boxShadow = 'none';
        });

        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);

        // Password input group
        const passwordGroup = document.createElement('div');
        passwordGroup.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'PASSWORD';
        passwordLabel.style.cssText = `
            color: var(--text-secondary);
            font-weight: 700;
            font-size: 0.85em;
            letter-spacing: 1px;
            text-transform: uppercase;
        `;

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = '••••••••';
        passwordInput.required = true;
        passwordInput.style.cssText = `
            padding: 16px 18px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 1em;
            transition: all 0.3s ease;
            outline: none;
        `;

        passwordInput.addEventListener('focus', () => {
            passwordInput.style.borderColor = 'var(--gold)';
            passwordInput.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
        });

        passwordInput.addEventListener('blur', () => {
            passwordInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            passwordInput.style.boxShadow = 'none';
        });

        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'ENTER REALM';
        submitBtn.style.cssText = `
            padding: 18px 32px;
            font-size: 1.1em;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, var(--gold) 0%, #ffd700 100%);
            color: #1a1520;
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
            margin-top: 8px;
        `;

        submitBtn.addEventListener('mouseenter', () => {
            submitBtn.style.transform = 'translateY(-2px)';
            submitBtn.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.6)';
        });

        submitBtn.addEventListener('mouseleave', () => {
            submitBtn.style.transform = 'translateY(0)';
            submitBtn.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)';
        });

        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                NotificationSystem.show('Please fill in all fields', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'ENTERING...';
            submitBtn.style.opacity = '0.7';

            try {
                await apiClient.login(email, password);

                // Fetch fresh player data from backend
                const playerData = await apiClient.getPlayerInfo();

                // Store in gameState
                gameState.set('player', playerData);

                // Update UI with fresh data
                if (typeof PlayerData !== 'undefined' && PlayerData.updateUI) {
                    PlayerData.updateUI();
                }

                NotificationSystem.show('Login successful! Welcome back!', 'success');

                setTimeout(() => {
                    router.navigate('dashboard');
                }, 1000);
            } catch (error) {
                console.error('[AuthView] Login error:', error);
                NotificationSystem.show(error.message || 'Login failed', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'ENTER REALM';
                submitBtn.style.opacity = '1';
            }
        });

        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        form.appendChild(submitBtn);

        // Demo info
        const demoInfo = document.createElement('div');
        demoInfo.style.cssText = `
            margin-top: 20px;
            padding: 16px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(212, 175, 55, 0.2);
            border-radius: 12px;
            font-size: 0.9em;
            color: var(--text-secondary);
            text-align: center;
        `;
        demoInfo.innerHTML = `
            <div style="color: var(--gold); font-weight: bold; margin-bottom: 8px;">New Player?</div>
            <div>Create an account using the Register tab to begin your adventure!</div>
        `;
        form.appendChild(demoInfo);

        return form;
    }

    // Create register form
    function createRegisterForm() {
        const form = document.createElement('form');
        form.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

        // Username input
        const usernameGroup = document.createElement('div');
        usernameGroup.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'USERNAME';
        usernameLabel.style.cssText = `
            color: var(--text-secondary);
            font-weight: 700;
            font-size: 0.85em;
            letter-spacing: 1px;
            text-transform: uppercase;
        `;

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.placeholder = 'Choose your hero name';
        usernameInput.required = true;
        usernameInput.maxLength = 20;
        usernameInput.style.cssText = `
            padding: 16px 18px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 1em;
            transition: all 0.3s ease;
            outline: none;
        `;

        usernameInput.addEventListener('focus', () => {
            usernameInput.style.borderColor = 'var(--gold)';
            usernameInput.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
        });

        usernameInput.addEventListener('blur', () => {
            usernameInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            usernameInput.style.boxShadow = 'none';
        });

        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);

        // Email input
        const emailGroup = document.createElement('div');
        emailGroup.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'EMAIL ADDRESS';
        emailLabel.style.cssText = `
            color: var(--text-secondary);
            font-weight: 700;
            font-size: 0.85em;
            letter-spacing: 1px;
            text-transform: uppercase;
        `;

        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.placeholder = 'your.email@example.com';
        emailInput.required = true;
        emailInput.style.cssText = `
            padding: 16px 18px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 1em;
            transition: all 0.3s ease;
            outline: none;
        `;

        emailInput.addEventListener('focus', () => {
            emailInput.style.borderColor = 'var(--gold)';
            emailInput.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
        });

        emailInput.addEventListener('blur', () => {
            emailInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            emailInput.style.boxShadow = 'none';
        });

        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);

        // Password input
        const passwordGroup = document.createElement('div');
        passwordGroup.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'PASSWORD';
        passwordLabel.style.cssText = `
            color: var(--text-secondary);
            font-weight: 700;
            font-size: 0.85em;
            letter-spacing: 1px;
            text-transform: uppercase;
        `;

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = '••••••••';
        passwordInput.required = true;
        passwordInput.minLength = 8;
        passwordInput.style.cssText = `
            padding: 16px 18px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 1em;
            transition: all 0.3s ease;
            outline: none;
        `;

        passwordInput.addEventListener('focus', () => {
            passwordInput.style.borderColor = 'var(--gold)';
            passwordInput.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
        });

        passwordInput.addEventListener('blur', () => {
            passwordInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            passwordInput.style.boxShadow = 'none';
        });

        const passwordHint = document.createElement('div');
        passwordHint.style.cssText = 'font-size: 0.85em; color: var(--text-secondary); margin-top: -4px;';
        passwordHint.textContent = 'Minimum 8 characters';

        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);
        passwordGroup.appendChild(passwordHint);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'BEGIN ADVENTURE';
        submitBtn.style.cssText = `
            padding: 18px 32px;
            font-size: 1.1em;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, var(--gold) 0%, #ffd700 100%);
            color: #1a1520;
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
            margin-top: 8px;
        `;

        submitBtn.addEventListener('mouseenter', () => {
            submitBtn.style.transform = 'translateY(-2px)';
            submitBtn.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.6)';
        });

        submitBtn.addEventListener('mouseleave', () => {
            submitBtn.style.transform = 'translateY(0)';
            submitBtn.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)';
        });

        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!username || !email || !password) {
                NotificationSystem.show('Please fill in all fields', 'error');
                return;
            }

            if (username.length > 20) {
                NotificationSystem.show('Username must be 20 characters or less', 'error');
                return;
            }

            if (password.length < 8) {
                NotificationSystem.show('Password must be at least 8 characters', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'CREATING...';
            submitBtn.style.opacity = '0.7';

            try {
                await apiClient.register(email, password, username);

                // Fetch fresh player data from backend
                const playerData = await apiClient.getPlayerInfo();

                // Store in gameState
                gameState.set('player', playerData);

                // Update UI with fresh data
                if (typeof PlayerData !== 'undefined' && PlayerData.updateUI) {
                    PlayerData.updateUI();
                }

                NotificationSystem.show('Account created successfully! Welcome!', 'success');

                setTimeout(() => {
                    router.navigate('dashboard');
                }, 1000);
            } catch (error) {
                NotificationSystem.show(error.message || 'Registration failed', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'BEGIN ADVENTURE';
                submitBtn.style.opacity = '1';
            }
        });

        form.appendChild(usernameGroup);
        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        form.appendChild(submitBtn);

        return form;
    }

    // Initial render
    renderContent();

    return container;
}

// Create welcome panel for logged-in users
function createWelcomePanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 520px;
        background:
            linear-gradient(135deg, rgba(20, 15, 30, 0.98) 0%, rgba(35, 25, 45, 0.98) 100%);
        border: 3px solid var(--gold);
        border-radius: 24px;
        padding: 48px 40px;
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.3), 0 8px 32px rgba(0, 0, 0, 0.6);
        animation: slide-up 0.6s ease-out;
        text-align: center;
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
        font-size: 5em;
        margin-bottom: 20px;
        filter: drop-shadow(0 4px 12px rgba(212, 175, 55, 0.6));
    `;
    icon.textContent = '👑';

    const title = document.createElement('h2');
    title.style.cssText = `
        font-size: 2.2em;
        font-weight: 800;
        color: var(--gold);
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 0 0 16px 0;
        text-shadow: 0 2px 12px rgba(212, 175, 55, 0.6);
    `;
    title.textContent = 'Welcome Back!';

    const message = document.createElement('p');
    message.style.cssText = `
        font-size: 1.1em;
        color: var(--text-secondary);
        margin: 0 0 32px 0;
        line-height: 1.6;
    `;
    message.textContent = 'You are already logged in and ready for adventure.';

    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;';

    const dashboardBtn = document.createElement('button');
    dashboardBtn.textContent = 'GO TO DASHBOARD';
    dashboardBtn.style.cssText = `
        padding: 16px 28px;
        font-size: 1em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: linear-gradient(135deg, var(--gold) 0%, #ffd700 100%);
        color: #1a1520;
        box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
    `;

    dashboardBtn.addEventListener('mouseenter', () => {
        dashboardBtn.style.transform = 'translateY(-2px)';
        dashboardBtn.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.6)';
    });

    dashboardBtn.addEventListener('mouseleave', () => {
        dashboardBtn.style.transform = 'translateY(0)';
        dashboardBtn.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)';
    });

    dashboardBtn.addEventListener('click', () => router.navigate('dashboard'));

    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'LOGOUT';
    logoutBtn.style.cssText = `
        padding: 16px 28px;
        font-size: 1em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        border: 2px solid rgba(239, 68, 68, 0.6);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: transparent;
        color: #ef4444;
    `;

    logoutBtn.addEventListener('mouseenter', () => {
        logoutBtn.style.background = 'rgba(239, 68, 68, 0.1)';
        logoutBtn.style.borderColor = '#ef4444';
    });

    logoutBtn.addEventListener('mouseleave', () => {
        logoutBtn.style.background = 'transparent';
        logoutBtn.style.borderColor = 'rgba(239, 68, 68, 0.6)';
    });

    logoutBtn.addEventListener('click', () => {
        apiClient.logout();
        NotificationSystem.show('Logged out successfully', 'success');
        router.navigate('auth');
    });

    buttonGroup.appendChild(dashboardBtn);
    buttonGroup.appendChild(logoutBtn);

    panel.appendChild(icon);
    panel.appendChild(title);
    panel.appendChild(message);
    panel.appendChild(buttonGroup);

    return panel;
}

// Make it globally available
window.createAuthView = createAuthView;
