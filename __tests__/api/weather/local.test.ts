import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NWSForecastResponse } from '../../../models/nws/NWSForecastResponse';

const { mockGetHourlyForecast } = vi.hoisted(() => {
  return { mockGetHourlyForecast: vi.fn() };
});

vi.mock('../../../services/NWSService', () => {
  return {
    NWSService: vi.fn().mockImplementation(() => ({
      getHourlyForecast: mockGetHourlyForecast,
    })),
  };
});

import handler from '../../../api/weather/local';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { 'x-api-token': 'test-token' },
    query: {},
    body: undefined,
    url: '/api/weather/local',
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return response as unknown as VercelResponse;
}

describe('weather/local endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      API_TOKEN: 'test-token',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

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
        {
          number: 2,
          startTime: '2026-02-27T13:00:00-05:00',
          endTime: '2026-02-27T14:00:00-05:00',
          isDaytime: true,
          temperature: 47,
          temperatureUnit: 'F',
          windSpeed: '12 mph',
          windDirection: 'W',
          shortForecast: 'Partly Cloudy',
          probabilityOfPrecipitation: { value: null, unitCode: 'wmoUnit:percent' },
          relativeHumidity: { value: 60, unitCode: 'wmoUnit:percent' },
          dewpoint: { value: 36, unitCode: 'wmoUnit:degF' },
        },
      ],
    },
  };

  describe('successful requests', () => {
    it('should default to Indianapolis when no city is given', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHourlyForecast).toHaveBeenCalledWith('39.7684', '-86.1581');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        current: {
          start_time: '2026-02-27T12:00:00-05:00',
          start_time_formatted_time: '12:00 PM',
          start_time_formatted_datetime: '02/27/2026 12:00 PM',
          is_daytime: true,
          temperature: 45,
          temperature_unit: 'F',
          wind_speed: '10 mph',
          wind_direction: 'NW',
          short_forecast: 'Mostly cloudy',
          probability_of_precipitation: 20,
          relative_humidity: 65,
        },
        hourly: [
          {
            start_time: '2026-02-27T13:00:00-05:00',
            start_time_formatted_time: '01:00 PM',
            start_time_formatted_datetime: '02/27/2026 01:00 PM',
            is_daytime: true,
            temperature: 47,
            temperature_unit: 'F',
            wind_speed: '12 mph',
            wind_direction: 'W',
            short_forecast: 'Partly cloudy',
            probability_of_precipitation: null,
            relative_humidity: 60,
          },
        ],
      });
    });

    it('should fetch Minneapolis coordinates when city=minneapolis', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const request = createMockRequest({ query: { city: 'minneapolis' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHourlyForecast).toHaveBeenCalledWith('44.9778', '-93.2650');
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should treat city as case-insensitive', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const request = createMockRequest({ query: { city: 'MINNEAPOLIS' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHourlyForecast).toHaveBeenCalledWith('44.9778', '-93.2650');
    });

    it('should fetch San Antonio coordinates when city=san_antonio', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const request = createMockRequest({ query: { city: 'san_antonio' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHourlyForecast).toHaveBeenCalledWith('29.4241', '-98.4936');
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should fetch Milwaukee coordinates when city=milwaukee', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const request = createMockRequest({ query: { city: 'milwaukee' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHourlyForecast).toHaveBeenCalledWith('43.0389', '-87.9065');
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should limit hourly periods to 5 regardless of how many the feed returns', async () => {
      const manyPeriods = Array.from({ length: 12 }, (_, index) => ({
        ...mockForecastResponse.properties.periods[0],
        number: index + 1,
      }));
      mockGetHourlyForecast.mockResolvedValue({
        properties: { generatedAt: '2026-02-27T12:00:00+00:00', periods: manyPeriods },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(vi.mocked(response.json).mock.calls[0][0].hourly).toHaveLength(5);
    });

    it('should not repeat the current period in the hourly array', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      const result = vi.mocked(response.json).mock.calls[0][0];
      expect(result.hourly).not.toContainEqual(result.current);
    });
  });

  describe('validation errors', () => {
    it('should reject POST requests', async () => {
      const request = createMockRequest({ method: 'POST' });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(405);
    });

    it('should not require an API token', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const request = createMockRequest({ headers: {} });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('error handling', () => {
    it('should return an error for an unsupported city', async () => {
      const request = createMockRequest({ query: { city: 'austin' } });
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(mockGetHourlyForecast).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message:
          'Unsupported city: austin. Supported cities: indianapolis, minneapolis, san_antonio, milwaukee',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockGetHourlyForecast.mockRejectedValue(new Error('NWS API error getting grid point: 404'));

      const request = createMockRequest();
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'NWS API error getting grid point: 404',
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
