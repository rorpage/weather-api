import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateMethod, validateAuth, validateParams } from '../../lib/middleware';

describe('middleware', () => {
  describe('validateMethod', () => {
    it('should return null for GET method', () => {
      const result = validateMethod('GET');
      expect(result).toBeNull();
    });

    it('should return error for POST method', () => {
      const result = validateMethod('POST');
      expect(result).toEqual({
        status: 405,
        error: 'Method not allowed',
      });
    });

    it('should return error for undefined method', () => {
      const result = validateMethod(undefined);
      expect(result).toEqual({
        status: 405,
        error: 'Method not allowed',
      });
    });

    it('should return error for PUT method', () => {
      const result = validateMethod('PUT');
      expect(result).toEqual({
        status: 405,
        error: 'Method not allowed',
      });
    });
  });

  describe('validateAuth', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return null when token matches', () => {
      process.env.API_TOKEN = 'test-token-123';
      const headers = { 'x-api-token': 'test-token-123' };
      const result = validateAuth(headers);
      expect(result).toBeNull();
    });

    it('should return error when API_TOKEN is not set', () => {
      delete process.env.API_TOKEN;
      const headers = { 'x-api-token': 'any-token' };
      const result = validateAuth(headers);
      expect(result).toEqual({
        status: 500,
        error: 'Server configuration error: API token not set',
      });
    });

    it('should return error when request token is missing', () => {
      process.env.API_TOKEN = 'test-token-123';
      const headers = {};
      const result = validateAuth(headers);
      expect(result).toEqual({
        status: 401,
        error: 'Unauthorized: Invalid or missing API token',
      });
    });

    it('should return error when tokens do not match', () => {
      process.env.API_TOKEN = 'correct-token';
      const headers = { 'x-api-token': 'wrong-token' };
      const result = validateAuth(headers);
      expect(result).toEqual({
        status: 401,
        error: 'Unauthorized: Invalid or missing API token',
      });
    });

    it('should handle array token values', () => {
      process.env.API_TOKEN = 'test-token-123';
      const headers = { 'x-api-token': ['test-token-123', 'extra'] };
      const result = validateAuth(headers);
      expect(result).toEqual({
        status: 401,
        error: 'Unauthorized: Invalid or missing API token',
      });
    });
  });

  describe('validateParams', () => {
    it('should return null when all required params are present', () => {
      const query = { lat: '40.7', lon: '-74.0', units: 'metric' };
      const required = ['lat', 'lon'];
      const result = validateParams(query, required);
      expect(result).toBeNull();
    });

    it('should return null when no params are required', () => {
      const query = { optional: 'value' };
      const required: string[] = [];
      const result = validateParams(query, required);
      expect(result).toBeNull();
    });

    it('should return error for single missing param', () => {
      const query = { lon: '-74.0' };
      const required = ['lat', 'lon'];
      const result = validateParams(query, required);
      expect(result).toEqual({
        status: 400,
        error: 'Missing required parameters: lat',
      });
    });

    it('should return error for multiple missing params', () => {
      const query = { units: 'metric' };
      const required = ['lat', 'lon'];
      const result = validateParams(query, required);
      expect(result).toEqual({
        status: 400,
        error: 'Missing required parameters: lat, lon',
      });
    });

    it('should handle undefined param values', () => {
      const query = { lat: undefined, lon: '-74.0' };
      const required = ['lat', 'lon'];
      const result = validateParams(query, required);
      expect(result).toEqual({
        status: 400,
        error: 'Missing required parameters: lat',
      });
    });

    it('should treat empty string as missing param', () => {
      const query = { lat: '', lon: '-74.0' };
      const required = ['lat', 'lon'];
      const result = validateParams(query, required);
      expect(result).toEqual({
        status: 400,
        error: 'Missing required parameters: lat',
      });
    });
  });
});
