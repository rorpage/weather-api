const AIRPORT_KEY = 'metar_airport';

// Dark shade of each category color — used for the outer ring of the FC gauge
const FC_COLORS_DARK = {
  VFR: '#15803d',
  MVFR: '#1d4ed8',
  IFR: '#b91c1c',
  LIFR: '#a21caf',
};

// Lighter pastel tint of each category color for the inner circle background
const FC_COLORS_LIGHT = {
  VFR: '#86efac',
  MVFR: '#93c5fd',
  IFR: '#fca5a5',
  LIFR: '#f0abfc',
};

function fcColorDark(category) {
  return FC_COLORS_DARK[(category || '').toUpperCase()] || '#444';
}

function fcColorLight(category) {
  return FC_COLORS_LIGHT[(category || '').toUpperCase()] || '#aaa';
}

// ── SVG helpers ────────────────────────────────────
function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function svgText(content, attrs) {
  const el = svgEl('text', attrs);
  el.textContent = content;
  return el;
}

function clearSvg(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

// Draw the base gauge: black-outlined bezel + gray face
function drawBase(svg) {
  svg.appendChild(svgEl('circle', {
    cx: 100, cy: 100, r: 96,
    stroke: '#000', 'stroke-width': 5, fill: '#2a2a2a',
  }));
  svg.appendChild(svgEl('circle', {
    cx: 100, cy: 100, r: 87,
    stroke: '#000', 'stroke-width': 2, fill: '#555',
  }));
}

// Draw tick marks along the inner edge of the face
function drawTicks(svg) {
  for (let deg = 0; deg < 360; deg += 10) {
    const rad = (deg - 90) * Math.PI / 180;
    const outerRadius = 85;
    const tickLength = deg % 30 === 0 ? 10 : 5;
    svg.appendChild(svgEl('line', {
      x1: 100 + outerRadius * Math.cos(rad),
      y1: 100 + outerRadius * Math.sin(rad),
      x2: 100 + (outerRadius - tickLength) * Math.cos(rad),
      y2: 100 + (outerRadius - tickLength) * Math.sin(rad),
      stroke: '#666',
      'stroke-width': deg % 30 === 0 ? 2 : 1,
    }));
  }
}

// ── TEMPERATURE GAUGE ──────────────────────────────
function renderTemp(svg, tempC) {
  clearSvg(svg);
  drawBase(svg);
  drawTicks(svg);

  const display = tempC !== null && tempC !== undefined ? `${Math.round(tempC)}°C` : '--°C';

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));
}

// ── WIND GAUGE ─────────────────────────────────────
// Compass rose with a white arc on the outer bezel showing wind direction.
function renderWind(svg, windDirection, windSpeed) {
  clearSvg(svg);
  drawBase(svg);

  const isCalm = windDirection === 0 && windSpeed === 0;

  // White arc on the outer bezel ring highlighting the wind direction.
  // The arc is drawn at r=91 (midpoint of the bezel between r=87 and r=96)
  // with stroke-width=8 so it stays within the bezel.
  if (!isCalm) {
    const arcRadius = 91;
    const circumference = 2 * Math.PI * arcRadius;
    const arcSpanDeg = 10;
    const arcLength = (arcSpanDeg / 360) * circumference;
    const gapLength = circumference - arcLength;
    // SVG strokes start at 3 o'clock. Compass 0° = top (12 o'clock).
    // Rotate so the arc is centered on windDirection.
    const rotateAngle = windDirection - arcSpanDeg / 2 - 90;
    svg.appendChild(svgEl('circle', {
      cx: 100, cy: 100, r: arcRadius,
      fill: 'none',
      stroke: 'rgba(255,255,255,0.8)',
      'stroke-width': 8,
      'stroke-dasharray': `${arcLength.toFixed(2)} ${gapLength.toFixed(2)}`,
      transform: `rotate(${rotateAngle}, 100, 100)`,
      'stroke-linecap': 'butt',
    }));
  }

  // Compass tick marks on the face edge
  for (let deg = 0; deg < 360; deg += 10) {
    const rad = (deg - 90) * Math.PI / 180;
    const outerRadius = 84;
    const tickLength = deg % 30 === 0 ? 10 : 5;
    svg.appendChild(svgEl('line', {
      x1: 100 + outerRadius * Math.cos(rad),
      y1: 100 + outerRadius * Math.sin(rad),
      x2: 100 + (outerRadius - tickLength) * Math.cos(rad),
      y2: 100 + (outerRadius - tickLength) * Math.sin(rad),
      stroke: '#666',
      'stroke-width': deg % 30 === 0 ? 2 : 1,
    }));
  }

  // Cardinal labels at radius 60 – inward enough to avoid the arc
  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];
  cardinals.forEach(({ label, angle }) => {
    const rad = (angle - 90) * Math.PI / 180;
    const labelRadius = 60;
    svg.appendChild(svgText(label, {
      x: 100 + labelRadius * Math.cos(rad),
      y: 100 + labelRadius * Math.sin(rad) + 5,
      'text-anchor': 'middle',
      fill: '#fff',
      'font-family': "'Share Tech Mono', monospace",
      'font-size': 13,
      'font-weight': label === 'N' ? 'bold' : 'normal',
    }));
  });

  // Center: combined speed and direction on two lines
  if (isCalm) {
    svg.appendChild(svgEl('circle', {
      cx: 100, cy: 100, r: 8,
      stroke: '#fff', 'stroke-width': 2, fill: 'none',
    }));
  } else {
    svg.appendChild(svgText(`${windSpeed} kt`, {
      x: 100, y: 93,
      'text-anchor': 'middle',
      fill: '#fff',
      'font-family': "'Share Tech Mono', monospace",
      'font-size': 24,
      'font-weight': 'bold',
    }));
    svg.appendChild(svgText(`@ ${windDirection}°`, {
      x: 100, y: 119,
      'text-anchor': 'middle',
      fill: '#fff',
      'font-family': "'Share Tech Mono', monospace",
      'font-size': 24,
      'font-weight': 'bold',
    }));
  }
}

