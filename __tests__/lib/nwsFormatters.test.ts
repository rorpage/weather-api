import { describe, it, expect } from 'vitest';
import { formatTime, formatDatetime, formatPeriod } from '../../lib/nwsFormatters';
import type { NWSForecastPeriodRaw } from '../../models/nws/NWSForecastResponse';

const mockPeriod: NWSForecastPeriodRaw = {
  number: 1,
  startTime: '2026-02-27T12:00:00-05:00',
  endTime: '2026-02-27T13:00:00-05:00',
  isDaytime: true,
  temperature: 45,
  temperatureUnit: 'F',
  windSpeed: '10 mph',
  windDirection: 'NW',
  shortForecast: 'Mostly Cloudy',
  probabilityOfPrecipitation: { value: 20, unitCode: 'wmoUnit:percent' },
  relativeHumidity: { value: 65, unitCode: 'wmoUnit:percent' },
  dewpoint: { value: 35, unitCode: 'wmoUnit:degF' },
};

describe('formatTime', () => {
  it('should extract HH:MM from an ISO datetime string', () => {
    expect(formatTime('2026-02-27T12:00:00-05:00')).toBe('12:00');
  });

  it('should preserve leading zeros', () => {
    expect(formatTime('2026-02-27T08:30:00-05:00')).toBe('08:30');
  });

  it('should handle midnight', () => {
    expect(formatTime('2026-02-27T00:00:00-05:00')).toBe('00:00');
  });

  it('should work with EDT offset (-04:00)', () => {
    expect(formatTime('2026-07-15T14:00:00-04:00')).toBe('14:00');
  });

  it('should return the original string if no time component is found', () => {
    expect(formatTime('invalid')).toBe('invalid');
  });
});

describe('formatDatetime', () => {
  it('should format noon as MM/DD/YYYY 12:00 PM', () => {
    expect(formatDatetime('2026-02-27T12:00:00-05:00')).toBe('02/27/2026 12:00 PM');
  });

  it('should format morning hours as AM', () => {
    expect(formatDatetime('2026-02-27T08:30:00-05:00')).toBe('02/27/2026 08:30 AM');
  });

  it('should format midnight as 12:00 AM', () => {
    expect(formatDatetime('2026-02-27T00:00:00-05:00')).toBe('02/27/2026 12:00 AM');
  });

  it('should format afternoon hours as PM with 12-hour conversion', () => {
    expect(formatDatetime('2026-02-27T13:00:00-05:00')).toBe('02/27/2026 01:00 PM');
  });

  it('should zero-pad the 12-hour hour', () => {
    expect(formatDatetime('2026-02-27T09:15:00-05:00')).toBe('02/27/2026 09:15 AM');
  });

  it('should return the original string if no date component is found', () => {
    expect(formatDatetime('invalid')).toBe('invalid');
  });
});

describe('formatPeriod', () => {
  it('should map a raw period to the output format', () => {
    expect(formatPeriod(mockPeriod)).toEqual({
      start_time: '2026-02-27T12:00:00-05:00',
      start_time_formatted_time: '12:00',
      start_time_formatted_datetime: '02/27/2026 12:00 PM',
      is_daytime: true,
      temperature: 45,
      temperature_unit: 'F',
      wind_speed: '10 mph',
      wind_direction: 'NW',
      short_forecast: 'Mostly cloudy',
      probability_of_precipitation: 20,
      relative_humidity: 65,
    });
  });

  it('should sentence-case the short forecast', () => {
    expect(
      formatPeriod({ ...mockPeriod, shortForecast: 'PARTLY CLOUDY AND WINDY' }).short_forecast
    ).toBe('Partly cloudy and windy');
  });

  it('should handle already-lowercase short forecast', () => {
    expect(formatPeriod({ ...mockPeriod, shortForecast: 'mostly sunny' }).short_forecast).toBe(
      'Mostly sunny'
    );
  });

  it('should handle null probability of precipitation', () => {
    const period = {
      ...mockPeriod,
      probabilityOfPrecipitation: { value: null, unitCode: 'wmoUnit:percent' },
    };
    expect(formatPeriod(period).probability_of_precipitation).toBeNull();
  });

  it('should set start_time to the full ISO timestamp', () => {
    expect(formatPeriod({ ...mockPeriod, startTime: '2026-02-27T08:30:00-05:00' }).start_time).toBe(
      '2026-02-27T08:30:00-05:00'
    );
  });

  it('should set start_time_formatted_time as HH:MM', () => {
    expect(
      formatPeriod({ ...mockPeriod, startTime: '2026-02-27T08:30:00-05:00' })
        .start_time_formatted_time
    ).toBe('08:30');
  });

  it('should set start_time_formatted_datetime as MM/DD/YYYY HH:MM AM/PM', () => {
    expect(
      formatPeriod({ ...mockPeriod, startTime: '2026-02-27T13:30:00-05:00' })
        .start_time_formatted_datetime
    ).toBe('02/27/2026 01:30 PM');
  });

  it('should handle nighttime periods', () => {
    expect(formatPeriod({ ...mockPeriod, isDaytime: false }).is_daytime).toBe(false);
  });
});
