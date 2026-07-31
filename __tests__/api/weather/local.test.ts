import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { TegnaHeaderResponse } from '../../../models/tegna/TegnaHeaderResponse';
import type { GrayWeatherResponse } from '../../../models/gray/GrayWeatherResponse';

const { mockGetHeaderData, mockGetWeatherData } = vi.hoisted(() => {
  return {
    mockGetHeaderData: vi.fn(),
    mockGetWeatherData: vi.fn(),
  };
});

vi.mock('../../../services/TegnaStationService', () => {
  return {
    TegnaStationService: vi.fn().mockImplementation(() => {
      return {
        getHeaderData: mockGetHeaderData,
      };
    }),
  };
});

vi.mock('../../../services/GrayStationService', () => {
  return {
    GrayStationService: vi.fn().mockImplementation(() => {
      return {
        getWeatherData: mockGetWeatherData,
      };
    }),
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

  const mockHeaderResponse: TegnaHeaderResponse = {
    weather: {
      current: {
        iconCode: 31,
        icons: [{ width: 210, height: 210, url: '/icons/partly-cloudy-night_210x210.png' }],
        summary: 'Clear',
        humidity: 87,
        wind: { speed: 3, direction: 'NNW' },
        precip: { chance: 0, type: 'none' },
        temp: { air: 63, feelsLike: 63 },
        time: {
          epoch: 1785406568,
          local: '2026-07-30T06:16:08',
          dayOfWeek: 'Thu',
          dayOrNight: 'N',
        },
      },
      hourly: [
        {
          iconCode: 32,
          icons: [{ width: 210, height: 210, url: '/icons/clear-day_210x210.png' }],
          summary: 'Sunny',
          humidity: 86,
          wind: { speed: 3, direction: 'N' },
          precip: { chance: 7, type: 'Rain' },
          temp: { air: 62, feelsLike: 62 },
          time: { epoch: 1785409200, hour: '7 AM', dayOfWeek: 'Thu', dayOrNight: 'D' },
        },
      ],
    },
  };

  const mockGrayResponse: GrayWeatherResponse = {
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
      ],
    },
  };

  describe('successful requests', () => {
    it('should default to Indianapolis when no city is given', async () => {
      mockGetHeaderData.mockResolvedValue(mockHeaderResponse);

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHeaderData).toHaveBeenCalledWith('www.wthr.com');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        current: {
          summary: 'Clear',
          icon_url: 'https://www.wthr.com/icons/partly-cloudy-night_210x210.png',
          humidity: 87,
          temperature: 63,
          feels_like: 63,
          wind_speed: 3,
          wind_direction: 'NNW',
          precipitation_chance: 0,
          precipitation_type: 'none',
          is_daytime: false,
          observed_at: '2026-07-30T06:16:08',
        },
        hourly: [
          {
            summary: 'Sunny',
            icon_url: 'https://www.wthr.com/icons/clear-day_210x210.png',
            humidity: 86,
            temperature: 62,
            feels_like: 62,
            wind_speed: 3,
            wind_direction: 'N',
            precipitation_chance: 7,
            precipitation_type: 'Rain',
            is_daytime: true,
            hour: '7 AM',
            day_of_week: 'Thu',
          },
        ],
      });
    });

    it('should fetch Minneapolis data when city=minneapolis', async () => {
      mockGetHeaderData.mockResolvedValue(mockHeaderResponse);

      const request = createMockRequest({ query: { city: 'minneapolis' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHeaderData).toHaveBeenCalledWith('www.kare11.com');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          current: expect.objectContaining({
            icon_url: 'https://www.kare11.com/icons/partly-cloudy-night_210x210.png',
          }),
        })
      );
    });

    it('should treat city as case-insensitive', async () => {
      mockGetHeaderData.mockResolvedValue(mockHeaderResponse);

      const request = createMockRequest({ query: { city: 'MINNEAPOLIS' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHeaderData).toHaveBeenCalledWith('www.kare11.com');
    });

    it('should fetch San Antonio data when city=san_antonio', async () => {
      mockGetHeaderData.mockResolvedValue(mockHeaderResponse);

      const request = createMockRequest({ query: { city: 'san_antonio' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHeaderData).toHaveBeenCalledWith('www.kens5.com');
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should fetch Madison data from the Gray provider when city=madison', async () => {
      mockGetWeatherData.mockResolvedValue(mockGrayResponse);

      const request = createMockRequest({ query: { city: 'madison' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetWeatherData).toHaveBeenCalledWith('www.wmtv15news.com');
      expect(mockGetHeaderData).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        current: {
          summary: 'Mostly Cloudy',
          humidity: 45,
          temperature: 81,
          feels_like: 81,
          wind_speed: 9,
          wind_direction: 'S',
          is_daytime: true,
        },
        hourly: [
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
        ],
      });
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
      mockGetHeaderData.mockResolvedValue(mockHeaderResponse);

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

      expect(mockGetHeaderData).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message:
          'Unsupported city: austin. Supported cities: indianapolis, minneapolis, san_antonio, madison',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockGetHeaderData.mockRejectedValue(new Error('Failed to fetch weather data'));

      const request = createMockRequest();
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to fetch weather data',
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
