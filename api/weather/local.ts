import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../../lib/ApiEndpoint';
import { TegnaStationService } from '../../services/TegnaStationService';
import { GrayStationService } from '../../services/GrayStationService';
import { formatTegnaOutput } from '../../lib/tegnaFormatters';
import { formatGrayOutput } from '../../lib/grayFormatters';
import type { LocalWeatherOutput } from '../../models/localWeather/LocalWeatherOutput';

const DEFAULT_CITY = 'indianapolis';
const HOURLY_LIMIT = 5;

const CITY_STATIONS: Record<string, { provider: 'tegna' | 'gray'; host: string }> = {
  indianapolis: { provider: 'tegna', host: 'www.wthr.com' },
  minneapolis: { provider: 'tegna', host: 'www.kare11.com' },
  san_antonio: { provider: 'tegna', host: 'www.kens5.com' },
  madison: { provider: 'gray', host: 'www.wmtv15news.com' },
};

class LocalWeatherEndpoint extends ApiEndpoint {
  private tegnaService: TegnaStationService;
  private grayService: GrayStationService;

  constructor() {
    super();
    this.tegnaService = new TegnaStationService();
    this.grayService = new GrayStationService();
  }

  protected requiresAuth(): boolean {
    return false;
  }

  protected getRequiredParams(): string[] {
    return [];
  }

  protected async process(request: VercelRequest): Promise<LocalWeatherOutput> {
    const { city = DEFAULT_CITY } = request.query;
    const cityKey = (Array.isArray(city) ? city[0] : city).toLowerCase();
    const station = CITY_STATIONS[cityKey];

    if (!station) {
      throw new Error(
        `Unsupported city: ${cityKey}. Supported cities: ${Object.keys(CITY_STATIONS).join(', ')}`
      );
    }

    const output =
      station.provider === 'gray'
        ? formatGrayOutput(await this.grayService.getWeatherData(station.host))
        : formatTegnaOutput(
            (await this.tegnaService.getHeaderData(station.host)).weather,
            station.host
          );

    return { ...output, hourly: output.hourly.slice(0, HOURLY_LIMIT) };
  }
}

const endpoint = new LocalWeatherEndpoint();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
