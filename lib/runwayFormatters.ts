import type { AopaAirportResponse, AopaRunwayEnd } from '../models/runway/AopaAirportResponse';
import type { MetarData } from '../models/metar/MetarData';
import type {
  RunwayEndOutput,
  RunwayFavorability,
  RunwayOutput,
  RunwayWindOutput,
} from '../models/runway/RunwayWindOutput';

const FAVORABILITY_RANK: Record<RunwayFavorability, number> = {
  not_favorable: 0,
  favorable: 1,
  very_favorable: 2,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Smallest angle (0-180) between two compass headings.
 */
function headingDifferenceDegrees(headingA: number, headingB: number): number {
  const difference = Math.abs(headingA - headingB) % 360;

  return difference > 180 ? 360 - difference : difference;
}

function favorabilityFor(windAngleDegrees: number): RunwayFavorability {
  if (windAngleDegrees >= 90) {
    return 'not_favorable';
  }

  return windAngleDegrees < 45 ? 'very_favorable' : 'favorable';
}

function formatRunwayEnd(
  end: AopaRunwayEnd,
  windDirectionDegrees: number,
  windSpeedKnots: number
): RunwayEndOutput {
  const windAngleDegrees = headingDifferenceDegrees(end.trueAlignment, windDirectionDegrees);
  const windAngleRadians = toRadians(windAngleDegrees);

  return {
    identifier: end.tlaName,
    heading_degrees: end.trueAlignment,
    latitude: end.latitude,
    longitude: end.longitude,
    crosswind_knots: Math.round(windSpeedKnots * Math.sin(windAngleRadians) * 10) / 10,
    headwind_knots: Math.round(windSpeedKnots * Math.cos(windAngleRadians) * 10) / 10,
    wind_angle_degrees: Math.round(windAngleDegrees),
    favorability: favorabilityFor(windAngleDegrees),
  };
}

function pickBestRunwayEnd(ends: RunwayEndOutput[]): RunwayEndOutput {
  return ends.reduce((best, candidate) => {
    const bestRank = FAVORABILITY_RANK[best.favorability];
    const candidateRank = FAVORABILITY_RANK[candidate.favorability];

    if (candidateRank !== bestRank) {
      return candidateRank > bestRank ? candidate : best;
    }

    return candidate.headwind_knots > best.headwind_knots ? candidate : best;
  });
}

/**
 * Combines AOPA runway layout data with Garmin METAR wind data into the
 * runway-wind output, scoring each runway end's crosswind/headwind favorability.
 */
export function formatRunwayWindOutput(
  airport: AopaAirportResponse,
  metar: MetarData
): RunwayWindOutput {
  const windDirectionDegrees = metar.windDir;
  const windSpeedKnots = metar.windSpeed;

  const runways: RunwayOutput[] = airport.landingSurfaces
    .filter((surface) => surface.takeOffLandAreas.length >= 2)
    .map((surface) => {
      const [lowEnd, highEnd] = surface.takeOffLandAreas;

      return {
        name: surface.name,
        length_feet: surface.length,
        width_feet: surface.width,
        surface: surface.surfaceReadable ?? 'Unknown',
        ends: [
          formatRunwayEnd(lowEnd, windDirectionDegrees, windSpeedKnots),
          formatRunwayEnd(highEnd, windDirectionDegrees, windSpeedKnots),
        ] as [RunwayEndOutput, RunwayEndOutput],
      };
    });

  const allEnds = runways.flatMap((runway) => runway.ends);

  if (allEnds.length === 0) {
    throw new Error(`No runway data available for ${airport.icaoId}`);
  }

  return {
    airport_id: airport.icaoId,
    airport_name: airport.name,
    wind_direction_degrees: windDirectionDegrees,
    wind_speed_knots: windSpeedKnots,
    best_runway_identifier: pickBestRunwayEnd(allEnds).identifier,
    runways,
  };
}
