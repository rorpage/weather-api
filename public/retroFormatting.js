// retroFormatting.js — pure display formatting for the WeatherStar-style retro
// display. Loaded as a plain script (no bundler); retro.js does all the DOM work.

function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

function formatDualTemperature(celsius) {
  if (celsius === null || celsius === undefined) return '--';

  return `${celsiusToFahrenheit(celsius)}°F / ${Math.round(celsius)}°C`;
}

function formatWindDisplay(wind) {
  if (!wind) return '--';

  const isCalm = wind.direction === 0 && wind.speed === 0;

  return isCalm ? 'CALM' : `${wind.speed} KT @ ${wind.direction}°`;
}

function formatVisibility(visibility) {
  return visibility !== undefined && visibility !== null ? `${visibility} SM` : '--';
}

function formatAltimeter(altimeter) {
  return altimeter ? `${altimeter} inHg` : '--';
}

function formatSkyConditions(skyConditions) {
  return skyConditions?.length
    ? skyConditions.map((sky) => sky.description.toUpperCase()).join('\n')
    : 'CLEAR';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    celsiusToFahrenheit,
    formatDualTemperature,
    formatWindDisplay,
    formatVisibility,
    formatAltimeter,
    formatSkyConditions,
  };
}
