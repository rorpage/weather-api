import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { WeatherResponse } from '../../models/weather/WeatherResponse';

// Create mock functions using vi.hoisted to avoid initialization issues
const { mockGetCurrentWeather } = vi.hoisted(() => {
  return {
    mockGetCurrentWeather: vi.fn(),
  };
});

// Mock OpenWeatherMapService
vi.mock('../../services/OpenWeatherMapService', () => {
  return {
    OpenWeatherMapService: vi.fn().mockImplementation(() => {
      return {
        getCurrentWeather: mockGetCurrentWeather,
      };
    }),
  };
});

import handler from '../../api/weather';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { 'x-api-token': 'test-token' },
    query: {},
    body: undefined,
    url: '/api/weather',
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

describe('weather endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      API_TOKEN: 'test-token',
      OPENWEATHERMAP_API_KEY: 'test-api-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

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

  describe('successful requests', () => {
    it('should return formatted weather data', async () => {
      mockGetCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const req = createMockRequest({
        query: { lat: '40.7128', lon: '-74.006' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        icon: '23°',
        message: 'Today: High 28°, low 18°, partly cloudy',
        title: '23° and scattered clouds. Feels like 20°.',
        temperature: 23,
      });
    });

    it('should round temperatures correctly', async () => {
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

      mockGetCurrentWeather.mockResolvedValue(responseWithDecimals);

      const req = createMockRequest({
        query: { lat: '40.7', lon: '-74.0' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        icon: '23°',
        message: 'Today: High 29°, low 17°, partly cloudy',
        title: '23° and scattered clouds. Feels like 20°.',
        temperature: 23,
      });
    });

    it('should handle imperial units', async () => {
      mockGetCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const req = createMockRequest({
        query: { lat: '40.7', lon: '-74.0', units: 'imperial' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockGetCurrentWeather).toHaveBeenCalledWith('40.7', '-74.0', 'imperial');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should default to metric units when not specified', async () => {
      mockGetCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const req = createMockRequest({
        query: { lat: '40.7', lon: '-74.0' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockGetCurrentWeather).toHaveBeenCalledWith('40.7', '-74.0', 'metric');
    });
  });

  describe('validation errors', () => {
    it('should reject requests without lat parameter', async () => {
      const req = createMockRequest({
        query: { lon: '-74.0' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required parameters: lat',
      });
    });

    it('should reject requests without lon parameter', async () => {
      const req = createMockRequest({
        query: { lat: '40.7' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required parameters: lon',
      });
    });

    it('should reject requests without both parameters', async () => {
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required parameters: lat, lon',
      });
    });

    it('should reject POST requests', async () => {
      const req = createMockRequest({
        method: 'POST',
        query: { lat: '40.7', lon: '-74.0' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });

    it('should reject requests with invalid token', async () => {
      const req = createMockRequest({
        headers: { 'x-api-token': 'wrong-token' },
        query: { lat: '40.7', lon: '-74.0' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      mockGetCurrentWeather.mockRejectedValue(new Error('OpenWeatherMap API error'));

      const req = createMockRequest({
        query: { lat: '40.7', lon: '-74.0' },
      });
      const res = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'OpenWeatherMap API error',
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
