import type { HearstWeatherResponse } from '../models/hearst/HearstWeatherResponse';

export class HearstStationService {
  /**
   * Fetch current conditions and hourly forecast from a Hearst Television station's
   * shared weather API (e.g. WISN in Milwaukee), scoped by zip code.
   */
  async getWeatherData(zip: string): Promise<HearstWeatherResponse> {
    const response = await fetch(`https://weather.htvapps.com/api/v1/weather/full/${zip}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch weather data for zip ${zip}: ${errorText}`);
    }

    return (await response.json()) as HearstWeatherResponse;
  }
}
