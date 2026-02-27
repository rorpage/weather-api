import type { NWSPointsResponse } from '../models/nws/NWSPointsResponse';
import type { NWSForecastResponse } from '../models/nws/NWSForecastResponse';

export class NWSService {
  private readonly userAgent = 'weather-api';

  async getHourlyForecast(
    lat: string | string[],
    lon: string | string[]
  ): Promise<NWSForecastResponse> {
    const latStr = Array.isArray(lat) ? lat[0] : lat;
    const lonStr = Array.isArray(lon) ? lon[0] : lon;

    // Step 1: Resolve lat/lon to NWS grid point
    const pointsRes = await fetch(`https://api.weather.gov/points/${latStr},${lonStr}`, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!pointsRes.ok) {
      throw new Error(`NWS API error getting grid point: ${pointsRes.status}`);
    }

    const pointsData = (await pointsRes.json()) as NWSPointsResponse;
    const { gridId, gridX, gridY } = pointsData.properties;

    // Step 2: Fetch hourly forecast for the resolved grid point
    const forecastRes = await fetch(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`,
      { headers: { 'User-Agent': this.userAgent } }
    );

    if (!forecastRes.ok) {
      throw new Error(`NWS API error getting hourly forecast: ${forecastRes.status}`);
    }

    return (await forecastRes.json()) as NWSForecastResponse;
  }
}
