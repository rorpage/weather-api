import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AopaService } from '../../services/AopaService';
import type { AopaAirportResponse } from '../../models/runway/AopaAirportResponse';

describe('AopaService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const mockAirportResponse: AopaAirportResponse = {
    icaoId: 'KUMP',
    name: 'Indianapolis Metropolitan Airport',
    location: { latitude: 39.9342, longitude: -86.0445 },
    landingSurfaces: [
      {
        name: '7/25',
        length: 5500,
        width: 100,
        surfaceReadable: 'Asphalt',
        takeOffLandAreas: [
          { tlaName: '07', trueAlignment: 70, latitude: 39.933, longitude: -86.05 },
          { tlaName: '25', trueAlignment: 250, latitude: 39.935, longitude: -86.039 },
        ],
      },
    ],
  };

  describe('getAirport', () => {
    it('should fetch airport runway data successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAirportResponse,
      });

      const service = new AopaService();
      const result = await service.getAirport('KUMP');

      expect(result).toEqual(mockAirportResponse);
      expect(mockFetch).toHaveBeenCalledWith('https://webapp.aopa.org/AirportsAPI/airports/KUMP');
    });

    it('should construct correct URL with airport ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAirportResponse,
      });

      const service = new AopaService();
      await service.getAirport('KJFK');

      expect(mockFetch).toHaveBeenCalledWith('https://webapp.aopa.org/AirportsAPI/airports/KJFK');
    });

    it('should throw error on failed API response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => 'Airport not found',
      });

      const service = new AopaService();

      await expect(service.getAirport('INVALID')).rejects.toThrow(
        'Failed to fetch runway data: Airport not found'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const service = new AopaService();

      await expect(service.getAirport('KUMP')).rejects.toThrow('Network error');
    });
  });
});
