import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../../lib/ApiEndpoint';

// Mock implementation of ApiEndpoint for testing
class TestEndpoint extends ApiEndpoint {
  private mockRequiredParams: string[];
  private mockProcessFn: (req: VercelRequest) => Promise<unknown>;

  constructor(
    requiredParams: string[] = [],
    processFn: (req: VercelRequest) => Promise<unknown> = async () => ({ success: true })
  ) {
    super();
    this.mockRequiredParams = requiredParams;
    this.mockProcessFn = processFn;
  }

  protected getRequiredParams(): string[] {
    return this.mockRequiredParams;
  }

  protected async process(req: VercelRequest): Promise<unknown> {
    return this.mockProcessFn(req);
  }
}

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: { 'x-api-token': 'test-token' },
    query: {},
    body: undefined,
    url: '/test',
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
}

describe('ApiEndpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, API_TOKEN: 'test-token' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('handle - method validation', () => {
    it('should accept GET requests', async () => {
      const endpoint = new TestEndpoint();
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should reject POST requests', async () => {
      const endpoint = new TestEndpoint();
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should reject PUT requests', async () => {
      const endpoint = new TestEndpoint();
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('handle - authentication validation', () => {
    it('should accept valid token', async () => {
      const endpoint = new TestEndpoint();
      const req = createMockRequest({
        headers: { 'x-api-token': 'test-token' },
      });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject missing token', async () => {
      const endpoint = new TestEndpoint();
      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid or missing API token',
      });
    });

    it('should reject invalid token', async () => {
      const endpoint = new TestEndpoint();
      const req = createMockRequest({
        headers: { 'x-api-token': 'wrong-token' },
      });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 when API_TOKEN is not configured', async () => {
      delete process.env.API_TOKEN;
      const endpoint = new TestEndpoint();
      const req = createMockRequest();
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server configuration error: API token not set',
      });
    });
  });

  describe('handle - parameter validation', () => {
    it('should accept request with all required params', async () => {
      const endpoint = new TestEndpoint(['lat', 'lon']);
      const req = createMockRequest({
        query: { lat: '40.7', lon: '-74.0' },
      });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject request missing required params', async () => {
      const endpoint = new TestEndpoint(['lat', 'lon']);
      const req = createMockRequest({ query: { lat: '40.7' } });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required parameters: lon',
      });
    });

    it('should skip param validation when no params required', async () => {
      const endpoint = new TestEndpoint([]);
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('handle - process execution', () => {
    it('should execute process method and return result', async () => {
      const mockData = { temperature: 72, conditions: 'sunny' };
      const processFn = vi.fn().mockResolvedValue(mockData);
      const endpoint = new TestEndpoint([], processFn);
      const req = createMockRequest();
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(processFn).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle process errors', async () => {
      const processFn = vi.fn().mockRejectedValue(new Error('API failure'));
      const endpoint = new TestEndpoint([], processFn);
      const req = createMockRequest();
      const res = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'API failure',
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      const processFn = vi.fn().mockRejectedValue('String error');
      const endpoint = new TestEndpoint([], processFn);
      const req = createMockRequest();
      const res = createMockResponse();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Unknown error',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handle - integration scenarios', () => {
    it('should process valid request end-to-end', async () => {
      const mockResult = { data: 'test data' };
      const processFn = vi.fn().mockResolvedValue(mockResult);
      const endpoint = new TestEndpoint(['id'], processFn);
      const req = createMockRequest({ query: { id: '123' } });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should validate in correct order: method -> auth -> params', async () => {
      const endpoint = new TestEndpoint(['lat']);
      const req = createMockRequest({
        method: 'POST',
        headers: {},
        query: {},
      });
      const res = createMockResponse();

      await endpoint.handle(req, res);

      // Should fail at method validation first
      expect(res.status).toHaveBeenCalledWith(405);
    });
  });
});
