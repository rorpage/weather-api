import type {
  HearstCurrentConditions,
  HearstHourlyPeriod,
  HearstWeatherResponse,
} from '../models/hearst/HearstWeatherResponse';
import type {
  LocalWeatherPeriodOutput,
  LocalWeatherOutput,
} from '../models/localWeather/LocalWeatherOutput';

function isDaytime(iconName: string): boolean {
  return !iconName.startsWith('nt_');
}

/**
 * Formats a Hearst Television station's weather feed. Unlike TEGNA, Hearst's hourly
 * periods have no humidity or wind data and no icon image — those fields are simply
 * omitted rather than fabricated.
 */
export function formatHearstOutput(data: HearstWeatherResponse): LocalWeatherOutput {
  const { current, hourly } = data.data;

  return {
    current: formatCurrent(current),
    hourly: hourly.map(formatHourly),
  };
}

function formatCurrent(current: HearstCurrentConditions): LocalWeatherPeriodOutput {
  return {
    summary: current.sky,
    humidity: current.rel_humidity,
    temperature: current.temp_f,
    feels_like: current.feels_like_f,
    wind_speed: current.wind_speed_mph,
    wind_direction: current.wind_dir_card,
    is_daytime: isDaytime(current.icon_name),
  };
}

function formatHourly(period: HearstHourlyPeriod) {
  return {
    summary: period.sky_long,
    temperature: period.temp_f,
    feels_like: period.feels_like_f,
    precipitation_chance: period.precip_chance,
    is_daytime: isDaytime(period.icon_name),
    hour: period.hour_display,
  };
}
