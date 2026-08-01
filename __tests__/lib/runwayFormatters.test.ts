import { describe, it, expect } from 'vitest';
import { formatRunwayWindOutput } from '../../lib/runwayFormatters';
import type { AopaAirportResponse } from '../../models/runway/AopaAirportResponse';
import type { MetarData } from '../../models/metar/MetarData';

function buildMetar(overrides: Partial<MetarData> = {}): MetarData {
  return {
    issueTime: 1609459200,
    CloudLayers: [],
    windDir: 0,
    windSpeed: 0,
    pressure: 30,
    dewPointC: 0,
    station: 'KUMP',
    visibilityRating: 'VFR',
    rawReport: '',
    tempC: 0,
    visibilityRaw: '10SM',
    ...overrides,
  };
}

function buildAirport(overrides: Partial<AopaAirportResponse> = {}): AopaAirportResponse {
  return {
    icaoId: 'KUMP',
    name: 'Indianapolis Metropolitan Airport',
    location: { latitude: 39.9342, longitude: -86.0445 },
    landingSurfaces: [
      {
        name: '7/25',
        length: 5500,
        width: 100,
        surfaceReadable: 'Asphalt',
        takeOffLandAreas: [
          { tlaName: '07', trueAlignment: 70, latitude: 39.933, longitude: -86.05 },
          { tlaName: '25', trueAlignment: 250, latitude: 39.935, longitude: -86.039 },
        ],
      },
    ],
    ...overrides,
  };
}

describe('formatRunwayWindOutput', () => {
  it('marks the headwind runway end as very favorable with a direct headwind', () => {
    const output = formatRunwayWindOutput(
      buildAirport(),
      buildMetar({ windDir: 70, windSpeed: 10 })
    );

    const runwayEnd07 = output.runways[0].ends[0];

    expect(runwayEnd07.favorability).toBe('very_favorable');
    expect(runwayEnd07.headwind_knots).toBeCloseTo(10, 1);
    expect(runwayEnd07.crosswind_knots).toBeCloseTo(0, 1);
    expect(runwayEnd07.wind_angle_degrees).toBe(0);
  });

  it('marks the opposite runway end as not favorable (tailwind) for the same wind', () => {
    const output = formatRunwayWindOutput(
      buildAirport(),
      buildMetar({ windDir: 70, windSpeed: 10 })
    );

    const runwayEnd25 = output.runways[0].ends[1];

    expect(runwayEnd25.favorability).toBe('not_favorable');
    expect(runwayEnd25.headwind_knots).toBeCloseTo(-10, 1);
    expect(runwayEnd25.wind_angle_degrees).toBe(180);
  });

  it('marks a 90-degree crosswind as not favorable', () => {
    const output = formatRunwayWindOutput(
      buildAirport(),
      buildMetar({ windDir: 160, windSpeed: 15 })
    );

    const runwayEnd07 = output.runways[0].ends[0];

    expect(runwayEnd07.wind_angle_degrees).toBe(90);
    expect(runwayEnd07.favorability).toBe('not_favorable');
    expect(runwayEnd07.crosswind_knots).toBeCloseTo(15, 1);
  });

  it('marks a 30-degree angle as favorable but not very favorable at the 45-degree boundary', () => {
    const output = formatRunwayWindOutput(
      buildAirport(),
      buildMetar({ windDir: 115, windSpeed: 12 })
    );

    const runwayEnd07 = output.runways[0].ends[0];

    expect(runwayEnd07.wind_angle_degrees).toBe(45);
    expect(runwayEnd07.favorability).toBe('favorable');
  });

  it('normalizes headings that wrap around 0/360 degrees', () => {
    const airport = buildAirport({
      landingSurfaces: [
        {
          name: '1/19',
          length: 4000,
          width: 75,
          surfaceReadable: 'Asphalt',
          takeOffLandAreas: [
            { tlaName: '01', trueAlignment: 10, latitude: 39.933, longitude: -86.05 },
            { tlaName: '19', trueAlignment: 190, latitude: 39.935, longitude: -86.039 },
          ],
        },
      ],
    });

    const output = formatRunwayWindOutput(airport, buildMetar({ windDir: 350, windSpeed: 8 }));

    expect(output.runways[0].ends[0].wind_angle_degrees).toBe(20);
    expect(output.runways[0].ends[0].favorability).toBe('very_favorable');
  });

  it('picks the best runway identifier across multiple runways by headwind component', () => {
    const airport = buildAirport({
      landingSurfaces: [
        {
          name: '7/25',
          length: 5500,
          width: 100,
          surfaceReadable: 'Asphalt',
          takeOffLandAreas: [
            { tlaName: '07', trueAlignment: 70, latitude: 39.933, longitude: -86.05 },
            { tlaName: '25', trueAlignment: 250, latitude: 39.935, longitude: -86.039 },
          ],
        },
        {
          name: '18/36',
          length: 4000,
          width: 75,
          surfaceReadable: 'Asphalt',
          takeOffLandAreas: [
            { tlaName: '18', trueAlignment: 180, latitude: 39.936, longitude: -86.041 },
            { tlaName: '36', trueAlignment: 360, latitude: 39.938, longitude: -86.042 },
          ],
        },
      ],
    });

    const output = formatRunwayWindOutput(airport, buildMetar({ windDir: 70, windSpeed: 10 }));

    expect(output.best_runway_identifier).toBe('07');
  });

  it('defaults surface to Unknown when surfaceReadable is missing', () => {
    const airport = buildAirport();
    delete airport.landingSurfaces[0].surfaceReadable;

    const output = formatRunwayWindOutput(airport, buildMetar());

    expect(output.runways[0].surface).toBe('Unknown');
  });

  it('ignores landing surfaces with fewer than two ends', () => {
    const airport = buildAirport({
      landingSurfaces: [
        ...buildAirport().landingSurfaces,
        {
          name: 'H1',
          length: 100,
          width: 100,
          surfaceReadable: 'Turf',
          takeOffLandAreas: [
            { tlaName: 'H1', trueAlignment: 0, latitude: 39.93, longitude: -86.04 },
          ],
        },
      ],
    });

    const output = formatRunwayWindOutput(airport, buildMetar());

    expect(output.runways).toHaveLength(1);
  });

  it('throws when no runway has two ends', () => {
    const airport = buildAirport({
      landingSurfaces: [
        {
          name: 'H1',
          length: 100,
          width: 100,
          surfaceReadable: 'Turf',
          takeOffLandAreas: [
            { tlaName: 'H1', trueAlignment: 0, latitude: 39.93, longitude: -86.04 },
          ],
        },
      ],
    });

    expect(() => formatRunwayWindOutput(airport, buildMetar())).toThrow(
      'No runway data available for KUMP'
    );
  });

  it('includes airport identity and wind fields at the top level', () => {
    const output = formatRunwayWindOutput(
      buildAirport(),
      buildMetar({ windDir: 70, windSpeed: 10 })
    );

    expect(output.airport_id).toBe('KUMP');
    expect(output.airport_name).toBe('Indianapolis Metropolitan Airport');
    expect(output.wind_direction_degrees).toBe(70);
    expect(output.wind_speed_knots).toBe(10);
  });
});
