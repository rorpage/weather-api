import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import { AopaService } from '../services/AopaService';
import { GarminService } from '../services/GarminService';
import { formatRunwayWindOutput } from '../lib/runwayFormatters';
import { renderAirportDiagramPng } from '../lib/airportDiagramRenderer';
import type { DiagramTheme } from '../lib/airportDiagramRenderer';
import type { RunwayWindOutput } from '../models/runway/RunwayWindOutput';

class RunwayWindEndpoint extends ApiEndpoint {
  private aopaService: AopaService;
  private garminService: GarminService;

  constructor() {
    super();
    this.aopaService = new AopaService();
    this.garminService = new GarminService();
  }

  protected requiresAuth(): boolean {
    return false;
  }

  protected getRequiredParams(): string[] {
    return []; // id and format are optional with default values
  }

  protected async process(request: VercelRequest): Promise<RunwayWindOutput | Buffer> {
    const { id = 'KUMP', format = 'json', theme = 'light' } = request.query;

    const airportId = typeof id === 'string' ? id.toUpperCase() : 'KUMP';
    const outputFormat = typeof format === 'string' ? format.toLowerCase() : 'json';
    const diagramTheme: DiagramTheme =
      typeof theme === 'string' && theme.toLowerCase() === 'dark' ? 'dark' : 'light';

    const airport = await this.aopaService.getAirport(airportId);

    if (!airport?.location?.latitude || !airport?.location?.longitude) {
      throw new Error(`Airport location not found for ${airportId}`);
    }

    const metarResponse = await this.garminService.getMetar(
      airport.location.latitude,
      airport.location.longitude
    );

    const runwayWindOutput = formatRunwayWindOutput(airport, metarResponse.metar);

    if (outputFormat === 'png') {
      return renderAirportDiagramPng(runwayWindOutput.runways, diagramTheme);
    }

    return runwayWindOutput;
  }

  protected writeResponse(response: VercelResponse, data: unknown): VercelResponse {
    if (Buffer.isBuffer(data)) {
      response.setHeader('Content-Type', 'image/png');

      return response.status(200).send(data);
    }

    return super.writeResponse(response, data);
  }
}

const endpoint = new RunwayWindEndpoint();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
