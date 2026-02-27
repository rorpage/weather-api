import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NWSService } from '../../services/NWSService';
import type { NWSPointsResponse } from '../../models/nws/NWSPointsResponse';
import type { NWSForecastResponse } from '../../models/nws/NWSForecastResponse';

describe('NWSService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const mockPointsResponse: NWSPointsResponse = {
    properties: {
      gridId: 'IND',
      gridX: 71,
      gridY: 60,
      timeZone: 'America/Indiana/Indianapolis',
    },
  };

  const mockForecastResponse: NWSForecastResponse = {
    properties: {
      generatedAt: '2026-02-27T12:00:00+00:00',
      periods: [
        {
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
        },
      ],
    },
  };

  describe('getHourlyForecast', () => {
    it('should fetch hourly forecast via two-step API call', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPointsResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockForecastResponse });

      const service = new NWSService();
      const result = await service.getHourlyForecast('39.7684', '-86.1581');

      expect(result).toEqual(mockForecastResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should call points API with correct coordinates', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPointsResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockForecastResponse });

      const service = new NWSService();
      await service.getHourlyForecast('39.7684', '-86.1581');

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.weather.gov/points/39.7684,-86.1581',
        expect.objectContaining({
          headers: expect.objectContaining({ 'User-Agent': 'weather-api' }),
        })
      );
    });

    it('should call forecast API with grid coordinates from points response', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPointsResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockForecastResponse });

      const service = new NWSService();
      await service.getHourlyForecast('39.7684', '-86.1581');

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.weather.gov/gridpoints/IND/71,60/forecast/hourly',
        expect.objectContaining({
          headers: expect.objectContaining({ 'User-Agent': 'weather-api' }),
        })
      );
    });

    it('should handle array lat/lon parameters', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPointsResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockForecastResponse });

      const service = new NWSService();
      await service.getHourlyForecast(['39.7684', '40.0'], ['-86.1581', '-85.0']);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.weather.gov/points/39.7684,-86.1581',
        expect.anything()
      );
    });

    it('should throw error when points API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const service = new NWSService();

      await expect(service.getHourlyForecast('0', '0')).rejects.toThrow(
        'NWS API error getting grid point: 404'
      );
    });

    it('should throw error when forecast API returns non-ok response', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPointsResponse })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      const service = new NWSService();

      await expect(service.getHourlyForecast('39.7684', '-86.1581')).rejects.toThrow(
        'NWS API error getting hourly forecast: 500'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const service = new NWSService();

      await expect(service.getHourlyForecast('39.7684', '-86.1581')).rejects.toThrow(
        'Network error'
      );
    });
  });
});
