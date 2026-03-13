/**
 * TRIP TACTICX - GLOBAL UI SCRIPT
 * Handles News Ticker & Atlas AI Chatbot across all pages.
 */

// Global Modal System
window.showModal = function (title, message, type = 'success') {
    let modal = document.getElementById('globalModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'globalModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    // Config based on type
    const config = {
        success: { icon: '✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        error: { icon: '✕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        info: { icon: 'ℹ', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
    };
    const style = config[type] || config.success;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center; border-color: ${style.color};">
            <div class="success-icon" style="color: ${style.color}; font-size: 3rem; margin-bottom: 10px;">${style.icon}</div>
            <h2 style="color: white; margin-bottom: 10px;">${title}</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px; line-height: 1.5;">${message}</p>
            
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; background: ${style.color}; width: 100%; animation: countDown 4s linear forwards;"></div>
            </div>
            <style>
                @keyframes countDown { from { width: 100%; } to { width: 0%; } }
            </style>
             <button onclick="document.getElementById('globalModal').style.display='none'" 
                style="margin-top: 20px; background: transparent; border: 1px solid ${style.color}; color: ${style.color}; padding: 8px 16px; border-radius: 20px; cursor: pointer;">
                Dismiss
            </button>
        </div>
    `;

    modal.style.display = 'flex';

    // Auto close
    const time = type === 'error' ? 6000 : 4000; // Errors stay longer
    setTimeout(() => {
        if (modal.style.display === 'flex') modal.style.display = 'none';
    }, time);

    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
};

/* ================= COMPASS / ATLAS CHATBOT ================= */
let isCompassOpen = false;
let chatHistory = [];

function toggleCompass() {
    const window = document.getElementById('compass-window');
    // Auto-inject if missing (e.g. on simple pages)
    if (!window) return;

    isCompassOpen = !isCompassOpen;
    window.style.display = isCompassOpen ? 'flex' : 'none';
    if (isCompassOpen) {
        const input = document.getElementById('compass-input');
        if (input) input.focus();
    }
}

function handleCompassKey(event) {
    if (event.key === 'Enter') {
        sendCompassMessage();
    }
}

async function sendCompassMessage() {
    const input = document.getElementById('compass-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    // Add User Message
    appendMessage('user', text);
    input.value = '';
    chatHistory.push({ role: 'user', content: text });

    // Add Loading Bubble
    const loadingId = 'loading-' + Date.now();
    const msgsDiv = document.getElementById('compass-messages');
    msgsDiv.innerHTML += `<div id="${loadingId}" class="msg bot">...</div>`;
    msgsDiv.scrollTop = msgsDiv.scrollHeight;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory })
        });

        const data = await res.json();

        // Remove loading
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();

        if (data.reply) {
            appendMessage('bot', data.reply);
            chatHistory.push({ role: 'assistant', content: data.reply });
        } else {
            appendMessage('bot', "Sorry, I'm having trouble connecting to the stars right now. ✨");
        }

    } catch (err) {
        console.error(err);
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();
        appendMessage('bot', "Connection error. Please try again.");
    }
}

function appendMessage(role, text) {
    const msgsDiv = document.getElementById('compass-messages');
    if (!msgsDiv) return;
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    // Allow simple bolding
    div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgsDiv.appendChild(div);
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
}


/* ================= NEWS TICKER ================= */

async function fetchNews() {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;

    try {
        const res = await fetch('/api/news');
        const news = await res.json();

        if (news && news.length > 0) {
            // Use <small> instead of <span> to avoid CSS conflict with ticker animation
            const text = news.map(n =>
                `<a href="${n.url}" target="_blank" class="ticker-item" style="color:inherit; text-decoration:none;">${n.title} <small style="opacity:0.7; font-size:0.85em">(${n.source})</small></a>`
            ).join('');

            // Wrap in singular span for the CSS animation
            tickerContent.innerHTML = `<span>${text}</span>`;
        } else {
            tickerContent.innerHTML = '<span>No travel updates available at the moment. Check back later!</span>';
        }
    } catch (err) {
        console.error("News fetch failed", err);
        tickerContent.innerHTML = '<span>Welcome to TripTacticx - Plan your dream journey today! • Explore Hidden Gems • Travel Smart</span>';
    }
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
});
