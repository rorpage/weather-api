import { describe, it, expect } from 'vitest';
import { formatHearstOutput } from '../../lib/hearstFormatters';
import type { HearstWeatherResponse } from '../../models/hearst/HearstWeatherResponse';

describe('hearstFormatters', () => {
  describe('formatHearstOutput', () => {
    const mockResponse: HearstWeatherResponse = {
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
            feels_like_f: 69,
            hour_display: '2 PM',
            icon_name: 'sunny',
            precip_chance: 5,
            sky_long: 'Sunny',
            temp_f: 75,
          },
        ],
      },
    };

    it('should format current conditions and mark night from the icon name', () => {
      const result = formatHearstOutput(mockResponse);

      expect(result.current).toEqual({
        summary: 'Rain Shower',
        humidity: 90,
        temperature: 67,
        feels_like: 67,
        wind_speed: 5,
        wind_direction: 'ENE',
        is_daytime: false,
      });
    });

    it('should format hourly forecast without humidity, wind, or day_of_week', () => {
      const result = formatHearstOutput(mockResponse);

      expect(result.hourly).toEqual([
        {
          summary: 'Sunny',
          temperature: 75,
          feels_like: 69,
          precipitation_chance: 5,
          is_daytime: true,
          hour: '2 PM',
        },
      ]);
      expect(result.hourly[0].humidity).toBeUndefined();
      expect(result.hourly[0].wind_speed).toBeUndefined();
      expect(result.hourly[0].day_of_week).toBeUndefined();
    });
  });
});
