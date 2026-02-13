import type { IncomingHttpHeaders } from 'http';
import type { ValidationError } from '../models/common/ValidationError';

/**
 * Validates that the request method is GET
 */
export function validateMethod(method: string | undefined): ValidationError | null {
  if (method !== 'GET') {
    return { status: 405, error: 'Method not allowed' };
  }
  return null;
}

/**
 * Validates the API token from request headers
 */
export function validateAuth(headers: IncomingHttpHeaders): ValidationError | null {
  const apiToken = process.env.API_TOKEN;
  const requestToken = headers['x-api-token'];

  if (!apiToken) {
    return {
      status: 500,
      error: 'Server configuration error: API token not set',
    };
  }

  if (!requestToken || requestToken !== apiToken) {
    return {
      status: 401,
      error: 'Unauthorized: Invalid or missing API token',
    };
  }

  return null;
}

/**
 * Validates required query parameters
 */
export function validateParams(
  query: { [key: string]: string | string[] | undefined },
  requiredParams: string[]
): ValidationError | null {
  const missing = requiredParams.filter((param) => !query[param]);

  if (missing.length > 0) {
    return {
      status: 400,
      error: `Missing required parameters: ${missing.join(', ')}`,
    };
  }

  return null;
}
