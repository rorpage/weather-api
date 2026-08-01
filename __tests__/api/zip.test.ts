import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { WeatherResponse } from '../../models/weather/WeatherResponse';
import type { GeocodingResponse } from '../../models/weather/GeocodingResponse';

const { mockGetCoordinatesFromZip, mockGetCurrentWeather } = vi.hoisted(() => {
  return {
    mockGetCoordinatesFromZip: vi.fn(),
    mockGetCurrentWeather: vi.fn(),
  };
});

vi.mock('../../services/OpenWeatherMapService', () => {
  return {
    OpenWeatherMapService: vi.fn().mockImplementation(() => {
      return {
        getCoordinatesFromZip: mockGetCoordinatesFromZip,
        getCurrentWeather: mockGetCurrentWeather,
      };
    }),
  };
});

import handler from '../../api/zip';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { 'x-api-token': 'test-token' },
    query: {},
    body: undefined,
    url: '/api/zip',
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

describe('zip endpoint', () => {
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

  const mockGeocodingResponse: GeocodingResponse = {
    zip: '10001',
    name: 'New York',
    lat: 40.7484,
    lon: -73.9967,
    country: 'US',
  };

  const mockWeatherResponse: WeatherResponse = {
    lat: 40.7484,
    lon: -73.9967,
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
    it('should resolve the zip code and return formatted weather data', async () => {
      mockGetCoordinatesFromZip.mockResolvedValue(mockGeocodingResponse);
      mockGetCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const request = createMockRequest({
        query: { zip: '10001' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetCoordinatesFromZip).toHaveBeenCalledWith('10001', 'US');
      expect(mockGetCurrentWeather).toHaveBeenCalledWith('40.7484', '-73.9967', 'metric');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        icon: '23°',
        message: 'Today: High 28°, low 18°, partly cloudy',
        title: '23° and scattered clouds. Feels like 20°.',
        temperature: 23,
      });
    });

    it('should use a provided country code', async () => {
      mockGetCoordinatesFromZip.mockResolvedValue(mockGeocodingResponse);
      mockGetCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const request = createMockRequest({
        query: { zip: '90210', country: 'CA' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetCoordinatesFromZip).toHaveBeenCalledWith('90210', 'CA');
    });

    it('should handle imperial units', async () => {
      mockGetCoordinatesFromZip.mockResolvedValue(mockGeocodingResponse);
      mockGetCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const request = createMockRequest({
        query: { zip: '10001', units: 'imperial' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetCurrentWeather).toHaveBeenCalledWith('40.7484', '-73.9967', 'imperial');
    });
  });

  describe('validation errors', () => {
    it('should reject requests without a zip parameter', async () => {
      const request = createMockRequest({ query: {} });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Missing required parameters: zip',
      });
    });

    it('should reject POST requests', async () => {
      const request = createMockRequest({
        method: 'POST',
        query: { zip: '10001' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(405);
    });

    it('should reject requests with invalid token', async () => {
      const request = createMockRequest({
        headers: { 'x-api-token': 'wrong-token' },
        query: { zip: '10001' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(401);
    });
  });

  describe('error handling', () => {
    it('should handle geocoding service errors', async () => {
      mockGetCoordinatesFromZip.mockRejectedValue(new Error('Failed to fetch coordinates'));

      const request = createMockRequest({
        query: { zip: '00000' },
      });
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to fetch coordinates',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle weather service errors', async () => {
      mockGetCoordinatesFromZip.mockResolvedValue(mockGeocodingResponse);
      mockGetCurrentWeather.mockRejectedValue(new Error('OpenWeatherMap API error'));

      const request = createMockRequest({
        query: { zip: '10001' },
      });
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);

      consoleErrorSpy.mockRestore();
    });
  });
});
