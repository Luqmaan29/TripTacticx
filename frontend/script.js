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
  const landingPage = document.getElementById('landing-page');
  const mainContainer = document.getElementById('mainContainer');

  try {
    const res = await fetch('/check-auth', { credentials: 'include' });
    const data = await res.json();
    if (data.authenticated) {
      currentUser = data.user;
      renderNavAuthenticated();
      autoFillForm();

      // Show Dashboard, Hide Landing
      if (landingPage) landingPage.style.display = 'none';
      mainContainer.style.display = 'flex';
    } else {
      // Guest: Show Landing, Hide Dashboard
      if (landingPage) landingPage.style.display = 'block';
      mainContainer.style.display = 'none';
      renderNavGuest();
    }
  } catch (err) {
    console.error("Auth check failed", err);
    // Default to guest view
    if (landingPage) landingPage.style.display = 'block';
    mainContainer.style.display = 'none';
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

function renderNavGuest() {
  navLinks.innerHTML = `
      <a href="#" class="nav-btn" onclick="document.getElementById('landing-page').style.display='block'; document.getElementById('mainContainer').style.display='none';">Home</a>
      <a href="#about-section" class="nav-btn">About</a>
      <a href="#contact-section" class="nav-btn">Contact</a>
      <a href="login.html" class="nav-btn" style="background:var(--primary-color)">Login</a>
    `;
}

async function logout() {
  await fetch('/logout', { method: 'POST', credentials: 'include' });
  window.location.reload();
}

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;

    const data = {
      name: document.getElementById('contactName').value,
      email: document.getElementById('contactEmail').value,
      message: document.getElementById('contactMessage').value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showModal('Message Sent!', `Thanks ${data.name.split(' ')[0]}, we'll get back to you shortly.`, 'success');
        contactForm.reset();
      } else {
        showModal('Delivery Failed', 'Failed to send message.', 'error');
      }

    } catch (err) {
      console.error(err);
      showModal('Delivery Failed', 'Error sending message.', 'error');
    } finally {
      if (btn) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    }
  });
}

// showSuccessModal removed -> using global showModal in shared_ui.js

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
    showModal('Login Required', 'Please login to plan a trip!', 'info');
    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
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
    showModal('Planning Failed', error.message, 'error');
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
  // Trigger Map & Smart Actions
  if (formData) {
    renderSmartActions(formData.destination, formData.start_date, formData.end_date, formData.transport_mode);
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
  showModal('PDF On The Way!', "The PDF has been sent to your email.", 'info');
});

// Initialize
checkAuth();
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// ================= NEWS TICKER & CHATBOT =================
// Logic moved to shared_ui.js for global consistency.
// shared_ui.js handles: fetchNews(), toggleCompass(), sendCompassMessage(), etc.

// ================= SUGGESTIONS FEATURE =================

async function suggestDestination() {
  const startDate = document.getElementById('start_date').value;
  const tripType = document.getElementById('trip_type').value;
  const btn = document.getElementById('magicBtn');

  if (!startDate) {
    showModal('Missing Date', "Please select a Start Date first!", 'info');
    return;
  }

  const originalText = btn.innerHTML;
  btn.innerHTML = "✨ Thinking...";
  btn.disabled = true;
  btn.style.opacity = "0.7";

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, trip_type: tripType })
    });

    if (!res.ok) throw new Error("Failed to fetch suggestions");

    const data = await res.json();

    if (data.suggestions && Array.isArray(data.suggestions)) {
      showSuggestionsModal(data.suggestions);
    } else {
      showModal('No Suggestions', "Could not find suggestions. Please try again.", 'info');
    }

  } catch (err) {
    console.error(err);
    showModal('AI Error', "Error getting suggestions. Try again.", 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
    btn.style.opacity = "1";
  }
}

function showSuggestionsModal(suggestions) {
  // Check if modal exists, else create it
  let modal = document.getElementById('suggestionsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'suggestionsModal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  const listHtml = suggestions.map(s => `
        <div class="suggestion-card" onclick="selectSuggestion('${s.destination.replace(/'/g, "\\'")}')">
            <div class="suggestion-info">
                <span class="suggestion-dest">${s.destination}</span>
                <span class="suggestion-reason">${s.reason}</span>
            </div>
            <span class="select-arrow">→</span>
        </div>
    `).join('');

  modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close-button" onclick="document.getElementById('suggestionsModal').style.display='none'">&times;</span>
            <h2 style="color: var(--primary-color); margin-bottom: 20px;">Top Picks for You ✨</h2>
            <div class="suggestions-list">
                ${listHtml}
            </div>
        </div>
    `;

  modal.style.display = 'flex';
}

function selectSuggestion(dest) {
  const input = document.getElementById('destination');
  input.value = dest;

  // Highlight effect
  input.style.borderColor = 'var(--accent-color)';
  input.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
  setTimeout(() => {
    input.style.borderColor = 'var(--glass-border)';
    input.style.boxShadow = 'none';
  }, 1000);

  document.getElementById('suggestionsModal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function (event) {
  const modal = document.getElementById('suggestionsModal');
  if (modal && event.target == modal) {
    modal.style.display = 'none';
  }
});

function renderSmartActions(destination, startDate, endDate, transportMode = 'Flight') {
  const container = document.getElementById('action-container');
  if (!container) return;

  container.innerHTML = '';
  const source = document.getElementById('source_location').value || 'India';

  // Dynamic Transport Button
  const transportBtn = document.createElement('a');
  transportBtn.target = '_blank';
  transportBtn.className = 'action-btn flight'; // Reusing 'flight' class for styling base

  if (transportMode === 'Flight') {
    transportBtn.href = `https://www.google.com/travel/flights?q=flights+to+${destination}+from+${source}+on+${startDate}`;
    transportBtn.innerHTML = '✈️ Book Flights';
  } else if (transportMode === 'Train') {
    transportBtn.href = `https://www.google.com/search?q=trains+to+${destination}+from+${source}`;
    transportBtn.innerHTML = '🚂 Book Trains';
  } else if (transportMode === 'Bus') {
    transportBtn.href = `https://www.redbus.in/search?fromCityName=${source}&toCityName=${destination}&onward=${startDate}`;
    transportBtn.innerHTML = '🚌 Book Bus';
  } else if (transportMode === 'Car') {
    transportBtn.href = `https://www.google.com/maps/dir/${source}/${destination}`;
    transportBtn.innerHTML = '🚗 View Route';
  } else {
    // Default to flight if unknown
    transportBtn.href = `https://www.google.com/travel/flights?q=flights+to+${destination}+from+${source}`;
    transportBtn.innerHTML = '✈️ Book Flights';
  }

  // Hotel Button (Always shown)
  const hotelBtn = document.createElement('a');
  hotelBtn.href = `https://www.google.com/travel/hotels?q=hotels+in+${destination}`;
  hotelBtn.target = '_blank';
  hotelBtn.className = 'action-btn hotel';
  hotelBtn.innerHTML = '🏨 Book Hotels';

  container.appendChild(transportBtn);
  container.appendChild(hotelBtn);
}
