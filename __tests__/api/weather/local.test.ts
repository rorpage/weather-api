import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { TegnaHeaderResponse } from '../../../models/tegna/TegnaHeaderResponse';
import type { HearstWeatherResponse } from '../../../models/hearst/HearstWeatherResponse';

const { mockGetHeaderData, mockGetHearstWeatherData } = vi.hoisted(() => {
  return {
    mockGetHeaderData: vi.fn(),
    mockGetHearstWeatherData: vi.fn(),
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

vi.mock('../../../services/HearstStationService', () => {
  return {
    HearstStationService: vi.fn().mockImplementation(() => {
      return {
        getWeatherData: mockGetHearstWeatherData,
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

  const mockHearstResponse: HearstWeatherResponse = {
    data: {
      current: {
        feels_like_f: 67,
        icon_name: 'nt_rain',
        rel_humidity: 90,
        sky: 'Rain Shower',
        temp_f: 67,
        wind_dir_card: 'ENE',
        wind_speed_mph: 5,
      },
      hourly: [
        {
          feels_like_f: 67,
          hour_display: '8 PM',
          icon_name: 'nt_rain',
          precip_chance: 82,
          sky_long: 'Light Rain',
          temp_f: 67,
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

    it('should limit hourly periods to 5 regardless of how many the feed returns', async () => {
      const period = mockHeaderResponse.weather.hourly[0];
      mockGetHeaderData.mockResolvedValue({
        weather: {
          ...mockHeaderResponse.weather,
          hourly: Array.from({ length: 8 }, () => period),
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(vi.mocked(response.json).mock.calls[0][0].hourly).toHaveLength(5);
    });

    it('should fetch Milwaukee data from the Hearst provider when city=milwaukee', async () => {
      mockGetHearstWeatherData.mockResolvedValue(mockHearstResponse);

      const request = createMockRequest({ query: { city: 'milwaukee' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetHearstWeatherData).toHaveBeenCalledWith('53202');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        current: {
          summary: 'Rain Shower',
          humidity: 90,
          temperature: 67,
          feels_like: 67,
          wind_speed: 5,
          wind_direction: 'ENE',
          is_daytime: false,
        },
        hourly: [
          {
            summary: 'Light Rain',
            temperature: 67,
            feels_like: 67,
            precipitation_chance: 82,
            is_daytime: false,
            hour: '8 PM',
          },
        ],
      });
    });

    it('should limit hourly periods to 5 for the Hearst provider too', async () => {
      const period = mockHearstResponse.data.hourly[0];
      mockGetHearstWeatherData.mockResolvedValue({
        data: {
          ...mockHearstResponse.data,
          hourly: Array.from({ length: 8 }, () => period),
        },
      });

      const request = createMockRequest({ query: { city: 'milwaukee' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(vi.mocked(response.json).mock.calls[0][0].hourly).toHaveLength(5);
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
          'Unsupported city: austin. Supported cities: indianapolis, minneapolis, san_antonio, milwaukee',
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
