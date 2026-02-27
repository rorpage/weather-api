import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AirportResponse } from '../../models/metar/AirportResponse';
import type { MetarResponse } from '../../models/metar/MetarResponse';

// Create mock functions using vi.hoisted to avoid initialization issues
const { mockGetAirportInfo, mockGetMetar } = vi.hoisted(() => {
  return {
    mockGetAirportInfo: vi.fn(),
    mockGetMetar: vi.fn(),
  };
});

// Mock GarminService
vi.mock('../../services/GarminService', () => {
  return {
    GarminService: vi.fn().mockImplementation(() => {
      return {
        getAirportInfo: mockGetAirportInfo,
        getMetar: mockGetMetar,
      };
    }),
  };
});

import handler from '../../api/metar';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { 'x-api-token': 'test-token' },
    query: {},
    body: undefined,
    url: '/api/metar',
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

describe('metar endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, API_TOKEN: 'test-token' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

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

  describe('successful requests', () => {
    it('should return formatted METAR data with default airport', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetAirportInfo).toHaveBeenCalledWith('KUMP');
      expect(mockGetMetar).toHaveBeenCalledWith(39.9342, -86.0445);
      expect(response.status).toHaveBeenCalledWith(200);

      const jsonCall = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonCall.altimeter).toBe('30.12');
      expect(jsonCall.dewpoint).toBe(2);
      expect(jsonCall.id).toBe('KUMP');
      expect(jsonCall.flight_category).toBe('VFR');
      expect(jsonCall.observation_time).toMatch(/^\d{2}:\d{2} L$/);
      expect(jsonCall.raw_text).toBe('KUMP 010000Z 18010KT 10SM OVC050 05/02 A3012');
      expect(jsonCall.sky_conditions).toEqual([
        {
          base: 5000,
          cover: 'OVC',
          description: 'Overcast at 5000ft',
        },
      ]);
      expect(jsonCall.temperature).toBe(5);
      expect(jsonCall.visibility).toBe(10);
      expect(jsonCall.wind).toEqual({
        description: '180° at 10 kt',
        direction: 180,
        speed: 10,
      });
    });

    it('should handle custom airport ID', async () => {
      mockGetAirportInfo.mockResolvedValue({
        AirportEntry: {
          CcAirportInfoList: [
            {
              code: 'KJFK',
              name: 'John F Kennedy International Airport',
              city: 'New York',
              state: 'NY',
              latDeg: 40.6413,
              lonDeg: -73.7781,
              elevation: 13,
            },
          ],
        },
      });
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest({
        query: { id: 'kjfk' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetAirportInfo).toHaveBeenCalledWith('KJFK');
    });

    it('should convert lowercase airport ID to uppercase', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest({
        query: { id: 'kump' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetAirportInfo).toHaveBeenCalledWith('KUMP');
    });

    it('should format sky conditions - Scattered', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue({
        metar: {
          ...mockMetarResponse.metar,
          CloudLayers: [{ type: 'SCT', height: 3000 }],
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sky_conditions: [
            {
              base: 3000,
              cover: 'SCT',
              description: 'Scattered at 3000ft',
            },
          ],
        })
      );
    });

    it('should format sky conditions - Broken', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue({
        metar: {
          ...mockMetarResponse.metar,
          CloudLayers: [{ type: 'BKN', height: 2500 }],
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sky_conditions: [
            {
              base: 2500,
              cover: 'BKN',
              description: 'Broken at 2500ft',
            },
          ],
        })
      );
    });

    it('should format sky conditions - Few', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue({
        metar: {
          ...mockMetarResponse.metar,
          CloudLayers: [{ type: 'FEW', height: 1200 }],
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sky_conditions: [
            {
              base: 1200,
              cover: 'FEW',
              description: 'Few at 1200ft',
            },
          ],
        })
      );
    });

    it('should format sky conditions - Clear', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue({
        metar: {
          ...mockMetarResponse.metar,
          CloudLayers: [{ type: 'CLR', height: 0 }],
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sky_conditions: [
            {
              base: 0,
              cover: 'CLR',
              description: 'Clear',
            },
          ],
        })
      );
    });

    it('should format calm wind conditions', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue({
        metar: {
          ...mockMetarResponse.metar,
          windDir: 0,
          windSpeed: 0,
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          wind: {
            description: 'Wind calm',
            direction: 0,
            speed: 0,
          },
        })
      );
    });

    it('should handle multiple cloud layers', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue({
        metar: {
          ...mockMetarResponse.metar,
          CloudLayers: [
            { type: 'FEW', height: 1500 },
            { type: 'SCT', height: 3000 },
            { type: 'OVC', height: 8000 },
          ],
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sky_conditions: [
            { base: 1500, cover: 'FEW', description: 'Few at 1500ft' },
            { base: 3000, cover: 'SCT', description: 'Scattered at 3000ft' },
            { base: 8000, cover: 'OVC', description: 'Overcast at 8000ft' },
          ],
        })
      );
    });

    it('should format time with leading zeros for hours and minutes', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue({
        metar: {
          ...mockMetarResponse.metar,
          issueTime: 1609466460, // 02:01 local time
        },
      });

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      const jsonCall = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        observation_time: string;
      };
      expect(jsonCall.observation_time).toMatch(/^\d{2}:\d{2} L$/);
    });
  });

  describe('validation errors', () => {
    it('should reject POST requests', async () => {
      const request = createMockRequest({ method: 'POST' });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(405);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });

    it('should reject requests with invalid token', async () => {
      const request = createMockRequest({
        headers: { 'x-api-token': 'wrong-token' },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(401);
    });
  });

  describe('error handling', () => {
    it('should handle missing airport coordinates', async () => {
      mockGetAirportInfo.mockResolvedValue({
        AirportEntry: {
          CcAirportInfoList: [
            {
              code: 'TEST',
              name: 'Test Airport',
            },
          ],
        },
      });

      const request = createMockRequest({
        query: { id: 'TEST' },
      });
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Airport coordinates not found for TEST',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle airport service errors', async () => {
      mockGetAirportInfo.mockRejectedValue(new Error('Airport not found'));

      const request = createMockRequest({
        query: { id: 'INVALID' },
      });
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Airport not found',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle METAR service errors', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockRejectedValue(new Error('METAR data unavailable'));

      const request = createMockRequest();
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'METAR data unavailable',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle array airport ID by taking first element', async () => {
      mockGetAirportInfo.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest({
        query: { id: ['kump', 'other'] },
      });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetAirportInfo).toHaveBeenCalledWith('KUMP');
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });
});
