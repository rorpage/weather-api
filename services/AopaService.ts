import type { AopaAirportResponse } from '../models/runway/AopaAirportResponse';

export class AopaService {
  /**
   * Fetch runway layout data from the AOPA airport directory API
   */
  async getAirport(airportId: string): Promise<AopaAirportResponse> {
    const url = `https://webapp.aopa.org/AirportsAPI/airports/${airportId}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch runway data: ${errorText}`);
    }

    return (await response.json()) as AopaAirportResponse;
  }
}
