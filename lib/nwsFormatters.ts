import type { NWSForecastPeriodRaw } from '../models/nws/NWSForecastResponse';
import type { NWSHourlyPeriod } from '../models/nws/NWSForecastOutput';

/**
 * Formats the local time from an ISO 8601 datetime string as hh:mm AM/PM.
 * The time component of the NWS API response is already in local time.
 */
export function formatTime(isoString: string): string {
  const match = isoString.match(/T(\d{2}):(\d{2})/);

  if (!match) {
    return isoString;
  }

  const hour = parseInt(match[1], 10);
  const minute = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${String(hour12).padStart(2, '0')}:${minute} ${ampm}`;
}

/**
 * Formats an ISO 8601 datetime string as MM/DD/YYYY HH:MM AM/PM.
 * Uses the local time already embedded in the NWS API response.
 */
export function formatDatetime(isoString: string): string {
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);

  if (!match) {
    return isoString;
  }

  const [, year, month, day, hourStr, minute] = match;
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${month}/${day}/${year} ${String(hour12).padStart(2, '0')}:${minute} ${ampm}`;
}

/**
 * Maps a raw NWS forecast period to the output format shared by both NWS endpoints.
 */
export function formatPeriod(period: NWSForecastPeriodRaw): NWSHourlyPeriod {
  const rawForecast = period.shortForecast.toLowerCase();

  return {
    start_time: period.startTime,
    start_time_formatted_time: formatTime(period.startTime),
    start_time_formatted_datetime: formatDatetime(period.startTime),
    is_daytime: period.isDaytime,
    temperature: period.temperature,
    temperature_unit: period.temperatureUnit,
    wind_speed: period.windSpeed,
    wind_direction: period.windDirection,
    short_forecast: rawForecast.charAt(0).toUpperCase() + rawForecast.slice(1),
    probability_of_precipitation: period.probabilityOfPrecipitation.value,
    relative_humidity: period.relativeHumidity.value,
  };
}
