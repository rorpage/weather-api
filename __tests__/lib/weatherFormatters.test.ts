import { describe, it, expect } from 'vitest';
import { formatWeatherOutput } from '../../lib/weatherFormatters';
import type { WeatherResponse } from '../../models/weather/WeatherResponse';

describe('weatherFormatters', () => {
  describe('formatWeatherOutput', () => {
    const mockWeatherResponse: WeatherResponse = {
      lat: 40.7128,
      lon: -74.006,
      timezone: 'America/New_York',
      timezone_offset: -18000,
      current: {
        dt: 1609459200,
        sunrise: 1609416000,
        sunset: 1609452000,
        temp: 22.5,
        feels_like: 20.3,
        pressure: 1013,
        humidity: 65,
        dew_point: 15.2,
        uvi: 5,
        clouds: 40,
        visibility: 10000,
        wind_speed: 3.5,
        wind_deg: 180,
        weather: [
          {
            id: 802,
            main: 'Clouds',
            description: 'scattered clouds',
            icon: '03d',
          },
        ],
      },
      daily: [
        {
          dt: 1609459200,
          sunrise: 1609416000,
          sunset: 1609452000,
          moonrise: 1609430000,
          moonset: 1609480000,
          moon_phase: 0.5,
          summary: 'Partly cloudy',
          temp: {
            day: 25.0,
            min: 18.0,
            max: 28.0,
            night: 20.0,
            eve: 23.0,
            morn: 19.0,
          },
          feels_like: {
            day: 24.0,
            night: 19.0,
            eve: 22.0,
            morn: 18.0,
          },
          pressure: 1013,
          humidity: 60,
          dew_point: 16.0,
          wind_speed: 4.0,
          wind_deg: 200,
          wind_gust: 9.0,
          weather: [
            {
              id: 802,
              main: 'Clouds',
              description: 'partly cloudy',
              icon: '03d',
            },
          ],
          clouds: 40,
          pop: 0.2,
          uvi: 6.5,
        },
      ],
    };

    it('should format weather data with rounded temperatures', () => {
      expect(formatWeatherOutput(mockWeatherResponse)).toEqual({
        icon: '23°',
        message: 'Today: High 28°, low 18°, partly cloudy',
        title: '23° and scattered clouds. Feels like 20°.',
        temperature: 23,
      });
    });

    it('should round decimal temperatures correctly', () => {
      const responseWithDecimals: WeatherResponse = {
        ...mockWeatherResponse,
        current: {
          ...mockWeatherResponse.current,
          temp: 22.7,
          feels_like: 20.4,
        },
        daily: [
          {
            ...mockWeatherResponse.daily[0],
            temp: {
              ...mockWeatherResponse.daily[0].temp,
              max: 28.6,
              min: 17.3,
            },
          },
        ],
      };

      expect(formatWeatherOutput(responseWithDecimals)).toEqual({
        icon: '23°',
        message: 'Today: High 29°, low 17°, partly cloudy',
        title: '23° and scattered clouds. Feels like 20°.',
        temperature: 23,
      });
    });
  });
});
