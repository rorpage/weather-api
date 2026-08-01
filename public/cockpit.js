const AIRPORT_KEY = 'metar_airport';

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
    const tickLength = deg % 30 === 0 ? 10 : 5;
    const { x1, y1, x2, y2 } = tickEndpoints(deg, 85, tickLength);
    svg.appendChild(svgEl('line', {
      x1, y1, x2, y2,
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

  const display = formatCelsius(tempC);

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));

  svg.setAttribute('aria-label', `Temperature: ${display}`);
}

// ── WIND GAUGE ─────────────────────────────────────
// Compass rose with a white arc on the outer bezel showing wind direction.
function renderWind(svg, windDirection, windSpeed) {
  clearSvg(svg);
  drawBase(svg);

  const isCalm = isWindCalm(windDirection, windSpeed);

  // White arc on the outer bezel ring highlighting the wind direction.
  // The arc is drawn at r=91 (midpoint of the bezel between r=87 and r=96)
  // with stroke-width=8 so it stays within the bezel.
  if (!isCalm) {
    const arcRadius = 91;
    const { arcLength, gapLength, rotateAngle } = windArcGeometry(windDirection, arcRadius, 10);
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
    const tickLength = deg % 30 === 0 ? 10 : 5;
    const { x1, y1, x2, y2 } = tickEndpoints(deg, 84, tickLength);
    svg.appendChild(svgEl('line', {
      x1, y1, x2, y2,
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
    const { x, y } = cardinalLabelPosition(angle, 60);
    svg.appendChild(svgText(label, {
      x, y,
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
    svg.setAttribute('aria-label', 'Wind: Calm');
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
    svg.setAttribute('aria-label', `Wind: ${windSpeed} kt at ${windDirection}°`);
  }
}

// ── ALTIMETER GAUGE ────────────────────────────────
function renderAlt(svg, altimeter) {
  clearSvg(svg);
  drawBase(svg);
  drawTicks(svg);

  const display = formatAltimeter(altimeter);

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));

  svg.setAttribute('aria-label', `Altimeter: ${display}`);
}

// ── FLIGHT CATEGORY GAUGE ──────────────────────────
// Dark outer ring + slightly lighter (but still accessible) inner circle.
function renderFlightCategory(svg, category) {
  clearSvg(svg);
  const colorDark = fcColorDark(category);
  const colorLight = fcColorLight(category);

  // Outer circle filled with the dark category color (forms the colored ring)
  svg.appendChild(svgEl('circle', {
    cx: 100, cy: 100, r: 96,
    fill: colorDark, stroke: '#000', 'stroke-width': 5,
  }));

  // Inner circle — uses a darker shade so white text stays accessible
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

  svg.setAttribute('aria-label', `Flight Category: ${cat}`);
}

// ── VISIBILITY GAUGE ───────────────────────────────
function renderVis(svg, visibility) {
  clearSvg(svg);
  drawBase(svg);
  drawTicks(svg);

  const display = formatVisibility(visibility);

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));

  svg.setAttribute('aria-label', `Visibility: ${display}`);
}

// ── DEWPOINT GAUGE ─────────────────────────────────
function renderDew(svg, dewpoint) {
  clearSvg(svg);
  drawBase(svg);
  drawTicks(svg);

  const display = formatCelsius(dewpoint);

  svg.appendChild(svgText(display, {
    x: 100, y: 108,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-family': "'Share Tech Mono', monospace",
    'font-size': 24,
    'font-weight': 'bold',
  }));

  svg.setAttribute('aria-label', `Dewpoint: ${display}`);
}

// ── RENDER FULL COCKPIT ────────────────────────────
function renderCockpit(data) {
  document.getElementById('cockpit-loading').classList.add('hidden');
  document.getElementById('cockpit-error').classList.add('hidden');

  const cockpitId = document.getElementById('cockpit-id');
  cockpitId.textContent = data.id || '----';
  cockpitId.setAttribute('aria-label', `Airport: ${data.id || '----'}`);
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
