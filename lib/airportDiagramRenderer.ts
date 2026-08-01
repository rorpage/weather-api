import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import type { RunwayEndOutput, RunwayOutput } from '../models/runway/RunwayWindOutput';

const CANVAS_SIZE = 350;
const PADDING = 40;
const END_MARKER_RADIUS = 14;
const EARTH_RADIUS_METERS = 6371000;
const RENDER_SCALE = 8;
const FONT_FAMILY = 'DejaVu Sans Mono';
// Vercel's serverless runtime has no system fonts installed, so resvg-js needs
// a font file bundled and loaded explicitly, or all SVG text renders blank.
const FONT_FILE_PATH = path.join(__dirname, '..', 'assets', 'fonts', 'DejaVuSansMono-Bold.ttf');

export type DiagramTheme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  north: string;
}

// Dark values match Chaplin's fixed (always-dark) airport diagram palette.
const THEMES: Record<DiagramTheme, ThemeColors> = {
  light: { background: 'rgb(209, 213, 219)', north: 'rgb(22, 163, 74)' },
  dark: { background: '#444444', north: '#b3f43d' },
};

interface Point {
  x: number;
  y: number;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function haversineDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const deltaLatitude = toRadians(latitude2 - latitude1);
  const deltaLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const startLatitude = toRadians(latitude1);
  const endLatitude = toRadians(latitude2);
  const deltaLongitude = toRadians(longitude2 - longitude1);

  const y = Math.sin(deltaLongitude) * Math.cos(endLatitude);
  const x =
    Math.cos(startLatitude) * Math.sin(endLatitude) -
    Math.sin(startLatitude) * Math.cos(endLatitude) * Math.cos(deltaLongitude);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Projects each runway end's lat/lon onto a local, north-up, scaled canvas
 * centered on the centroid of all ends (mirrors Chaplin's airport-diagram.tsx).
 */
function projectRunwayEnds(ends: RunwayEndOutput[]): Map<RunwayEndOutput, Point> {
  const positions = new Map<RunwayEndOutput, Point>();

  if (ends.length === 0) {
    return positions;
  }

  const originLatitude = ends.reduce((sum, end) => sum + end.latitude, 0) / ends.length;
  const originLongitude = ends.reduce((sum, end) => sum + end.longitude, 0) / ends.length;

  const localMeters = ends.map((end) => {
    const distanceMeters = haversineDistanceMeters(
      originLatitude,
      originLongitude,
      end.latitude,
      end.longitude
    );
    const bearingRadians = toRadians(
      bearingDegrees(originLatitude, originLongitude, end.latitude, end.longitude)
    );

    return {
      end,
      x: distanceMeters * Math.sin(bearingRadians),
      y: -distanceMeters * Math.cos(bearingRadians),
    };
  });

  const maxExtent = localMeters.reduce(
    (max, point) => Math.max(max, Math.hypot(point.x, point.y)),
    0
  );
  const availableRadius = CANVAS_SIZE / 2 - PADDING - END_MARKER_RADIUS;
  const scale = maxExtent > 0 ? availableRadius / maxExtent : 0;
  const center = CANVAS_SIZE / 2;

  localMeters.forEach((point) => {
    positions.set(point.end, { x: center + point.x * scale, y: center + point.y * scale });
  });

  return positions;
}

function endMarkerColors(favorability: RunwayEndOutput['favorability']): {
  outer: string;
  inner: string;
} {
  if (favorability === 'favorable') {
    return { outer: 'rgb(30, 64, 175)', inner: 'rgb(37, 99, 235)' };
  }

  if (favorability === 'very_favorable') {
    return { outer: 'rgb(22, 101, 52)', inner: 'rgb(22, 163, 74)' };
  }

  return { outer: 'rgb(75, 85, 99)', inner: 'rgb(75, 85, 99)' };
}

function endMarkerSvg(point: Point, favorability: RunwayEndOutput['favorability']): string {
  const { outer, inner } = endMarkerColors(favorability);

  return (
    `<circle cx="${point.x}" cy="${point.y}" r="${END_MARKER_RADIUS}" fill="${outer}" />` +
    `<circle cx="${point.x}" cy="${point.y}" r="${END_MARKER_RADIUS - 2}" fill="${inner}" />`
  );
}

/**
 * Builds an SVG airport diagram: a compass-rose canvas with each runway drawn
 * as a centerline between its two ends, and each end color-coded by wind
 * favorability. Mirrors Chaplin's airport-diagram.tsx component.
 */
export function buildAirportDiagramSvg(
  runways: RunwayOutput[],
  theme: DiagramTheme = 'light'
): string {
  const { background, north } = THEMES[theme];
  const ends = runways.flatMap((runway) => runway.ends);
  const positions = projectRunwayEnds(ends);
  const center = CANVAS_SIZE / 2;

  const runwayShapes = runways
    .map((runway) => {
      const [lowEnd, highEnd] = runway.ends;
      const lowPoint = positions.get(lowEnd);
      const highPoint = positions.get(highEnd);

      if (!lowPoint || !highPoint) {
        return '';
      }

      return `
        <line x1="${lowPoint.x}" y1="${lowPoint.y}" x2="${highPoint.x}" y2="${highPoint.y}" stroke="rgb(75, 85, 99)" stroke-width="10" />
        <line x1="${lowPoint.x}" y1="${lowPoint.y}" x2="${highPoint.x}" y2="${highPoint.y}" stroke="rgb(208, 214, 224)" stroke-dasharray="8,12" stroke-width="1" />
        ${endMarkerSvg(lowPoint, lowEnd.favorability)}
        <text x="${lowPoint.x}" y="${lowPoint.y + 4}" fill="white" font-family="${FONT_FAMILY}" font-size="13" font-weight="bold" text-anchor="middle">${lowEnd.identifier}</text>
        ${endMarkerSvg(highPoint, highEnd.favorability)}
        <text x="${highPoint.x}" y="${highPoint.y + 4}" fill="white" font-family="${FONT_FAMILY}" font-size="13" font-weight="bold" text-anchor="middle">${highEnd.identifier}</text>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">
    <circle cx="${center}" cy="${center}" r="${center}" fill="${background}" />
    ${runwayShapes}
    <polygon fill="${north}" points="${center},6 ${center - 7},20 ${center + 7},20" />
    <text x="${center}" y="35" fill="${north}" font-family="${FONT_FAMILY}" font-size="16" font-weight="bold" text-anchor="middle">N</text>
  </svg>`;
}

/**
 * Renders the airport diagram to a PNG buffer, oversampled to RENDER_SCALE
 * for a crisp image since the SVG's native size (CANVAS_SIZE) is small.
 */
export function renderAirportDiagramPng(
  runways: RunwayOutput[],
  theme: DiagramTheme = 'light'
): Buffer {
  const svg = buildAirportDiagramSvg(runways, theme);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: CANVAS_SIZE * RENDER_SCALE },
    font: {
      fontFiles: [FONT_FILE_PATH],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  });

  return resvg.render().asPng();
}
