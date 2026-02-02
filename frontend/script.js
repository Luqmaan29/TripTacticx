const form = document.getElementById('tripForm');
const resultDiv = document.getElementById('result');
const loaderDiv = document.getElementById('loader');
const resetBtn = document.getElementById('resetBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const navLinks = document.getElementById('navLinks');
const myTripsModal = document.getElementById('myTripsModal');

let currentUser = null;

// ================= AUTH & INIT =================

async function checkAuth() {
  try {
    const res = await fetch('/check-auth', { credentials: 'include' });
    const data = await res.json();
    if (data.authenticated) {
      currentUser = data.user;
      renderNavAuthenticated();
      autoFillForm();
      document.getElementById('mainContainer').style.display = 'flex'; // Show form
    } else {
      // Redirect to login if not authenticated
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error("Auth check failed", err);
    window.location.href = 'login.html';
  }
}

function renderNavAuthenticated() {
  let navHtml = `
    <span style="color:white; margin-right:15px; font-weight:bold;">Hi, ${currentUser.name}</span>
    <button onclick="openModal()" class="nav-btn">My Trips</button>
  `;

  if (currentUser.is_admin) {
    navHtml += `<a href="admin.html" class="nav-btn" style="background:rgba(255,0,0,0.3)">Admin</a>`;
  }

  navHtml += `<button onclick="logout()" class="nav-btn">Logout</button>`;
  navLinks.innerHTML = navHtml;
}

async function logout() {
  await fetch('/logout', { method: 'POST', credentials: 'include' });
  window.location.href = 'login.html';
}

function autoFillForm() {
  if (currentUser) {
    document.getElementById('name').value = currentUser.name;
    document.getElementById('email').value = currentUser.email;
  }
}

// ================= MY TRIPS MODAL =================

function openModal() {
  myTripsModal.style.display = 'flex';
  fetchMyTrips();
}

function closeModal() {
  myTripsModal.style.display = 'none';
}

async function fetchMyTrips() {
  const listDiv = document.getElementById('tripsList');
  listDiv.innerHTML = '<p style="color:white;">Loading trips...</p>';

  try {
    const res = await fetch('/api/my-trips', { credentials: 'include' });
    const trips = await res.json();

    if (trips.length === 0) {
      listDiv.innerHTML = '<p style="color:var(--text-muted);">No trips saved yet.</p>';
      return;
    }

    // Store globally to access details
    window.userTrips = trips;

    listDiv.innerHTML = trips.map((t, index) => `
      <div onclick="openTripDetails(${index})" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; transition:background 0.2s;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
             <h4 style="color:var(--primary-color); margin:0;">${t.destination}</h4>
             <span style="font-size:0.8rem; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px;">View Plan</span>
        </div>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-top:5px;">
           ${t.days} Days • ₹${t.budget} • ${t.created_at}
        </p>
      </div>
    `).join('');

  } catch (err) {
    listDiv.innerHTML = '<p style="color:red;">Failed to load trips.</p>';
  }
}

window.onclick = function (event) {
  if (event.target == myTripsModal) {
    closeModal();
  }
}

function openTripDetails(index) {
  const trip = window.userTrips[index];
  if (!trip || !trip.details) return;

  const listDiv = document.getElementById('tripsList');

  // Render details inside the modal, essentially replacing the list temporarily
  // Or better, creating a detailed view within the modal

  let html = `
    <button onclick="fetchMyTrips()" style="background:none; border:none; color:var(--primary-color); cursor:pointer; margin-bottom:15px;">← Back to List</button>
    <h2 style="color:white; margin-bottom:10px;">${trip.destination}</h2>
    <p style="color:var(--text-muted); margin-bottom:20px;">Created: ${trip.created_at} | Budget: ₹${trip.budget}</p>
  `;

  for (const [section, content] of Object.entries(trip.details)) {
    html += `
        <div class="section" style="padding:15px; margin-bottom:15px;">
            <h3 style="font-size:1.2rem;">${section}</h3>
            <div style="font-size:0.95rem;">${formatText(content)}</div>
        </div>
      `;
  }

  listDiv.innerHTML = html;
}

// ================= PLANNING FLOW =================

const progressSteps = [
  { icon: '✈️', text: 'Analyzing your preferences...' },
  { icon: '🏨', text: 'Finding accommodations...' },
  { icon: '🍽️', text: 'Curating dining options...' },
  { icon: '🎨', text: 'Discoverying experiences...' },
  { icon: '💰', text: 'Budgeting...' }
];

function showLoader(stepIndex) {
  if (stepIndex >= progressSteps.length) return;
  const step = progressSteps[stepIndex];

  loaderDiv.innerHTML = `
    <div class="progress-container">
      <div class="progress-spinner" style="width: 80px; height: 80px; border: 4px solid rgba(255,255,255,0.1); border-radius: 50%; border-top-color: var(--primary-color); animation: spin 1s infinite;"></div>
      <div style="margin-top:20px; font-size: 2rem;">${step.icon}</div>
      <p class="progress-message" style="margin-top:10px; font-size:1.1rem;">${step.text}</p>
    </div>
  `;
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!currentUser) {
    alert("Please login to plan a trip!");
    window.location.href = 'login.html';
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.5';

  resultDiv.innerHTML = '';
  loaderDiv.style.display = 'block';
  resetBtn.style.display = 'none';
  downloadPdfBtn.style.display = 'none';

  // Loader animation
  let step = 0;
  showLoader(0);
  const interval = setInterval(() => {
    step = (step + 1) % progressSteps.length;
    showLoader(step);
  }, 2000);

  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    whatsapp_number: document.getElementById('whatsapp').value,
    destination: document.getElementById('destination').value,
    start_date: document.getElementById('start_date').value,
    end_date: document.getElementById('end_date').value,
    group_size: document.getElementById('group_size').value,
    trip_type: document.getElementById('trip_type').value,
    budget: document.getElementById('budget').value,
    transport_mode: document.getElementById('transport_mode').value,
    preferences: document.getElementById('preferences').value,
    source_location: document.getElementById('source_location').value
  };

  try {
    const response = await fetch('/plan-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    clearInterval(interval);
    loaderDiv.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server Error');
    }

    const result = await response.json();
    displayResult(result, data); // Pass input data
    // Store data for PDF download reuse
    downloadPdfBtn.dataset.form = JSON.stringify(data);

  } catch (error) {
    clearInterval(interval);
    loaderDiv.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    alert(error.message);
  }
});

