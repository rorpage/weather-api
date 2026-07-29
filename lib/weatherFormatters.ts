import type { WeatherResponse } from '../models/weather/WeatherResponse';
import type { WeatherOutput } from '../models/weather/WeatherOutput';

/**
 * Formats an OpenWeatherMap One Call response into the output shared by both weather endpoints.
 */
export function formatWeatherOutput(weatherData: WeatherResponse): WeatherOutput {
  const current = weatherData.current;
  const weather = current.weather[0];

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
