import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import { NWSService } from '../services/NWSService';
import { formatPeriod } from '../lib/nwsFormatters';
import type { LocalWeatherOutput } from '../models/localWeather/LocalWeatherOutput';

const DEFAULT_CITY = 'indianapolis';
const HOURLY_LIMIT = 5;

const CITY_COORDINATES: Record<string, { latitude: string; longitude: string }> = {
  indianapolis: { latitude: '39.7684', longitude: '-86.1581' },
  minneapolis: { latitude: '44.9778', longitude: '-93.2650' },
  san_antonio: { latitude: '29.4241', longitude: '-98.4936' },
  milwaukee: { latitude: '43.0389', longitude: '-87.9065' },
};

class LocalWeatherEndpoint extends ApiEndpoint {
  private nwsService: NWSService;

  constructor() {
    super();
    this.nwsService = new NWSService();
  }

  protected requiresAuth(): boolean {
    return false;
  }

  protected getRequiredParams(): string[] {
    return [];
  }

  protected async process(request: VercelRequest): Promise<LocalWeatherOutput> {
    const { city = DEFAULT_CITY } = request.query;
    const cityKey = (Array.isArray(city) ? city[0] : city).toLowerCase();
    const coordinates = CITY_COORDINATES[cityKey];

    if (!coordinates) {
      throw new Error(
        `Unsupported city: ${cityKey}. Supported cities: ${Object.keys(CITY_COORDINATES).join(', ')}`
      );
    }

    const forecastData = await this.nwsService.getHourlyForecast(
      coordinates.latitude,
      coordinates.longitude
    );
    const periods = forecastData.properties.periods.map(formatPeriod);

    return {
      current: periods[0],
      hourly: periods.slice(1, HOURLY_LIMIT + 1),
    };
  }
}

const endpoint = new LocalWeatherEndpoint();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
