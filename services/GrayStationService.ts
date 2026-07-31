import type { GrayWeatherResponse } from '../models/gray/GrayWeatherResponse';

export class GrayStationService {
  /**
   * Fetch current conditions and hourly forecast from a Gray Television station's
   * Arc XP content-fetch API (e.g. WMTV in Madison, WEAU in Eau Claire). Each station's
   * site returns data pre-scoped to its own market, no location parameter needed.
   */
  async getWeatherData(host: string): Promise<GrayWeatherResponse> {
    const response = await fetch(
      `https://${host}/pf/api/v3/content/fetch/wx-current-conditions-v3`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch weather data from ${host}: ${errorText}`);
    }

    return (await response.json()) as GrayWeatherResponse;
  }
}
