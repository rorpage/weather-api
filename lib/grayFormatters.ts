import type {
  GrayCurrentObservation,
  GrayHourlyForecastPeriod,
  GrayWeatherResponse,
} from '../models/gray/GrayWeatherResponse';
import type {
  LocalWeatherPeriodOutput,
  LocalWeatherOutput,
} from '../models/localWeather/LocalWeatherOutput';

/**
 * Formats an hourly forecast's local timestamp as a short display hour (e.g. "7 AM"),
 * matching the style of TEGNA's pre-formatted "hour" field.
 */
function formatHour(validTimeLocal: string): string {
  const match = validTimeLocal.match(/T(\d{2}):/);

  if (!match) {
    return validTimeLocal;
  }

  const hour = parseInt(match[1], 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${hour12} ${ampm}`;
}

function formatPeriod(
  period: GrayCurrentObservation | GrayHourlyForecastPeriod
): LocalWeatherPeriodOutput {
  return {
    summary: period.wxPhraseLong,
    humidity: period.relativeHumidity,
    temperature: period.temperature,
    feels_like: period.temperatureFeelsLike,
    wind_speed: period.windSpeed,
    wind_direction: period.windDirectionCardinal,
    is_daytime: period.dayOrNight === 'D',
  };
}

/**
 * Formats a Gray Television station's Arc XP weather response. Unlike TEGNA's feed,
 * Gray's current conditions have no icon image or precipitation chance/type — those
 * fields are simply omitted rather than fabricated. The hourly forecast does have both.
 */
export function formatGrayOutput(data: GrayWeatherResponse): LocalWeatherOutput {
  const { currentObservation, hourlyForecast } = data.imperial;

  return {
    current: formatPeriod(currentObservation),
    hourly: hourlyForecast.map((period) => ({
      ...formatPeriod(period),
      precipitation_chance: period.precipChance,
      precipitation_type: period.precipType,
      hour: formatHour(period.validTimeLocal),
      day_of_week: period.dayOfWeek,
    })),
  };
}
