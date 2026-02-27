import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import { NWSService } from '../services/NWSService';
import { formatPeriod } from '../lib/nwsFormatters';
import type { NWSCurrentOutput } from '../models/nws/NWSForecastOutput';

class NWSCurrentEndpoint extends ApiEndpoint {
  private nwsService: NWSService;

  constructor() {
    super();
    this.nwsService = new NWSService();
  }

  protected getRequiredParams(): string[] {
    return ['lat', 'lon'];
  }

  protected async process(request: VercelRequest): Promise<NWSCurrentOutput> {
    const { lat: latitude, lon: longitude } = request.query;
    const forecastData = await this.nwsService.getHourlyForecast(latitude, longitude);

    return formatPeriod(forecastData.properties.periods[0]);
  }
}

const endpoint = new NWSCurrentEndpoint();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
