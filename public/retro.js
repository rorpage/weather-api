// retro.js — WeatherStar 4000-inspired retro METAR display

const RETRO_AIRPORT_KEY = 'retro_metar_airport';

// ── RENDER ─────────────────────────────────────────
function renderRetro(data) {
  document.getElementById('ws-loading').classList.add('hidden');
  document.getElementById('ws-error').classList.add('hidden');

  // Location and time
  const locationEl = document.getElementById('ws-location-id');
  locationEl.textContent = data.id || '----';
  locationEl.setAttribute('aria-label', `Airport: ${data.id || '----'}`);
  document.getElementById('ws-obs-time').textContent = data.observation_time || '--:-- LOCAL';

  // Keep search input in sync
  const airportInput = document.getElementById('ws-airport-input');
  if (airportInput && data.id) airportInput.value = data.id;

  // Temperature — show °F / °C like the original WS4000
  document.getElementById('ws-temp').textContent = formatDualTemperature(data.temperature);

  // Dewpoint
  document.getElementById('ws-dewpoint').textContent = formatDualTemperature(data.dewpoint);

  // Wind — speed and direction in degrees, or CALM
  document.getElementById('ws-wind').textContent = formatWindDisplay(data.wind);

  // Visibility
  document.getElementById('ws-visibility').textContent = formatVisibility(data.visibility);

  // Altimeter
  document.getElementById('ws-altimeter').textContent = formatAltimeter(data.altimeter);

  // Flight category — coloured via data attribute + CSS
  const flightCatEl = document.getElementById('ws-flight-cat');
  const category = (data.flight_category || '--').toUpperCase();
  flightCatEl.textContent = category;
  flightCatEl.setAttribute('data-cat', category);

  // Sky conditions — guard against empty array
  document.getElementById('ws-sky').textContent = formatSkyConditions(data.sky_conditions);

  // METAR ticker — restart the scroll animation on new data using rAF
  const tickerText = document.getElementById('ws-ticker-text');
  tickerText.textContent = data.raw_text || 'NO METAR DATA';
  tickerText.style.animation = 'none';
  requestAnimationFrame(() => {
    tickerText.style.animation = '';
  });

  const dataGrid = document.getElementById('ws-data');
  dataGrid.classList.remove('hidden');
  dataGrid.focus();
}

// ── FETCH ──────────────────────────────────────────
async function fetchMetarRetro() {
  const airportInput = document.getElementById('ws-airport-input');
  const airport = (airportInput?.value || '').toUpperCase().trim() || 'KUMP';
  localStorage.setItem(RETRO_AIRPORT_KEY, airport);

  document.getElementById('ws-loading').classList.remove('hidden');
  document.getElementById('ws-error').classList.add('hidden');
  document.getElementById('ws-data').classList.add('hidden');

  try {
    const response = await fetch(`/api/metar?id=${encodeURIComponent(airport)}`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    renderRetro(data);
  } catch (error) {
    document.getElementById('ws-loading').classList.add('hidden');
    const errorEl = document.getElementById('ws-error');
    errorEl.textContent = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
    errorEl.classList.remove('hidden');
  }
}

// ── INIT ───────────────────────────────────────────
(function init() {
  const airport = localStorage.getItem(RETRO_AIRPORT_KEY) || 'KUMP';
  document.getElementById('ws-airport-input').value = airport;
  fetchMetarRetro();
})();
