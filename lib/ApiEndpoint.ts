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
  protected abstract process(req: VercelRequest): Promise<unknown>;

  /**
   * Main handler for the endpoint
   */
  public async handle(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
    try {
      // Validate method
      const methodError = validateMethod(req.method);
      if (methodError) {
        return res.status(methodError.status).json({ error: methodError.error });
      }

      // Validate authentication
      const authError = validateAuth(req.headers);
      if (authError) {
        return res.status(authError.status).json({ error: authError.error });
      }

      // Validate required parameters
      const requiredParams = this.getRequiredParams();
      if (requiredParams.length > 0) {
        const paramsError = validateParams(req.query, requiredParams);
        if (paramsError) {
          return res.status(paramsError.status).json({ error: paramsError.error });
        }
      }

      // Process the request
      const data = await this.process(req);

      return res.status(200).json(data);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}:`, error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