function displayResult(result, formData) {
  let html = '';
  // Agent outputs
  for (const [section, content] of Object.entries(result.agent_outputs)) {
    html += `
        <div class="section">
            <h3>${section}</h3>
            <div>${formatText(content)}</div>
        </div>
      `;
  }

  // Email status
  html += `
    <div style="margin-top:20px; padding:15px; background:rgba(0,255,0,0.1); border-radius:10px; border:1px solid #10b981;">
        <strong>📧 Email Status:</strong> ${result.email_sent ? 'Sent successfully!' : `Failed to send. Error: ${result.email_error || 'Unknown error.'}`}
    </div>
  `;

  resultDiv.innerHTML = html;
  resetBtn.style.display = 'inline-block';
  downloadPdfBtn.style.display = 'inline-block';

  // Trigger Map & Smart Actions
  if (formData) {
    renderSmartActions(formData.destination, formData.start_date, formData.end_date);
  }
}

function formatText(text) {
  // Simple markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

resetBtn.addEventListener('click', () => {
  form.reset();
  autoFillForm();
  resultDiv.innerHTML = '';
  resetBtn.style.display = 'none';
  downloadPdfBtn.style.display = 'none';
});

downloadPdfBtn.addEventListener('click', async () => {
  alert("The PDF has been sent to your email!");
});

// Initialize
checkAuth();
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// ================= COMPASS CHATBOT =================

let isCompassOpen = false;
let chatHistory = [];

function toggleCompass() {
  const window = document.getElementById('compass-window');
  isCompassOpen = !isCompassOpen;
  window.style.display = isCompassOpen ? 'flex' : 'none';
  if (isCompassOpen) {
    document.getElementById('compass-input').focus();
  }
}

function handleCompassKey(event) {
  if (event.key === 'Enter') {
    sendCompassMessage();
  }
}

async function sendCompassMessage() {
  const input = document.getElementById('compass-input');
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
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  // Allow simple bolding
  div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  msgsDiv.appendChild(div);
  msgsDiv.scrollTop = msgsDiv.scrollHeight;
}

// ================= SMART SEASON MATCHER =================

async function suggestDestination() {
  const startDate = document.getElementById('start_date').value;
  const tripType = document.getElementById('trip_type').value;
  const btn = document.getElementById('magicBtn');
  const destInput = document.getElementById('destination');

  if (!startDate) {
    alert("Please pick a Start Date first! 📅\nI need to know *when* you are going to suggest the best weather.");
    return;
  }

  // Loading State
  const originalText = btn.innerHTML;
  btn.innerHTML = "✨ Thinking...";
  btn.disabled = true;

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, trip_type: tripType })
    });

    const data = await res.json();

    if (data.destination) {
      destInput.value = data.destination;

      // Visual feedback - simple toast or alert for now
      alert(`✨ Recommendation: ${data.destination}\n\nWhy: ${data.reason}`);
    } else {
      alert('Could not find a perfect match. Please try again.');
    }

  } catch (err) {
    console.error(err);
    alert('Magic failed. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ================= MAP & SMART ACTIONS =================

let mapInstance = null;

async function renderSmartActions(destination, startDate, endDate, transportMode = 'Flight', sourceLocation = '') {
  const actionContainer = document.getElementById('action-container');
  const mapContainer = document.getElementById('map-container');

  // Clear previous
  actionContainer.innerHTML = '';

  if (!destination) return;

  mapContainer.style.display = 'block';

  // 1. SMART BOOKING LINKS
  let actionHtml = '';
  // Common date formatting: YYYY-MM-DD
  const isoDate = startDate ? startDate : new Date().toISOString().split('T')[0];

  if (transportMode === 'Flight') {
    // Skyscanner
    const dateCode = isoDate.substr(2, 5).replace('-', '');
    const url = `https://www.skyscanner.co.in/transport/flights-from/in/${destination}/?oym=${dateCode}`;
    actionHtml += `
            <a href="${url}" target="_blank" class="action-btn flight">
                ✈️ Check Flights
            </a>
        `;
  } else if (transportMode === 'Train') {
    // ConfirmTkt or Ixigo
    const url = `https://www.ixigo.com/trains/${sourceLocation}-to-${destination}-trains`;
    actionHtml += `
            <a href="${url}" target="_blank" class="action-btn hotel" style="background: linear-gradient(135deg, #2563eb, #1e40af);">
                🚂 Check Trains
            </a>
        `;
  } else if (transportMode === 'Bus') {
    // RedBus
    const url = `https://www.redbus.in/bus-tickets/search?fromCityName=${sourceLocation}&toCityName=${destination}&onward=${isoDate}`;
    actionHtml += `
            <a href="${url}" target="_blank" class="action-btn hotel" style="background: linear-gradient(135deg, #dc2626, #991b1b);">
                🚌 Check Buses
            </a>
        `;
  } else if (transportMode === 'Car') {
    // Google Maps Directions
    const url = `https://www.google.com/maps/dir/?api=1&origin=${sourceLocation}&destination=${destination}&travelmode=driving`;
    actionHtml += `
            <a href="${url}" target="_blank" class="action-btn hotel" style="background: linear-gradient(135deg, #16a34a, #15803d);">
                🚗 View Route
            </a>
        `;
  }

  // Always show Hotel link
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${destination}&checkin=${startDate}&checkout=${endDate}`;
  actionHtml += `
        <a href="${bookingUrl}" target="_blank" class="action-btn hotel">
            🏨 Find Hotels
        </a>
    `;

  actionContainer.innerHTML = actionHtml;

  // 2. INTERACTIVE MAP
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Geocode Destination via OSM Nominatim (Free)
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${destination}`);
    const geoData = await geoRes.json();

    if (geoData && geoData.length > 0) {
      const lat = geoData[0].lat;
      const lon = geoData[0].lon;

      mapInstance = L.map('map-container').setView([lat, lon], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors & CartoDB'
      }).addTo(mapInstance);

      L.marker([lat, lon])
        .addTo(mapInstance)
        .bindPopup(`<b>${destination}</b><br>Your Adventure Starts Here!`)
        .openPopup();

      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 100);

    } else {
      mapContainer.style.display = 'none';
    }
  } catch (e) {
    console.error("Map Error", e);
    mapContainer.style.display = 'none';
  }
}
