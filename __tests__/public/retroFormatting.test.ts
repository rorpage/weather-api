import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  formatDualTemperature,
  formatWindDisplay,
  formatVisibility,
  formatAltimeter,
  formatSkyConditions,
} from '../../public/retroFormatting.js';

describe('celsiusToFahrenheit', () => {
  it('converts and rounds to the nearest degree', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(7)).toBe(45);
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });
});

describe('formatDualTemperature', () => {
  it('formats as Fahrenheit / Celsius', () => {
    expect(formatDualTemperature(7)).toBe('45°F / 7°C');
    expect(formatDualTemperature(0)).toBe('32°F / 0°C');
  });

  it('shows a placeholder when null or undefined', () => {
    expect(formatDualTemperature(null)).toBe('--');
    expect(formatDualTemperature(undefined)).toBe('--');
  });
});

describe('formatWindDisplay', () => {
  it('shows CALM when direction and speed are both zero', () => {
    expect(formatWindDisplay({ direction: 0, speed: 0 })).toBe('CALM');
  });

  it('shows speed and direction otherwise', () => {
    expect(formatWindDisplay({ direction: 270, speed: 12 })).toBe('12 KT @ 270°');
    expect(formatWindDisplay({ direction: 0, speed: 5 })).toBe('5 KT @ 0°');
  });

  it('shows a placeholder when wind data is missing', () => {
    expect(formatWindDisplay(null)).toBe('--');
    expect(formatWindDisplay(undefined)).toBe('--');
  });
});

describe('formatVisibility', () => {
  it('appends SM to a numeric value, including zero', () => {
    expect(formatVisibility(10)).toBe('10 SM');
    expect(formatVisibility(0)).toBe('0 SM');
  });

  it('shows a placeholder when null or undefined', () => {
    expect(formatVisibility(null)).toBe('--');
    expect(formatVisibility(undefined)).toBe('--');
  });
});

describe('formatAltimeter', () => {
  it('appends inHg to a truthy value', () => {
    expect(formatAltimeter(29.94)).toBe('29.94 inHg');
  });

  it('shows a placeholder for falsy values', () => {
    expect(formatAltimeter(0)).toBe('--');
    expect(formatAltimeter(null)).toBe('--');
    expect(formatAltimeter(undefined)).toBe('--');
  });
});

describe('formatSkyConditions', () => {
  it('uppercases and joins descriptions with newlines', () => {
    const skyConditions = [
      { description: 'few at 5000ft' },
      { description: 'scattered at 8000ft' },
    ];

    expect(formatSkyConditions(skyConditions)).toBe('FEW AT 5000FT\nSCATTERED AT 8000FT');
  });

  it('shows CLEAR when there are no sky conditions', () => {
    expect(formatSkyConditions([])).toBe('CLEAR');
    expect(formatSkyConditions(undefined)).toBe('CLEAR');
  });
});
