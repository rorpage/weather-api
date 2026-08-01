// gaugeFormatting.js — pure formatting/geometry helpers for the cockpit gauges.
// Loaded as a plain script (no bundler), so it stays free of DOM access to
// remain testable under Node; cockpit.js does all the SVG drawing.

const FC_COLORS_DARK = {
  VFR: '#0C4C24',
  MVFR: '#1d4ed8',
  IFR: '#b91c1c',
  LIFR: '#a21caf',
};

const FC_COLORS_LIGHT = {
  VFR: '#15803d',
  MVFR: '#2563eb',
  IFR: '#dc2626',
  LIFR: '#c026d3',
};

function fcColorDark(category) {
  return FC_COLORS_DARK[(category || '').toUpperCase()] || '#444';
}

function fcColorLight(category) {
  return FC_COLORS_LIGHT[(category || '').toUpperCase()] || '#aaa';
}

function formatCelsius(value) {
  return value !== null && value !== undefined ? `${Math.round(value)}°C` : '--°C';
}

function formatAltimeter(altimeter) {
  return altimeter ? `${altimeter} inHg` : '-- inHg';
}

function formatVisibility(visibility) {
  return visibility !== undefined && visibility !== null ? `${visibility} SM` : '-- SM';
}

function isWindCalm(windDirection, windSpeed) {
  return windDirection === 0 && windSpeed === 0;
}

// Arc length/gap (for stroke-dasharray) and rotation for the wind gauge's
// direction arc, drawn on a circle of the given radius.
function windArcGeometry(windDirection, radius, arcSpanDeg = 10) {
  const circumference = 2 * Math.PI * radius;
  const arcLength = (arcSpanDeg / 360) * circumference;
  const gapLength = circumference - arcLength;
  const rotateAngle = windDirection - arcSpanDeg / 2 - 90;

  return { arcLength, gapLength, rotateAngle };
}

// Endpoints of a tick mark at `deg` degrees around a circle. Compass 0deg is
// straight up, so headings are rotated -90deg to match SVG's 3-o'clock zero.
function tickEndpoints(deg, outerRadius, tickLength, centerX = 100, centerY = 100) {
  const rad = ((deg - 90) * Math.PI) / 180;

  return {
    x1: centerX + outerRadius * Math.cos(rad),
    y1: centerY + outerRadius * Math.sin(rad),
    x2: centerX + (outerRadius - tickLength) * Math.cos(rad),
    y2: centerY + (outerRadius - tickLength) * Math.sin(rad),
  };
}

// Position of a cardinal direction label (N/E/S/W) at `angle` degrees.
function cardinalLabelPosition(angle, labelRadius, centerX = 100, centerY = 100) {
  const rad = ((angle - 90) * Math.PI) / 180;

  return {
    x: centerX + labelRadius * Math.cos(rad),
    y: centerY + labelRadius * Math.sin(rad) + 5,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fcColorDark,
    fcColorLight,
    formatCelsius,
    formatAltimeter,
    formatVisibility,
    isWindCalm,
    windArcGeometry,
    tickEndpoints,
    cardinalLabelPosition,
  };
}