// ── ALTIMETER GAUGE ────────────────────────────────
function renderAlt(svg, altimeter) {
  clearSvg(svg);
  drawBase(svg);
  drawTicks(svg);

  const display = altimeter ? `${altimeter} inHg` : '-- inHg';

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));
}

// ── FLIGHT CATEGORY GAUGE ──────────────────────────
// Dark colored outer ring with a light pastel center — no gray at all.
function renderFlightCategory(svg, category) {
  clearSvg(svg);
  const colorDark = fcColorDark(category);
  const colorLight = fcColorLight(category);

  // Outer circle filled with the dark category color (forms the colored ring)
  svg.appendChild(svgEl('circle', {
    cx: 100, cy: 100, r: 96,
    fill: colorDark, stroke: '#000', 'stroke-width': 5,
  }));

  // Light inner circle
  svg.appendChild(svgEl('circle', {
    cx: 100, cy: 100, r: 87,
    fill: colorLight, stroke: '#000', 'stroke-width': 2,
  }));

  const cat = (category || '--').toUpperCase();

  svg.appendChild(svgText(cat, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));
}

// ── VISIBILITY GAUGE ───────────────────────────────
function renderVis(svg, visibility) {
  clearSvg(svg);
  drawBase(svg);
  drawTicks(svg);

  const display = visibility !== undefined && visibility !== null ? `${visibility} SM` : '-- SM';

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));
}

// ── DEWPOINT GAUGE ─────────────────────────────────
function renderDew(svg, dewpoint) {
  clearSvg(svg);
  drawBase(svg);
  drawTicks(svg);

  const display = dewpoint !== null && dewpoint !== undefined ? `${Math.round(dewpoint)}°C` : '--°C';

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));
}

// ── RENDER FULL COCKPIT ────────────────────────────
function renderCockpit(data) {
  document.getElementById('cockpit-loading').classList.add('hidden');
  document.getElementById('cockpit-error').classList.add('hidden');

  document.getElementById('cockpit-id').textContent = data.id || '----';
  document.getElementById('cockpit-time').textContent = data.observation_time || '--:-- L';

  const airportInput = document.getElementById('airport-input');
  if (airportInput && data.id) airportInput.value = data.id;

  renderTemp(document.getElementById('gauge-temp'), data.temperature);
  renderWind(
    document.getElementById('gauge-wind'),
    data.wind?.direction ?? 0,
    data.wind?.speed ?? 0
  );
  renderAlt(document.getElementById('gauge-alt'), data.altimeter);
  renderFlightCategory(document.getElementById('gauge-fc'), data.flight_category);
  renderVis(document.getElementById('gauge-vis'), data.visibility);
  renderDew(document.getElementById('gauge-dew'), data.dewpoint);

  const skyText = data.sky_conditions?.map((s) => s.description).join('\n') || '—';
  document.getElementById('sky-text').textContent = skyText;
  document.getElementById('raw-metar-text').textContent = data.raw_text || '—';

  document.getElementById('instruments').classList.remove('hidden');
  document.getElementById('info-strip').classList.remove('hidden');
  document.getElementById('raw-metar-box').classList.remove('hidden');
}

// ── FETCH METAR ────────────────────────────────────
async function fetchMetar() {
  const airportInput = document.getElementById('airport-input');
  const airport = (airportInput?.value || '').toUpperCase().trim() || 'KUMP';
  localStorage.setItem(AIRPORT_KEY, airport);

  document.getElementById('cockpit-loading').classList.remove('hidden');
  document.getElementById('cockpit-error').classList.add('hidden');
  document.getElementById('instruments').classList.add('hidden');
  document.getElementById('info-strip').classList.add('hidden');
  document.getElementById('raw-metar-box').classList.add('hidden');

  try {
    const response = await fetch(`/api/metar?id=${encodeURIComponent(airport)}`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    renderCockpit(data);
  } catch (error) {
    document.getElementById('cockpit-loading').classList.add('hidden');
    const errorEl = document.getElementById('cockpit-error');
    errorEl.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    errorEl.classList.remove('hidden');
  }
}

// ── INIT ───────────────────────────────────────────
(function init() {
  const airport = localStorage.getItem(AIRPORT_KEY) || 'KUMP';
  document.getElementById('airport-input').value = airport;
  fetchMetar();
})();
