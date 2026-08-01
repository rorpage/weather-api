import { describe, it, expect } from 'vitest';
import {
  fcColorDark,
  fcColorLight,
  formatCelsius,
  formatAltimeter,
  formatVisibility,
  isWindCalm,
  windArcGeometry,
  tickEndpoints,
  cardinalLabelPosition,
} from '../../public/gaugeFormatting.js';

describe('fcColorDark', () => {
  it('returns the dark color for each known flight category', () => {
    expect(fcColorDark('VFR')).toBe('#0C4C24');
    expect(fcColorDark('MVFR')).toBe('#1d4ed8');
    expect(fcColorDark('IFR')).toBe('#b91c1c');
    expect(fcColorDark('LIFR')).toBe('#a21caf');
  });

  it('is case-insensitive', () => {
    expect(fcColorDark('vfr')).toBe('#0C4C24');
  });

  it('falls back to gray for an unknown or missing category', () => {
    expect(fcColorDark('UNKNOWN')).toBe('#444');
    expect(fcColorDark(undefined)).toBe('#444');
    expect(fcColorDark('')).toBe('#444');
  });
});

describe('fcColorLight', () => {
  it('returns the light color for each known flight category', () => {
    expect(fcColorLight('VFR')).toBe('#15803d');
    expect(fcColorLight('MVFR')).toBe('#2563eb');
    expect(fcColorLight('IFR')).toBe('#dc2626');
    expect(fcColorLight('LIFR')).toBe('#c026d3');
  });

  it('falls back to light gray for an unknown or missing category', () => {
    expect(fcColorLight('UNKNOWN')).toBe('#aaa');
    expect(fcColorLight(undefined)).toBe('#aaa');
  });
});

describe('formatCelsius', () => {
  it('rounds and appends the degree symbol', () => {
    expect(formatCelsius(12.4)).toBe('12°C');
    expect(formatCelsius(12.6)).toBe('13°C');
    expect(formatCelsius(0)).toBe('0°C');
    expect(formatCelsius(-5)).toBe('-5°C');
  });

  it('shows a placeholder when the value is null or undefined', () => {
    expect(formatCelsius(null)).toBe('--°C');
    expect(formatCelsius(undefined)).toBe('--°C');
  });
});

describe('formatAltimeter', () => {
  it('appends inHg to a truthy value', () => {
    expect(formatAltimeter(29.94)).toBe('29.94 inHg');
  });

  it('shows a placeholder for falsy values', () => {
    expect(formatAltimeter(0)).toBe('-- inHg');
    expect(formatAltimeter(null)).toBe('-- inHg');
    expect(formatAltimeter(undefined)).toBe('-- inHg');
  });
});

describe('formatVisibility', () => {
  it('appends SM to a numeric value, including zero', () => {
    expect(formatVisibility(10)).toBe('10 SM');
    expect(formatVisibility(0)).toBe('0 SM');
  });

  it('shows a placeholder when null or undefined', () => {
    expect(formatVisibility(null)).toBe('-- SM');
    expect(formatVisibility(undefined)).toBe('-- SM');
  });
});

describe('isWindCalm', () => {
  it('is calm only when both direction and speed are zero', () => {
    expect(isWindCalm(0, 0)).toBe(true);
    expect(isWindCalm(270, 0)).toBe(false);
    expect(isWindCalm(0, 5)).toBe(false);
    expect(isWindCalm(270, 12)).toBe(false);
  });
});

describe('windArcGeometry', () => {
  it('computes an arc length proportional to the arc span', () => {
    const radius = 91;
    const { arcLength, gapLength } = windArcGeometry(0, radius, 10);
    const circumference = 2 * Math.PI * radius;

    expect(arcLength).toBeCloseTo((10 / 360) * circumference, 5);
    expect(arcLength + gapLength).toBeCloseTo(circumference, 5);
  });

  it('rotates the arc to center on the wind direction', () => {
    const { rotateAngle } = windArcGeometry(270, 91, 10);

    expect(rotateAngle).toBe(270 - 5 - 90);
  });

  it('defaults the arc span to 10 degrees', () => {
    const withDefault = windArcGeometry(180, 91);
    const explicit = windArcGeometry(180, 91, 10);

    expect(withDefault).toEqual(explicit);
  });
});

describe('tickEndpoints', () => {
  it('places a 0-degree tick straight up from center', () => {
    const { x1, y1, x2, y2 } = tickEndpoints(0, 85, 10);

    expect(x1).toBeCloseTo(100, 5);
    expect(y1).toBeCloseTo(100 - 85, 5);
    expect(x2).toBeCloseTo(100, 5);
    expect(y2).toBeCloseTo(100 - 75, 5);
  });

  it('places a 90-degree tick to the right of center', () => {
    const { x1, y1 } = tickEndpoints(90, 85, 10);

    expect(x1).toBeCloseTo(100 + 85, 5);
    expect(y1).toBeCloseTo(100, 5);
  });

  it('honors a custom center point', () => {
    const { x1, y1 } = tickEndpoints(0, 10, 5, 50, 50);

    expect(x1).toBeCloseTo(50, 5);
    expect(y1).toBeCloseTo(40, 5);
  });
});

describe('cardinalLabelPosition', () => {
  it('places N above center', () => {
    const { x, y } = cardinalLabelPosition(0, 60);

    expect(x).toBeCloseTo(100, 5);
    expect(y).toBeCloseTo(100 - 60 + 5, 5);
  });

  it('places E to the right of center', () => {
    const { x, y } = cardinalLabelPosition(90, 60);

    expect(x).toBeCloseTo(100 + 60, 5);
    expect(y).toBeCloseTo(100 + 5, 5);
  });
});
