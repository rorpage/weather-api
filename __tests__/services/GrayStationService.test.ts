import { describe, it, expect, vi, afterEach } from 'vitest';
import { GrayStationService } from '../../services/GrayStationService';
import type { GrayWeatherResponse } from '../../models/gray/GrayWeatherResponse';

describe('GrayStationService', () => {
  const mockFetch = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const mockWeatherResponse: GrayWeatherResponse = {
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

  it('should fetch weather data successfully', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockWeatherResponse,
    });

    const service = new GrayStationService();
    const result = await service.getWeatherData('www.wmtv15news.com');

    expect(result).toEqual(mockWeatherResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.wmtv15news.com/pf/api/v3/content/fetch/wx-current-conditions-v3'
    );
  });

  it('should throw error on failed API response', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      ok: false,
      text: async () => 'Service unavailable',
    });

    const service = new GrayStationService();

    await expect(service.getWeatherData('www.wmtv15news.com')).rejects.toThrow(
      'Failed to fetch weather data from www.wmtv15news.com'
    );
  });

  it('should handle network errors', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const service = new GrayStationService();

    await expect(service.getWeatherData('www.wmtv15news.com')).rejects.toThrow('Network error');
  });
});
