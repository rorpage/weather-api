import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import { OpenWeatherMapService } from '../services/OpenWeatherMapService';
import { formatWeatherOutput } from '../lib/weatherFormatters';
import type { WeatherOutput } from '../models/weather/WeatherOutput';

class WeatherByZipEndpoint extends ApiEndpoint {
  private weatherService: OpenWeatherMapService;

  constructor() {
    super();
    this.weatherService = new OpenWeatherMapService();
  }

  protected getRequiredParams(): string[] {
    return ['zip'];
  }

  protected async process(request: VercelRequest): Promise<WeatherOutput> {
    const { zip, country = 'US', units = 'metric' } = request.query;

    const coordinates = await this.weatherService.getCoordinatesFromZip(zip, country as string);

    const weatherData = await this.weatherService.getCurrentWeather(
      String(coordinates.lat),
      String(coordinates.lon),
      units as string
    );

    return formatWeatherOutput(weatherData);
  }
}

const endpoint = new WeatherByZipEndpoint();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
