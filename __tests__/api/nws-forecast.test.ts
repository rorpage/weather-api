import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NWSForecastResponse } from '../../models/nws/NWSForecastResponse';

// Create mock functions using vi.hoisted to avoid initialization issues
const { mockGetHourlyForecast } = vi.hoisted(() => {
  return {
    mockGetHourlyForecast: vi.fn(),
  };
});

// Mock NWSService
vi.mock('../../services/NWSService', () => {
  return {
    NWSService: vi.fn().mockImplementation(() => {
      return {
        getHourlyForecast: mockGetHourlyForecast,
      };
    }),
  };
});

import handler from '../../api/nws-forecast';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { 'x-api-token': 'test-token' },
    query: {},
    body: undefined,
    url: '/api/nws-forecast',
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
}

describe('nws-forecast endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, API_TOKEN: 'test-token' };
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
    it('should return the first period as a flat object', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const req = createMockRequest({
        query: { lat: '39.7684', lon: '-86.1581' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        start_time: '2026-02-27T12:00:00-05:00',
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

    it('should return only the first period when multiple are available', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const req = createMockRequest({ query: { lat: '39.7684', lon: '-86.1581' } });
      const res = createMockResponse();

      await handler(req, res);

      const result = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(result).not.toHaveProperty('periods');
      expect(result).not.toHaveProperty('generated_at');
      expect(result.start_time).toBe('2026-02-27T12:00:00-05:00');
    });

    it('should format short_forecast with only first letter capitalized', async () => {
      const responseWithUpperForecast: NWSForecastResponse = {
        properties: {
          ...mockForecastResponse.properties,
          periods: [
            {
              ...mockForecastResponse.properties.periods[0],
              shortForecast: 'PARTLY CLOUDY AND WINDY',
            },
          ],
        },
      };
      mockGetHourlyForecast.mockResolvedValue(responseWithUpperForecast);

      const req = createMockRequest({ query: { lat: '39.7684', lon: '-86.1581' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ short_forecast: 'Partly cloudy and windy' })
      );
    });

    it('should pass lat and lon to the service', async () => {
      mockGetHourlyForecast.mockResolvedValue(mockForecastResponse);

      const req = createMockRequest({ query: { lat: '40.7128', lon: '-74.0060' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockGetHourlyForecast).toHaveBeenCalledWith('40.7128', '-74.0060');
    });

    it('should handle null probability of precipitation', async () => {
      const responseWithNullPop: NWSForecastResponse = {
        properties: {
          ...mockForecastResponse.properties,
          periods: [
            {
              ...mockForecastResponse.properties.periods[0],
              probabilityOfPrecipitation: { value: null, unitCode: 'wmoUnit:percent' },
            },
          ],
        },
      };
      mockGetHourlyForecast.mockResolvedValue(responseWithNullPop);

      const req = createMockRequest({ query: { lat: '39.7684', lon: '-86.1581' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ probability_of_precipitation: null })
      );
    });
  });

  describe('validation errors', () => {
    it('should reject requests without lat parameter', async () => {
      const req = createMockRequest({ query: { lon: '-86.1581' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required parameters: lat' });
    });

    it('should reject requests without lon parameter', async () => {
      const req = createMockRequest({ query: { lat: '39.7684' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required parameters: lon' });
    });

    it('should reject requests missing both parameters', async () => {
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required parameters: lat, lon' });
    });

    it('should reject POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        query: { lat: '39.7684', lon: '-86.1581' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should reject requests with invalid token', async () => {
      const req = createMockRequest({
        headers: { 'x-api-token': 'wrong-token' },
        query: { lat: '39.7684', lon: '-86.1581' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      mockGetHourlyForecast.mockRejectedValue(new Error('NWS API error getting grid point: 404'));

      const req = createMockRequest({ query: { lat: '39.7684', lon: '-86.1581' } });
      const res = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'NWS API error getting grid point: 404',
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
