/**
 * Global Chat Component
 * Real-time chat system with tavern-inspired aesthetic
 */

async function createChatView() {
    const container = document.createElement('div');
    container.appendChild(createBackButton());

    // Tavern Chat Header - Ornate wooden sign aesthetic
    const header = document.createElement('div');
    header.style.cssText = `
        position: relative;
        background:
            linear-gradient(135deg, #2c1810 0%, #1a0f08 100%);
        border: 3px solid #8b6f47;
        border-radius: 16px 16px 4px 4px;
        padding: 32px 24px 24px;
        margin-bottom: 0;
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(139, 111, 71, 0.5);
        overflow: hidden;
    `;

    // Wood grain texture overlay
    const woodGrain = document.createElement('div');
    woodGrain.style.cssText = `
        position: absolute;
        inset: 0;
        background-image:
            repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.03) 2px,
                rgba(0, 0, 0, 0.03) 4px
            ),
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 4px,
                rgba(0, 0, 0, 0.05) 4px,
                rgba(0, 0, 0, 0.05) 8px
            );
        opacity: 0.3;
        pointer-events: none;
    `;
    header.appendChild(woodGrain);

    // Decorative corner brackets
    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(position => {
        const bracket = document.createElement('div');
        const [vPos, hPos] = position.split('-');
        bracket.style.cssText = `
            position: absolute;
            ${vPos}: 8px;
            ${hPos}: 8px;
            width: 24px;
            height: 24px;
            border-${vPos}: 3px solid #d4af37;
            border-${hPos}: 3px solid #d4af37;
            opacity: 0.6;
        `;
        header.appendChild(bracket);
    });

    const headerContent = document.createElement('div');
    headerContent.style.cssText = 'position: relative; z-index: 1; text-align: center;';
    headerContent.innerHTML = `
        <div style="
            font-size: 2.5em;
            margin-bottom: 8px;
            filter: drop-shadow(0 4px 8px rgba(212, 175, 55, 0.4));
        ">🍺</div>
        <h1 style="
            font-family: 'Cinzel', 'Georgia', serif;
            font-size: 2.2em;
            font-weight: 700;
            color: #d4af37;
            margin: 0 0 8px 0;
            text-shadow:
                2px 2px 0 rgba(0, 0, 0, 0.8),
                0 0 20px rgba(212, 175, 55, 0.5);
            letter-spacing: 2px;
        ">The Tavern</h1>
        <p style="
            font-family: 'Crimson Text', 'Georgia', serif;
            font-size: 1.1em;
            font-style: italic;
            color: #c9b896;
            margin: 0;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        ">"Where adventurers gather to share tales and secrets"</p>
    `;
    header.appendChild(headerContent);
    container.appendChild(header);

    // Main chat container - Parchment scroll aesthetic
    const chatWrapper = document.createElement('div');
    chatWrapper.style.cssText = `
        background: linear-gradient(135deg, #f4e4c1 0%, #e8d5a8 100%);
        border: 3px solid #8b6f47;
        border-top: none;
        border-radius: 0 0 16px 16px;
        padding: 0;
        box-shadow:
            inset 0 4px 12px rgba(0, 0, 0, 0.15),
            0 8px 24px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
    `;

    // Parchment texture
    const parchmentTexture = document.createElement('div');
    parchmentTexture.style.cssText = `
        position: absolute;
        inset: 0;
        background-image:
            radial-gradient(circle at 20% 30%, rgba(205, 180, 140, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 60%, rgba(139, 111, 71, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, rgba(160, 130, 90, 0.06) 1px, transparent 1px);
        background-size: 40px 40px, 60px 60px, 50px 50px;
        opacity: 0.5;
        pointer-events: none;
        z-index: 0;
    `;
    chatWrapper.appendChild(parchmentTexture);

    const chatContainer = document.createElement('div');
    chatContainer.style.cssText = `
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        height: 600px;
    `;

    // Online players indicator
    const onlineIndicator = document.createElement('div');
    onlineIndicator.style.cssText = `
        padding: 16px 24px;
        background: rgba(44, 24, 16, 0.4);
        border-bottom: 2px solid rgba(139, 111, 71, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    onlineIndicator.innerHTML = `
        <div style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 12px #22c55e;
            animation: pulse 2s ease-in-out infinite;
        "></div>
        <span style="
            font-family: 'Crimson Text', 'Georgia', serif;
            font-size: 1em;
            color: #5a4a3a;
            font-weight: 600;
        ">
            <span id="online-count">0</span> adventurers present
        </span>
    `;
    chatContainer.appendChild(onlineIndicator);

    // Messages area - Scroll container
    const messagesArea = document.createElement('div');
    messagesArea.id = 'chat-messages';
    messagesArea.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    `;
    chatContainer.appendChild(messagesArea);

    // Input area - Quill and ink aesthetic
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
        padding: 20px 24px;
        background:
            linear-gradient(180deg, rgba(44, 24, 16, 0.15) 0%, rgba(44, 24, 16, 0.25) 100%);
        border-top: 2px solid rgba(139, 111, 71, 0.4);
    `;

    const inputForm = document.createElement('form');
    inputForm.id = 'chat-form';
    inputForm.style.cssText = `
        display: flex;
        gap: 12px;
        align-items: flex-end;
    `;

    const inputWrapper = document.createElement('div');
    inputWrapper.style.cssText = 'flex: 1; position: relative;';

    const messageInput = document.createElement('textarea');
    messageInput.id = 'chat-input';
    messageInput.placeholder = 'Inscribe your message...';
    messageInput.rows = 1;
    messageInput.style.cssText = `
        width: 100%;
        padding: 14px 16px;
        border: 2px solid #8b6f47;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        color: #2c1810;
        font-family: 'Crimson Text', 'Georgia', serif;
        font-size: 1.05em;
        resize: none;
        max-height: 120px;
        box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    `;

    // Auto-resize textarea
    messageInput.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });

    messageInput.addEventListener('focus', () => {
        messageInput.style.borderColor = '#d4af37';
        messageInput.style.boxShadow = `
            inset 0 2px 4px rgba(0, 0, 0, 0.1),
            0 0 0 3px rgba(212, 175, 55, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.1)
        `;
    });

    messageInput.addEventListener('blur', () => {
        messageInput.style.borderColor = '#8b6f47';
        messageInput.style.boxShadow = `
            inset 0 2px 4px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.1)
        `;
    });

    inputWrapper.appendChild(messageInput);

    const sendButton = document.createElement('button');
    sendButton.type = 'submit';
    sendButton.style.cssText = `
        padding: 14px 28px;
        background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
        color: #2c1810;
        border: 2px solid #b8941f;
        border-radius: 8px;
        font-family: 'Cinzel', 'Georgia', serif;
        font-size: 1em;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        letter-spacing: 0.5px;
        white-space: nowrap;
    `;
    sendButton.innerHTML = '✒️ Send';

    sendButton.addEventListener('mouseenter', () => {
        sendButton.style.transform = 'translateY(-2px)';
        sendButton.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.5)';
    });

    sendButton.addEventListener('mouseleave', () => {
        sendButton.style.transform = 'translateY(0)';
        sendButton.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
    });

    inputForm.appendChild(inputWrapper);
    inputForm.appendChild(sendButton);
    inputArea.appendChild(inputForm);
    chatContainer.appendChild(inputArea);

    chatWrapper.appendChild(chatContainer);
    container.appendChild(chatWrapper);

    // Initialize chat functionality
    initializeChat(messagesArea, messageInput, inputForm);

    return container;
}

/**
 * Initialize chat WebSocket connection and handlers
 */
function initializeChat(messagesArea, messageInput, inputForm) {
    const messages = [];
    let ws = null;
    let currentUserId = null;

    // Get current user ID from token
    const token = apiClient.getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.sub;
        } catch (e) {
            console.error('Failed to decode token:', e);
        }
    }

    // Create message element
    function createMessageElement(message) {
        const messageEl = document.createElement('div');

        // Handle system messages differently
        if (message.type === 'system') {
            messageEl.style.cssText = `
                text-align: center;
                padding: 8px 16px;
                background: rgba(212, 175, 55, 0.15);
                border-radius: 8px;
                font-family: 'Crimson Text', 'Georgia', serif;
                font-size: 0.95em;
                font-style: italic;
                color: #5a4a3a;
                animation: messageAppear 0.3s ease-out;
            `;
            // CRITICAL FIX: Support both 'text' and 'message' properties for system messages
            messageEl.textContent = message.text || message.message || 'System message';
            return messageEl;
        }

        const isOwnMessage = message.userId === currentUserId;

        messageEl.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
            animation: messageAppear 0.3s ease-out;
            ${isOwnMessage ? 'align-items: flex-end;' : 'align-items: flex-start;'}
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            ${isOwnMessage ? 'flex-direction: row-reverse;' : ''}
        `;

        // User avatar
        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
            border: 2px solid #8b6f47;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        `;
        avatar.textContent = message.username.charAt(0).toUpperCase();
        header.appendChild(avatar);

        const userInfo = document.createElement('div');
        userInfo.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
        `;

        const username = document.createElement('div');
        username.style.cssText = `
            font-family: 'Cinzel', 'Georgia', serif;
            font-size: 0.95em;
            font-weight: 600;
            color: #5a4a3a;
        `;
        username.textContent = message.username;

        const timestamp = document.createElement('div');
        timestamp.style.cssText = `
            font-size: 0.75em;
            color: #8b7355;
            font-style: italic;
        `;
        timestamp.textContent = formatTimestamp(message.timestamp);

        userInfo.appendChild(username);
        userInfo.appendChild(timestamp);
        header.appendChild(userInfo);

        messageEl.appendChild(header);

        // Message bubble
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 12px;
            ${isOwnMessage ? `
                background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
                color: #2c1810;
                border: 2px solid #b8941f;
            ` : `
                background: rgba(255, 255, 255, 0.8);
                color: #2c1810;
                border: 2px solid #d4c4a8;
            `}
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            font-family: 'Crimson Text', 'Georgia', serif;
            font-size: 1.05em;
            line-height: 1.5;
            word-wrap: break-word;
        `;
        bubble.textContent = message.text || message.message;
        messageEl.appendChild(bubble);

        return messageEl;
    }

    // Format timestamp - use current browser time (same as server time in header)
    function formatTimestamp(timestamp) {
        // Use current time instead of message timestamp to match server time display
        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes} ${ampm}`;
    }

    // Add message to UI
    function addMessage(message) {
        // CRITICAL FIX: Use message ID for duplicate detection instead of text comparison
        // Text comparison can prevent legitimate duplicate messages
        if (message.id) {
            const isDuplicate = messages.some(m => m.id === message.id);
            if (isDuplicate) {
                console.log('[Chat] Skipping duplicate message ID:', message.id);
                return;
            }
        } else {
            // Fallback for messages without ID (backwards compatibility)
            const isDuplicate = messages.some(m =>
                m.text === message.text &&
                m.userId === message.userId &&
                Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 500
            );
            if (isDuplicate) {
                console.log('[Chat] Skipping duplicate message (no ID)');
                return;
            }
        }

        messages.push(message);
        const messageEl = createMessageElement(message);
        messagesArea.appendChild(messageEl);

        // Scroll to bottom with smooth animation
        setTimeout(() => {
            messagesArea.scrollTo({
                top: messagesArea.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

    // Update online count
    function updateOnlineCount(count) {
        const onlineCountEl = document.getElementById('online-count');
        if (onlineCountEl) {
            onlineCountEl.textContent = count;
        }
    }

    // Initialize WebSocket connection
    function connectWebSocket() {
        if (!token) {
            NotificationSystem.show('Please login to use chat', 'error');
            return;
        }

        try {
            ws = new WebSocket(`ws://217.182.65.174/ws/chat?token=${token}`);

            ws.onopen = () => {
                console.log('Chat WebSocket connected');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('[Chat] Received WebSocket message:', data);

                // Handle different message types
                if (data.type === 'online_count') {
                    console.log('[Chat] Updating online count:', data.count);
                    updateOnlineCount(data.count);
                } else if (data.type === 'system') {
                    console.log('[Chat] System message:', data.message);
                    addMessage(data);
                } else if (data.type === 'message') {
                    console.log('[Chat] User message from:', data.username, '- text:', data.text);
                    addMessage(data);
                } else {
                    console.warn('[Chat] Unknown message type:', data.type, data);
                }
            };

            ws.onerror = (error) => {
                console.error('Chat WebSocket error:', error);
                NotificationSystem.show('Chat connection error', 'error');
            };

            ws.onclose = () => {
                console.log('Chat WebSocket closed');
                // Try to reconnect after 3 seconds
                setTimeout(() => {
                    if (document.getElementById('chat-messages')) {
                        connectWebSocket();
                    }
                }, 3000);
            };
        } catch (error) {
            console.error('Failed to connect to chat:', error);
            NotificationSystem.show('Failed to connect to chat', 'error');
        }
    }

    // Handle form submission
    inputForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text) return;

        // Check if connected
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            NotificationSystem.show('Not connected to chat', 'error');
            return;
        }

        // Send to WebSocket server
        try {
            ws.send(JSON.stringify({ text }));

            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';
            messageInput.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
            NotificationSystem.show('Failed to send message', 'error');
        }
    });

    // Connect to WebSocket
    connectWebSocket();
}

// Add CSS animation
const chatViewStyle = document.createElement('style');
chatViewStyle.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

    @keyframes messageAppear {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.6;
            transform: scale(1.2);
        }
    }

    #chat-messages::-webkit-scrollbar {
        width: 12px;
    }

    #chat-messages::-webkit-scrollbar-track {
        background: rgba(139, 111, 71, 0.2);
        border-radius: 6px;
    }

    #chat-messages::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #8b6f47 0%, #6b5337 100%);
        border-radius: 6px;
        border: 2px solid rgba(244, 228, 193, 0.3);
    }

    #chat-messages::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #a88958 0%, #8b6f47 100%);
    }
`;
document.head.appendChild(chatViewStyle);

// Make it globally available
window.createChatView = createChatView;
