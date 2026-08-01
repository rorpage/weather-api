import { describe, it, expect, vi, afterEach } from 'vitest';
import { HearstStationService } from '../../services/HearstStationService';
import type { HearstWeatherResponse } from '../../models/hearst/HearstWeatherResponse';

describe('HearstStationService', () => {
  const mockFetch = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const mockWeatherResponse: HearstWeatherResponse = {
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

  it('should fetch weather data successfully', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockWeatherResponse,
    });

    const service = new HearstStationService();
    const result = await service.getWeatherData('53202');

    expect(result).toEqual(mockWeatherResponse);
    expect(mockFetch).toHaveBeenCalledWith('https://weather.htvapps.com/api/v1/weather/full/53202');
  });

  it('should throw error on failed API response', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      ok: false,
      text: async () => 'unable to find location',
    });

    const service = new HearstStationService();

    await expect(service.getWeatherData('00000')).rejects.toThrow(
      'Failed to fetch weather data for zip 00000'
    );
  });

  it('should handle network errors', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const service = new HearstStationService();

    await expect(service.getWeatherData('53202')).rejects.toThrow('Network error');
  });
});
