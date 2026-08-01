import { describe, it, expect } from 'vitest';
import { buildAirportDiagramSvg, renderAirportDiagramPng } from '../../lib/airportDiagramRenderer';
import type { RunwayEndOutput, RunwayOutput } from '../../models/runway/RunwayWindOutput';

function buildEnd(overrides: Partial<RunwayEndOutput>): RunwayEndOutput {
  return {
    identifier: '07',
    heading_degrees: 70,
    latitude: 39.933,
    longitude: -86.05,
    crosswind_knots: 0,
    headwind_knots: 10,
    wind_angle_degrees: 0,
    favorability: 'very_favorable',
    ...overrides,
  };
}

function buildRunways(): RunwayOutput[] {
  return [
    {
      name: '7/25',
      length_feet: 5500,
      width_feet: 100,
      surface: 'Asphalt',
      ends: [
        buildEnd({
          identifier: '07',
          favorability: 'very_favorable',
          latitude: 39.933,
          longitude: -86.05,
        }),
        buildEnd({
          identifier: '25',
          favorability: 'not_favorable',
          latitude: 39.935,
          longitude: -86.039,
        }),
      ],
    },
    {
      name: '18/36',
      length_feet: 4000,
      width_feet: 75,
      surface: 'Asphalt',
      ends: [
        buildEnd({
          identifier: '18',
          favorability: 'favorable',
          latitude: 39.936,
          longitude: -86.041,
        }),
        buildEnd({
          identifier: '36',
          favorability: 'not_favorable',
          latitude: 39.938,
          longitude: -86.042,
        }),
      ],
    },
  ];
}

describe('buildAirportDiagramSvg', () => {
  it('produces a valid SVG document sized to the canvas', () => {
    const svg = buildAirportDiagramSvg(buildRunways());

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350">');
    expect(svg.trim().endsWith('</svg>')).toBe(true);
  });

  it('labels every runway end with its identifier', () => {
    const svg = buildAirportDiagramSvg(buildRunways());

    expect(svg).toContain('>07<');
    expect(svg).toContain('>25<');
    expect(svg).toContain('>18<');
    expect(svg).toContain('>36<');
  });

  it('gives runway end labels a visible fill and an embeddable font', () => {
    const svg = buildAirportDiagramSvg(buildRunways());

    expect(svg).toMatch(/<text[^>]*fill="white"[^>]*>07</);
    expect(svg).toContain('font-family="DejaVu Sans Mono"');
  });

  it('color-codes favorable ends differently from not-favorable ends', () => {
    const svg = buildAirportDiagramSvg(buildRunways());

    expect(svg).toContain('rgb(22, 101, 52)'); // very favorable
    expect(svg).toContain('rgb(30, 64, 175)'); // favorable
    expect(svg).toContain('rgb(75, 85, 99)'); // not favorable
  });

  it('draws a north indicator', () => {
    const svg = buildAirportDiagramSvg(buildRunways());

    expect(svg).toContain('>N<');
  });

  it('handles a single runway without throwing', () => {
    const svg = buildAirportDiagramSvg([buildRunways()[0]]);

    expect(svg).toContain('<svg');
  });

  it('handles an empty runway list without throwing', () => {
    const svg = buildAirportDiagramSvg([]);

    expect(svg).toContain('<svg');
    expect(svg).not.toContain('<line');
  });

  it('defaults to the light theme background and north color', () => {
    const svg = buildAirportDiagramSvg(buildRunways());

    expect(svg).toContain('fill="rgb(209, 213, 219)"');
    expect(svg).toContain('fill="rgb(22, 163, 74)"');
  });

  it('uses the dark theme background and north color matching Chaplin when requested', () => {
    const svg = buildAirportDiagramSvg(buildRunways(), 'dark');

    expect(svg).toContain('fill="#444444"');
    expect(svg).toContain('fill="#b3f43d"');
    expect(svg).not.toContain('fill="rgb(209, 213, 219)"');
  });
});

describe('renderAirportDiagramPng', () => {
  it('renders a valid PNG buffer', () => {
    const png = renderAirportDiagramPng(buildRunways());
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.subarray(0, 8)).toEqual(pngSignature);
  });

  it('oversamples the PNG well past the SVG canvas size for a crisp image', () => {
    const png = renderAirportDiagramPng(buildRunways());
    // PNG IHDR chunk: width is a big-endian uint32 at byte offset 16.
    const width = png.readUInt32BE(16);

    expect(width).toBe(2800);
  });

  it('renders a valid PNG buffer for the dark theme', () => {
    const png = renderAirportDiagramPng(buildRunways(), 'dark');
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(png.subarray(0, 8)).toEqual(pngSignature);
  });
});
