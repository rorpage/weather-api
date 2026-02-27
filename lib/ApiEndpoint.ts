import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateMethod, validateAuth, validateParams } from '../lib/middleware';

export abstract class ApiEndpoint {
  /**
   * Get required query parameters for this endpoint
   */
  protected abstract getRequiredParams(): string[];

  /**
   * Process the request and return the response data
   */
  protected abstract process(request: VercelRequest): Promise<unknown>;

  /**
   * Main handler for the endpoint
   */
  public async handle(request: VercelRequest, response: VercelResponse): Promise<VercelResponse> {
    try {
      const methodError = validateMethod(request.method);
      if (methodError) {
        return response.status(methodError.status).json({ error: methodError.error });
      }

      const authError = validateAuth(request.headers);
      if (authError) {
        return response.status(authError.status).json({ error: authError.error });
      }

      const requiredParams = this.getRequiredParams();
      if (requiredParams.length > 0) {
        const paramsError = validateParams(request.query, requiredParams);
        if (paramsError) {
          return response.status(paramsError.status).json({ error: paramsError.error });
        }
      }

      const data = await this.process(request);

      return response.status(200).json(data);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}:`, error);

      return response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
