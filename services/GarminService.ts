import type { AirportResponse } from '../models/metar/AirportResponse';
import type { MetarResponse } from '../models/metar/MetarResponse';

export class GarminService {
  /**
   * Fetch airport information from Garmin API
   */
  async getAirportInfo(airportId: string): Promise<AirportResponse> {
    const url = `https://pilotweb.garmin.com/api/v1/airports/${airportId}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch airport data: ${errorText}`);
    }

    return (await response.json()) as AirportResponse;
  }

  /**
   * Fetch METAR data from Garmin API using coordinates
   */
  async getMetar(lat: number, lon: number): Promise<MetarResponse> {
    const url = new URL('https://pilotweb.garmin.com/api/v1/wx/metar');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch METAR data: ${errorText}`);
    }

    return (await response.json()) as MetarResponse;
  }
}
