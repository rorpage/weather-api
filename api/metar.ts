import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import { GarminService } from '../services/GarminService';
import type { SkyCondition } from '../models/metar/SkyCondition';
import type { MetarOutput } from '../models/metar/MetarOutput';

class MetarEndpoint extends ApiEndpoint {
  private garminService: GarminService;

  constructor() {
    super();
    this.garminService = new GarminService();
  }

  protected getRequiredParams(): string[] {
    return []; // id is optional with default value
  }

  protected async process(req: VercelRequest): Promise<MetarOutput> {
    const { id = 'KUMP' } = req.query;

    // Uppercase the airport ID
    const airportId = typeof id === 'string' ? id.toUpperCase() : 'KUMP';

    // Fetch airport information
    const airportData = await this.garminService.getAirportInfo(airportId);

    // Extract coordinates from the airport data
    const airportInfo = airportData?.AirportEntry?.CcAirportInfoList?.[0];

    if (!airportInfo || !airportInfo.latDeg || !airportInfo.lonDeg) {
      throw new Error(`Airport coordinates not found for ${airportId}`);
    }

    const lat = airportInfo.latDeg;
    const lon = airportInfo.lonDeg;

    // Fetch METAR data using coordinates
    const metarResponseData = await this.garminService.getMetar(lat, lon);
    const metarData = metarResponseData.metar;

    // Format observation time
    const observation_time = new Date(metarData.issueTime * 1000);
    const hours = observation_time.getHours();
    const hours_display = hours < 10 ? `0${hours}` : hours;
    const minutes = observation_time.getMinutes();
    const minutes_display = minutes < 10 ? `0${minutes}` : minutes;
    const time = `${hours_display}:${minutes_display} L`;

    // Format sky conditions
    const sky_conditions: SkyCondition[] = metarData.CloudLayers.map((sc) => {
      const base = Math.round(sc.height);

      let cover_display = sc.type;
      if (sc.type === 'SCT') {
        cover_display = 'Scattered';
      } else if (sc.type === 'BKN') {
        cover_display = 'Broken';
      } else if (sc.type === 'OVC') {
        cover_display = 'Overcast';
      } else if (sc.type === 'FEW') {
        cover_display = 'Few';
      }

      let description = `${cover_display} at ${base}ft`;

      if (sc.type === 'CLR') {
        description = 'Clear';
      }

      return {
        base,
        cover: sc.type,
        description,
      };
    });

    // Format wind description
    let windDescription = `${metarData.windDir}° at ${metarData.windSpeed} kt`;

    if (metarData.windDir === 0 && metarData.windSpeed === 0) {
      windDescription = 'Wind calm';
    }

    return {
      altimeter: metarData.pressure.toFixed(2),
      dewpoint: metarData.dewPointC,
      id: metarData.station,
      flight_category: metarData.visibilityRating,
      observation_time: time,
      raw_text: metarData.rawReport,
      sky_conditions: sky_conditions,
      temperature: metarData.tempC,
      visibility: parseInt(metarData.visibilityRaw.replace('SM', '')),
      wind: {
        description: windDescription,
        direction: metarData.windDir,
        speed: metarData.windSpeed,
      },
    };
  }
}

const endpoint = new MetarEndpoint();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return endpoint.handle(req, res);
}
