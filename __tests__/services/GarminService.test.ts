import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GarminService } from '../../services/GarminService';
import type { AirportResponse } from '../../models/metar/AirportResponse';
import type { MetarResponse } from '../../models/metar/MetarResponse';

describe('GarminService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('getAirportInfo', () => {
    const mockAirportResponse: AirportResponse = {
      AirportEntry: {
        CcAirportInfoList: [
          {
            code: 'KUMP',
            name: 'Indianapolis Metropolitan Airport',
            city: 'Indianapolis',
            state: 'IN',
            latDeg: 39.9342,
            lonDeg: -86.0445,
            elevation: 811,
          },
        ],
      },
    };

    it('should fetch airport info successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAirportResponse,
      });

      const service = new GarminService();
      const result = await service.getAirportInfo('KUMP');

      expect(result).toEqual(mockAirportResponse);
      expect(mockFetch).toHaveBeenCalledWith('https://pilotweb.garmin.com/api/v1/airports/KUMP');
    });

    it('should construct correct URL with airport ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAirportResponse,
      });

      const service = new GarminService();
      await service.getAirportInfo('KJFK');

      expect(mockFetch).toHaveBeenCalledWith('https://pilotweb.garmin.com/api/v1/airports/KJFK');
    });

    it('should throw error on failed API response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => 'Airport not found',
      });

      const service = new GarminService();

      await expect(service.getAirportInfo('INVALID')).rejects.toThrow(
        'Failed to fetch airport data: Airport not found'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const service = new GarminService();

      await expect(service.getAirportInfo('KUMP')).rejects.toThrow('Network error');
    });

    it('should handle empty response text', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => '',
      });

      const service = new GarminService();

      await expect(service.getAirportInfo('KUMP')).rejects.toThrow(
        'Failed to fetch airport data: '
      );
    });
  });

  describe('getMetar', () => {
    const mockMetarResponse: MetarResponse = {
      metar: {
        station: 'KUMP',
        issueTime: 1609459200,
        tempC: 5,
        dewPointC: 2,
        pressure: 30.12,
        windDir: 180,
        windSpeed: 10,
        visibilityRaw: '10SM',
        visibilityRating: 'VFR',
        rawReport: 'KUMP 010000Z 18010KT 10SM OVC050 05/02 A3012',
        CloudLayers: [
          {
            type: 'OVC',
            height: 5000,
          },
        ],
      },
    };

    it('should fetch METAR data successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetarResponse,
      });

      const service = new GarminService();
      const result = await service.getMetar(39.9342, -86.0445);

      expect(result).toEqual(mockMetarResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://pilotweb.garmin.com/api/v1/wx/metar')
      );
    });

    it('should construct URL with correct coordinates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetarResponse,
      });

      const service = new GarminService();
      await service.getMetar(40.7128, -74.006);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('lat=40.7128');
      expect(calledUrl).toContain('lon=-74.006');
    });

    it('should handle negative coordinates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetarResponse,
      });

      const service = new GarminService();
      await service.getMetar(-33.9461, 18.4036);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('lat=-33.9461');
      expect(calledUrl).toContain('lon=18.4036');
    });

    it('should handle integer coordinates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetarResponse,
      });

      const service = new GarminService();
      await service.getMetar(40, -74);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('lat=40');
      expect(calledUrl).toContain('lon=-74');
    });

    it('should throw error on failed API response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => 'No METAR data available',
      });

      const service = new GarminService();

      await expect(service.getMetar(39.9342, -86.0445)).rejects.toThrow(
        'Failed to fetch METAR data: No METAR data available'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection timeout'));

      const service = new GarminService();

      await expect(service.getMetar(39.9342, -86.0445)).rejects.toThrow('Connection timeout');
    });

    it('should handle HTTP 404 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => 'Not found',
      });

      const service = new GarminService();

      await expect(service.getMetar(0, 0)).rejects.toThrow('Failed to fetch METAR data: Not found');
    });
  });
});
