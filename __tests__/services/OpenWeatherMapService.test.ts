import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenWeatherMapService } from '../../services/OpenWeatherMapService';
import type { WeatherResponse } from '../../models/weather/WeatherResponse';

describe('OpenWeatherMapService', () => {
  const originalEnv = process.env;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, OPENWEATHERMAP_API_KEY: 'test-api-key' };
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(() => new OpenWeatherMapService()).not.toThrow();
    });

    it('should throw error when API key is not set', () => {
      delete process.env.OPENWEATHERMAP_API_KEY;
      expect(() => new OpenWeatherMapService()).toThrow(
        'OPENWEATHERMAP_API_KEY environment variable is not set'
      );
    });
  });

  describe('getCurrentWeather', () => {
    const mockWeatherResponse: WeatherResponse = {
      lat: 40.7128,
      lon: -74.006,
      timezone: 'America/New_York',
      timezone_offset: -18000,
      current: {
        dt: 1609459200,
        sunrise: 1609416000,
        sunset: 1609452000,
        temp: 5.5,
        feels_like: 2.3,
        pressure: 1013,
        humidity: 80,
        dew_point: 2.1,
        uvi: 0,
        clouds: 90,
        visibility: 10000,
        wind_speed: 4.5,
        wind_deg: 180,
        weather: [
          {
            id: 804,
            main: 'Clouds',
            description: 'overcast clouds',
            icon: '04d',
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
          summary: 'Cloudy day',
          temp: {
            day: 8.0,
            min: 3.0,
            max: 10.0,
            night: 5.0,
            eve: 7.0,
            morn: 4.0,
          },
          feels_like: {
            day: 6.0,
            night: 3.0,
            eve: 5.0,
            morn: 2.0,
          },
          pressure: 1013,
          humidity: 75,
          dew_point: 4.0,
          wind_speed: 3.5,
          wind_deg: 200,
          wind_gust: 8.0,
          weather: [
            {
              id: 804,
              main: 'Clouds',
              description: 'overcast clouds',
              icon: '04d',
            },
          ],
          clouds: 90,
          pop: 0.1,
          uvi: 2.5,
        },
      ],
    };

    it('should fetch weather data successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWeatherResponse,
      });

      const service = new OpenWeatherMapService();
      const result = await service.getCurrentWeather('40.7128', '-74.006');

      expect(result).toEqual(mockWeatherResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.openweathermap.org/data/3.0/onecall')
      );
    });

    it('should construct URL with correct parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWeatherResponse,
      });

      const service = new OpenWeatherMapService();
      await service.getCurrentWeather('40.7', '-74.0', 'imperial');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('lat=40.7');
      expect(calledUrl).toContain('lon=-74.0');
      expect(calledUrl).toContain('units=imperial');
      // URL encoding converts commas to %2C
      expect(calledUrl).toMatch(/exclude=minutely(%2C|,)hourly(%2C|,)alerts/);
      expect(calledUrl).toContain('appid=test-api-key');
    });

    it('should default to metric units', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWeatherResponse,
      });

      const service = new OpenWeatherMapService();
      await service.getCurrentWeather('40.7', '-74.0');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('units=metric');
    });

    it('should handle array parameters by taking first element', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWeatherResponse,
      });

      const service = new OpenWeatherMapService();
      await service.getCurrentWeather(['40.7', '41.0'], ['-74.0', '-73.0']);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('lat=40.7');
      expect(calledUrl).toContain('lon=-74.0');
    });

    it('should throw error on failed API response', async () => {
      const errorResponse = {
        cod: 401,
        message: 'Invalid API key',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => errorResponse,
      });

      const service = new OpenWeatherMapService();

      await expect(service.getCurrentWeather('40.7', '-74.0')).rejects.toThrow(
        'Failed to fetch weather data'
      );
    });

    it('should include error details in thrown error', async () => {
      const errorResponse = {
        cod: 404,
        message: 'City not found',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => errorResponse,
      });

      const service = new OpenWeatherMapService();

      await expect(service.getCurrentWeather('invalid', 'invalid')).rejects.toThrow(
        JSON.stringify(errorResponse)
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const service = new OpenWeatherMapService();

      await expect(service.getCurrentWeather('40.7', '-74.0')).rejects.toThrow('Network error');
    });
  });
});
