import { describe, it, expect } from 'vitest';
import { formatGrayOutput } from '../../lib/grayFormatters';
import type { GrayWeatherResponse } from '../../models/gray/GrayWeatherResponse';

describe('grayFormatters', () => {
  describe('formatGrayOutput', () => {
    const mockResponse: GrayWeatherResponse = {
      imperial: {
        currentObservation: {
          dayOrNight: 'D',
          iconCode: 28,
          relativeHumidity: 45,
          temperature: 81,
          temperatureFeelsLike: 81,
          windDirectionCardinal: 'S',
          windSpeed: 9,
          wxPhraseLong: 'Mostly Cloudy',
        },
        hourlyForecast: [
          {
            dayOfWeek: 'Thursday',
            dayOrNight: 'N',
            iconCode: 29,
            precipChance: 1,
            precipType: 'rain',
            relativeHumidity: 57,
            temperature: 76,
            temperatureFeelsLike: 76,
            validTimeLocal: '2026-07-30T21:00:00-0500',
            windDirectionCardinal: 'SSW',
            windSpeed: 4,
            wxPhraseLong: 'Partly Cloudy',
          },
          {
            dayOfWeek: 'Thursday',
            dayOrNight: 'D',
            iconCode: 32,
            precipChance: 0,
            precipType: 'rain',
            relativeHumidity: 40,
            temperature: 85,
            temperatureFeelsLike: 87,
            validTimeLocal: '2026-07-31T09:00:00-0500',
            windDirectionCardinal: 'S',
            windSpeed: 6,
            wxPhraseLong: 'Sunny',
          },
        ],
      },
    };

    it('should format current conditions without icon_url or precipitation fields', () => {
      const result = formatGrayOutput(mockResponse);

      expect(result.current).toEqual({
        summary: 'Mostly Cloudy',
        humidity: 45,
        temperature: 81,
        feels_like: 81,
        wind_speed: 9,
        wind_direction: 'S',
        is_daytime: true,
      });
      expect(result.current.icon_url).toBeUndefined();
      expect(result.current.precipitation_chance).toBeUndefined();
      expect(result.current.precipitation_type).toBeUndefined();
    });

    it('should format hourly forecast with precipitation fields and a display hour', () => {
      expect(formatGrayOutput(mockResponse).hourly).toEqual([
        {
          summary: 'Partly Cloudy',
          humidity: 57,
          temperature: 76,
          feels_like: 76,
          wind_speed: 4,
          wind_direction: 'SSW',
          is_daytime: false,
          precipitation_chance: 1,
          precipitation_type: 'rain',
          hour: '9 PM',
          day_of_week: 'Thursday',
        },
        {
          summary: 'Sunny',
          humidity: 40,
          temperature: 85,
          feels_like: 87,
          wind_speed: 6,
          wind_direction: 'S',
          is_daytime: true,
          precipitation_chance: 0,
          precipitation_type: 'rain',
          hour: '9 AM',
          day_of_week: 'Thursday',
        },
      ]);
    });
  });
});
