import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/tools';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: undefined,
    url: '/api/tools',
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

  return response as unknown as VercelResponse;
}

describe('tools endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('successful requests', () => {
    it('should return 200 with a tools array', async () => {
      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      const result = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        tools: unknown[];
      };
      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
    });

    it('should return tool definitions for all four weather endpoints', async () => {
      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      const result = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        tools: Array<{ name: string }>;
      };
      const names = result.tools.map((tool) => tool.name);
      expect(names).toContain('get_current_weather');
      expect(names).toContain('get_aviation_metar');
      expect(names).toContain('get_nws_current_conditions');
      expect(names).toContain('get_nws_hourly_forecast');
      expect(result.tools).toHaveLength(4);
    });

    it('should return valid Anthropic tool schema shapes', async () => {
      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      const result = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        tools: Array<{
          name: string;
          description: string;
          input_schema: { type: string; properties: object; required: string[] };
        }>;
      };

      for (const tool of result.tools) {
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(tool.input_schema.type).toBe('object');
        expect(typeof tool.input_schema.properties).toBe('object');
        expect(Array.isArray(tool.input_schema.required)).toBe(true);
      }
    });

    it('should not require authentication', async () => {
      const request = createMockRequest({ headers: {} });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should mark latitude and longitude as required for coordinate-based tools', async () => {
      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      const result = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        tools: Array<{ name: string; input_schema: { required: string[] } }>;
      };

      const coordinateTools = result.tools.filter((tool) =>
        ['get_current_weather', 'get_nws_current_conditions', 'get_nws_hourly_forecast'].includes(
          tool.name
        )
      );

      for (const tool of coordinateTools) {
        expect(tool.input_schema.required).toContain('latitude');
        expect(tool.input_schema.required).toContain('longitude');
      }
    });

    it('get_aviation_metar should have no required parameters', async () => {
      const request = createMockRequest();
      const response = createMockResponse();

      await handler(request, response);

      const result = (response.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        tools: Array<{ name: string; input_schema: { required: string[] } }>;
      };

      const metar = result.tools.find((tool) => tool.name === 'get_aviation_metar');
      expect(metar?.input_schema.required).toHaveLength(0);
    });
  });

  describe('validation errors', () => {
    it('should reject POST requests', async () => {
      const request = createMockRequest({ method: 'POST' });
      const response = createMockResponse();

      await handler(request, response);

      expect(response.status).toHaveBeenCalledWith(405);
    });
  });
});
