import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import { NWSService } from '../services/NWSService';
import type { NWSForecastOutput } from '../models/nws/NWSForecastOutput';

class NWSForecastEndpoint extends ApiEndpoint {
  private nwsService: NWSService;

  constructor() {
    super();
    this.nwsService = new NWSService();
  }

  protected getRequiredParams(): string[] {
    return ['lat', 'lon'];
  }

  protected async process(req: VercelRequest): Promise<NWSForecastOutput> {
    const { lat, lon } = req.query;

    const forecastData = await this.nwsService.getHourlyForecast(lat, lon);
    const period = forecastData.properties.periods[0];
    const shortForecast = period.shortForecast.toLowerCase();

    return {
      start_time: period.startTime,
      is_daytime: period.isDaytime,
      temperature: period.temperature,
      temperature_unit: period.temperatureUnit,
      wind_speed: period.windSpeed,
      wind_direction: period.windDirection,
      short_forecast: shortForecast.charAt(0).toUpperCase() + shortForecast.slice(1),
      probability_of_precipitation: period.probabilityOfPrecipitation.value,
      relative_humidity: period.relativeHumidity.value,
    };
  }
}

const endpoint = new NWSForecastEndpoint();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return endpoint.handle(req, res);
}
