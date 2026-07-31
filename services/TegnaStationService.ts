import type { TegnaHeaderResponse } from '../models/tegna/TegnaHeaderResponse';

export class TegnaStationService {
  /**
   * Fetch current conditions and hourly forecast from a TEGNA station's page-header API
   * (e.g. WTHR in Indianapolis, KARE 11 in Minneapolis)
   */
  async getHeaderData(host: string): Promise<TegnaHeaderResponse> {
    const response = await fetch(`https://${host}/ajax/content/header`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch weather data from ${host}: ${errorText}`);
    }

    return (await response.json()) as TegnaHeaderResponse;
  }
}
