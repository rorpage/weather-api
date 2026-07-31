import { describe, it, expect } from 'vitest';
import { formatTegnaOutput } from '../../lib/tegnaFormatters';
import type { TegnaHeaderResponse } from '../../models/tegna/TegnaHeaderResponse';

describe('tegnaFormatters', () => {
  describe('formatTegnaOutput', () => {
    const mockWeather: TegnaHeaderResponse['weather'] = {
      current: {
        iconCode: 31,
        icons: [
          { width: 16, height: 16, url: '/icons/partly-cloudy-night_16x16.png' },
          { width: 128, height: 128, url: '/icons/partly-cloudy-night_128x128.png' },
          { width: 210, height: 210, url: '/icons/partly-cloudy-night_210x210.png' },
        ],
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
    };

    it('should format current conditions and hourly forecast', () => {
      expect(formatTegnaOutput(mockWeather, 'www.wthr.com')).toEqual({
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

    it('should build icon URLs against the given host', () => {
      const result = formatTegnaOutput(mockWeather, 'www.kare11.com');

      expect(result.current.icon_url).toBe(
        'https://www.kare11.com/icons/partly-cloudy-night_210x210.png'
      );
      expect(result.hourly[0].icon_url).toBe('https://www.kare11.com/icons/clear-day_210x210.png');
    });

    it('should fall back to the first icon when no 210x210 variant exists', () => {
      const weatherWithoutPreferredSize: TegnaHeaderResponse['weather'] = {
        ...mockWeather,
        current: {
          ...mockWeather.current,
          icons: [{ width: 64, height: 64, url: '/icons/clear-night_64x64.png' }],
        },
      };

      const result = formatTegnaOutput(weatherWithoutPreferredSize, 'www.wthr.com');

      expect(result.current.icon_url).toBe('https://www.wthr.com/icons/clear-night_64x64.png');
    });
  });
});
