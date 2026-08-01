import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../../lib/ApiEndpoint';
import { TegnaStationService } from '../../services/TegnaStationService';
import { HearstStationService } from '../../services/HearstStationService';
import { formatTegnaOutput } from '../../lib/tegnaFormatters';
import { formatHearstOutput } from '../../lib/hearstFormatters';
import type { LocalWeatherOutput } from '../../models/localWeather/LocalWeatherOutput';

const DEFAULT_CITY = 'indianapolis';
const HOURLY_LIMIT = 5;

type CityStation = { provider: 'tegna'; host: string } | { provider: 'hearst'; zip: string };

const CITY_STATIONS: Record<string, CityStation> = {
  indianapolis: { provider: 'tegna', host: 'www.wthr.com' },
  minneapolis: { provider: 'tegna', host: 'www.kare11.com' },
  san_antonio: { provider: 'tegna', host: 'www.kens5.com' },
  milwaukee: { provider: 'hearst', zip: '53202' },
};

class LocalWeatherEndpoint extends ApiEndpoint {
  private tegnaService: TegnaStationService;
  private hearstService: HearstStationService;

  constructor() {
    super();
    this.tegnaService = new TegnaStationService();
    this.hearstService = new HearstStationService();
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

    const output = await this.fetchOutput(station);

    return { ...output, hourly: output.hourly.slice(0, HOURLY_LIMIT) };
  }

  private async fetchOutput(station: CityStation): Promise<LocalWeatherOutput> {
    switch (station.provider) {
      case 'hearst':
        return formatHearstOutput(await this.hearstService.getWeatherData(station.zip));
      case 'tegna':
        return formatTegnaOutput(
          (await this.tegnaService.getHeaderData(station.host)).weather,
          station.host
        );
    }
  }
}

const endpoint = new LocalWeatherEndpoint();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
