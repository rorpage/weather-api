import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AopaAirportResponse } from '../../models/runway/AopaAirportResponse';
import type { MetarResponse } from '../../models/metar/MetarResponse';

const { mockGetAirport, mockGetMetar, mockRenderAirportDiagramPng } = vi.hoisted(() => {
  return {
    mockGetAirport: vi.fn(),
    mockGetMetar: vi.fn(),
    mockRenderAirportDiagramPng: vi.fn(),
  };
});

vi.mock('../../services/AopaService', () => {
  return {
    AopaService: vi.fn().mockImplementation(() => {
      return { getAirport: mockGetAirport };
    }),
  };
});

vi.mock('../../services/GarminService', () => {
  return {
    GarminService: vi.fn().mockImplementation(() => {
      return { getMetar: mockGetMetar };
    }),
  };
});

vi.mock('../../lib/airportDiagramRenderer', () => {
  return {
    renderAirportDiagramPng: mockRenderAirportDiagramPng,
  };
});

import handler from '../../api/runway-wind';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: undefined,
    url: '/api/runway-wind',
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };

  return response as unknown as VercelResponse;
}

describe('runway-wind endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
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

  const mockMetarResponse: MetarResponse = {
    metar: {
      station: 'KUMP',
      issueTime: 1609459200,
      tempC: 5,
      dewPointC: 2,
      pressure: 30.12,
      windDir: 70,
      windSpeed: 10,
      visibilityRaw: '10SM',
      visibilityRating: 'VFR',
      rawReport: 'KUMP 010000Z 07010KT 10SM OVC050 05/02 A3012',
      CloudLayers: [],
    },
  };

  describe('successful requests', () => {
    it('should return formatted runway-wind JSON with default airport', async () => {
      mockGetAirport.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetAirport).toHaveBeenCalledWith('KUMP');
      expect(mockGetMetar).toHaveBeenCalledWith(39.9342, -86.0445);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          airport_id: 'KUMP',
          best_runway_identifier: '07',
        })
      );
    });

    it('should uppercase a lowercase airport id', async () => {
      mockGetAirport.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest({ query: { id: 'kump' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockGetAirport).toHaveBeenCalledWith('KUMP');
    });

    it('should return a PNG image when format=png is requested', async () => {
      mockGetAirport.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      mockRenderAirportDiagramPng.mockReturnValue(pngBuffer);

      const request = createMockRequest({ query: { format: 'png' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(mockRenderAirportDiagramPng).toHaveBeenCalled();
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalledWith(pngBuffer);
      expect(response.json).not.toHaveBeenCalled();
    });

    it('should treat format as case-insensitive', async () => {
      mockGetAirport.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      mockRenderAirportDiagramPng.mockReturnValue(pngBuffer);

      const request = createMockRequest({ query: { format: 'PNG' } });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.send).toHaveBeenCalledWith(pngBuffer);
    });
  });

  describe('validation errors', () => {
    it('should reject non-GET requests', async () => {
      const request = createMockRequest({ method: 'POST' });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(405);
    });

    it('should not require an API token', async () => {
      mockGetAirport.mockResolvedValue(mockAirportResponse);
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest({ headers: {} });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('error handling', () => {
    it('should return 500 when the airport has no location', async () => {
      mockGetAirport.mockResolvedValue({ ...mockAirportResponse, location: undefined });

      const request = createMockRequest();
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Airport location not found for KUMP' })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return 500 when the AOPA service fails', async () => {
      mockGetAirport.mockRejectedValue(new Error('AOPA unavailable'));

      const request = createMockRequest();
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'AOPA unavailable',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should return 500 when no runway has two ends', async () => {
      mockGetAirport.mockResolvedValue({
        ...mockAirportResponse,
        landingSurfaces: [
          {
            name: 'H1',
            length: 100,
            width: 100,
            surfaceReadable: 'Turf',
            takeOffLandAreas: [
              { tlaName: 'H1', trueAlignment: 0, latitude: 39.93, longitude: -86.04 },
            ],
          },
        ],
      });
      mockGetMetar.mockResolvedValue(mockMetarResponse);

      const request = createMockRequest();
      const response = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(500);

      consoleErrorSpy.mockRestore();
    });
  });
});
