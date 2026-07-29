import type { WeatherResponse } from '../models/weather/WeatherResponse';
import type { GeocodingResponse } from '../models/weather/GeocodingResponse';

export class OpenWeatherMapService {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      throw new Error('OPENWEATHERMAP_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch current weather data from OpenWeatherMap One Call API 3.0
   */
  async getCurrentWeather(
    latitude: string | string[],
    longitude: string | string[],
    units: string = 'metric'
  ): Promise<WeatherResponse> {
    const latitudeValue = Array.isArray(latitude) ? latitude[0] : latitude;
    const longitudeValue = Array.isArray(longitude) ? longitude[0] : longitude;

    const url = new URL('https://api.openweathermap.org/data/3.0/onecall');
    url.searchParams.set('lat', latitudeValue);
    url.searchParams.set('lon', longitudeValue);
    url.searchParams.set('units', units);
    url.searchParams.set('exclude', 'minutely,hourly,alerts');
    url.searchParams.set('appid', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch weather data: ${JSON.stringify(errorData)}`);
    }

    return (await response.json()) as WeatherResponse;
  }

  /**
   * Resolve a zip/postal code to coordinates using the OpenWeatherMap Geocoding API
   */
  async getCoordinatesFromZip(
    zip: string | string[],
    countryCode: string = 'US'
  ): Promise<GeocodingResponse> {
    const zipValue = Array.isArray(zip) ? zip[0] : zip;

    const url = new URL('https://api.openweathermap.org/geo/1.0/zip');
    url.searchParams.set('zip', `${zipValue},${countryCode}`);
    url.searchParams.set('appid', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch coordinates for zip code: ${JSON.stringify(errorData)}`);
    }

    return (await response.json()) as GeocodingResponse;
  }
}
