import { describe, it, expect, vi, afterEach } from 'vitest';
import { TegnaStationService } from '../../services/TegnaStationService';
import type { TegnaHeaderResponse } from '../../models/tegna/TegnaHeaderResponse';

describe('TegnaStationService', () => {
  const mockFetch = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('should fetch header data successfully', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockHeaderResponse,
    });

    const service = new TegnaStationService();
    const result = await service.getHeaderData('www.wthr.com');

    expect(result).toEqual(mockHeaderResponse);
    expect(mockFetch).toHaveBeenCalledWith('https://www.wthr.com/ajax/content/header');
  });

  it('should fetch header data from a different host', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockHeaderResponse,
    });

    const service = new TegnaStationService();
    await service.getHeaderData('www.kare11.com');

    expect(mockFetch).toHaveBeenCalledWith('https://www.kare11.com/ajax/content/header');
  });

  it('should throw error on failed API response', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({
      ok: false,
      text: async () => 'Service unavailable',
    });

    const service = new TegnaStationService();

    await expect(service.getHeaderData('www.wthr.com')).rejects.toThrow(
      'Failed to fetch weather data from www.wthr.com'
    );
  });

  it('should handle network errors', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const service = new TegnaStationService();

    await expect(service.getHeaderData('www.wthr.com')).rejects.toThrow('Network error');
  });
});
