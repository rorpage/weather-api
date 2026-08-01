import { describe, it, expect, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/health';

function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: undefined,
    url: '/api/health',
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): VercelResponse {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

  return response as unknown as VercelResponse;
}

describe('health endpoint', () => {
  it('should return 200 with an ok status and an ISO timestamp', () => {
    const request = createMockRequest();
    const response = createMockResponse();

    handler(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      })
    );
  });

  it('should respond the same way regardless of request method', () => {
    const request = createMockRequest({ method: 'POST' });
    const response = createMockResponse();

    handler(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });
});
