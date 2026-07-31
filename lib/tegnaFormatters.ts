import type {
  TegnaCurrentPeriod,
  TegnaHourlyPeriod,
  TegnaHeaderResponse,
  TegnaIcon,
} from '../models/tegna/TegnaHeaderResponse';
import type {
  LocalWeatherPeriodOutput,
  LocalWeatherOutput,
} from '../models/localWeather/LocalWeatherOutput';

const PREFERRED_ICON_WIDTH = 210;

function resolveIconUrl(icons: TegnaIcon[], host: string): string {
  const icon = icons.find((candidate) => candidate.width === PREFERRED_ICON_WIDTH) ?? icons[0];

  return `https://${host}${icon.url}`;
}

function formatPeriod(
  period: TegnaCurrentPeriod | TegnaHourlyPeriod,
  host: string
): LocalWeatherPeriodOutput {
  return {
    summary: period.summary,
    icon_url: resolveIconUrl(period.icons, host),
    humidity: period.humidity,
    temperature: period.temp.air,
    feels_like: period.temp.feelsLike,
    wind_speed: period.wind.speed,
    wind_direction: period.wind.direction,
    precipitation_chance: period.precip.chance,
    precipitation_type: period.precip.type,
    is_daytime: period.time.dayOrNight === 'D',
  };
}

/**
 * Formats a TEGNA station's page-header response, dropping the non-weather sections
 * (breaking news, closings, video feeds) and the redundant icon-size variants.
 */
export function formatTegnaOutput(
  weather: TegnaHeaderResponse['weather'],
  host: string
): LocalWeatherOutput {
  return {
    current: {
      ...formatPeriod(weather.current, host),
      observed_at: weather.current.time.local,
    },
    hourly: weather.hourly.map((period) => ({
      ...formatPeriod(period, host),
      hour: period.time.hour,
      day_of_week: period.time.dayOfWeek,
    })),
  };
}
