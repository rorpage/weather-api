// retro.js — WeatherStar 4000-inspired retro METAR display

const RETRO_AIRPORT_KEY = 'retro_metar_airport';

const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
];

function celsiusToFahrenheit(celsius) {
  return Math.round(celsius * 9 / 5 + 32);
}

function degreesToCompass(degrees) {
  return COMPASS_POINTS[Math.round(degrees / 22.5) % 16];
}

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
  const tempEl = document.getElementById('ws-temp');
  if (data.temperature !== null && data.temperature !== undefined) {
    const tempF = celsiusToFahrenheit(data.temperature);
    tempEl.textContent = `${tempF}°F / ${Math.round(data.temperature)}°C`;
  } else {
    tempEl.textContent = '--';
  }

  // Dewpoint
  const dewEl = document.getElementById('ws-dewpoint');
  if (data.dewpoint !== null && data.dewpoint !== undefined) {
    const dewF = celsiusToFahrenheit(data.dewpoint);
    dewEl.textContent = `${dewF}°F / ${Math.round(data.dewpoint)}°C`;
  } else {
    dewEl.textContent = '--';
  }

  // Wind — direction as compass + speed, or CALM
  const windEl = document.getElementById('ws-wind');
  if (data.wind) {
    const isCalm = data.wind.direction === 0 && data.wind.speed === 0;
    if (isCalm) {
      windEl.textContent = 'CALM';
    } else {
      const compass = degreesToCompass(data.wind.direction);
      windEl.textContent = `${compass} ${data.wind.speed} KT\n@ ${data.wind.direction}°`;
    }
  } else {
    windEl.textContent = '--';
  }

  // Visibility
  const visEl = document.getElementById('ws-visibility');
  if (data.visibility !== undefined && data.visibility !== null) {
    visEl.textContent = `${data.visibility} SM`;
  } else {
    visEl.textContent = '--';
  }

  // Altimeter
  document.getElementById('ws-altimeter').textContent =
    data.altimeter ? `${data.altimeter} inHg` : '--';

  // Flight category — coloured via data attribute + CSS
  const flightCatEl = document.getElementById('ws-flight-cat');
  const category = (data.flight_category || '--').toUpperCase();
  flightCatEl.textContent = category;
  flightCatEl.setAttribute('data-cat', category);

  // Sky conditions — guard against empty array
  const skyEl = document.getElementById('ws-sky');
  skyEl.textContent =
    data.sky_conditions?.length
      ? data.sky_conditions.map((sky) => sky.description.toUpperCase()).join('\n')
      : 'CLEAR';

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
