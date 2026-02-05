/**
 * TRIP TACTICX - GLOBAL UI SCRIPT
 * Handles News Ticker & Atlas AI Chatbot across all pages.
 */

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
