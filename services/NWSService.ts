import type { NWSPointsResponse } from '../models/nws/NWSPointsResponse';
import type { NWSForecastResponse } from '../models/nws/NWSForecastResponse';

export class NWSService {
  private readonly userAgent = 'weather-api';

  async getHourlyForecast(
    latitude: string | string[],
    longitude: string | string[]
  ): Promise<NWSForecastResponse> {
    const latitudeValue = Array.isArray(latitude) ? latitude[0] : latitude;
    const longitudeValue = Array.isArray(longitude) ? longitude[0] : longitude;

    // Step 1: Resolve latitude/longitude to NWS grid point
    const pointsResponse = await fetch(
      `https://api.weather.gov/points/${latitudeValue},${longitudeValue}`,
      {
        headers: { 'User-Agent': this.userAgent },
      }
    );

    if (!pointsResponse.ok) {
      throw new Error(`NWS API error getting grid point: ${pointsResponse.status}`);
    }

    const pointsData = (await pointsResponse.json()) as NWSPointsResponse;
    const { gridId, gridX, gridY } = pointsData.properties;

    // Step 2: Fetch hourly forecast for the resolved grid point
    const forecastResponse = await fetch(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`,
      { headers: { 'User-Agent': this.userAgent } }
    );

    if (!forecastResponse.ok) {
      throw new Error(`NWS API error getting hourly forecast: ${forecastResponse.status}`);
    }

    return (await forecastResponse.json()) as NWSForecastResponse;
  }
}
