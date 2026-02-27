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

  protected async process(request: VercelRequest): Promise<WeatherOutput> {
    const { lat: latitude, lon: longitude, units = 'metric' } = request.query;

    const weatherData = await this.weatherService.getCurrentWeather(
      latitude,
      longitude,
      units as string
    );

    const current = weatherData.current;
    const weather = weatherData.current.weather[0];

    const temperature = Math.round(current.temp);
    const feelsLike = Math.round(current.feels_like);

    const title = `${temperature}° and ${weather.description}. Feels like ${feelsLike}°.`;

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

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
