import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import { OpenWeatherMapService } from '../services/OpenWeatherMapService';
import type { WeatherOutput } from '../models/weather/WeatherOutput';

class WeatherEndpoint extends ApiEndpoint {
  private weatherService: OpenWeatherMapService;

  constructor() {
    super();
    this.weatherService = new OpenWeatherMapService();
  }

  protected getRequiredParams(): string[] {
    return ['lat', 'lon'];
  }

  protected async process(req: VercelRequest): Promise<WeatherOutput> {
    const { lat, lon, units = 'metric' } = req.query;

    // Fetch weather data from OpenWeatherMap
    const weatherData = await this.weatherService.getCurrentWeather(lat, lon, units as string);

    // Format the response
    const current = weatherData.current;
    const weather = weatherData.current.weather[0];

    const temperature = Math.round(current.temp);
    const feels_like = Math.round(current.feels_like);

    const title = `${temperature}° and ${weather.description}. Feels like ${feels_like}°.`;

    // Daily
    const daily = weatherData.daily[0];
    const high = Math.round(daily.temp.max);
    const low = Math.round(daily.temp.min);
    const today = daily.weather[0].description;
    const message = `Today: High ${high}°, low ${low}°, ${today}`;

    return {
      icon: `${temperature}°`,
      message,
      title,
      temperature,
    };
  }
}

const endpoint = new WeatherEndpoint();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return endpoint.handle(req, res);
}
