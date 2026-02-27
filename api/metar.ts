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

  protected async process(request: VercelRequest): Promise<MetarOutput> {
    const { id = 'KUMP' } = request.query;

    const airportId = typeof id === 'string' ? id.toUpperCase() : 'KUMP';

    const airportData = await this.garminService.getAirportInfo(airportId);

    const airportInfo = airportData?.AirportEntry?.CcAirportInfoList?.[0];

    if (!airportInfo || !airportInfo.latDeg || !airportInfo.lonDeg) {
      throw new Error(`Airport coordinates not found for ${airportId}`);
    }

    const latitude = airportInfo.latDeg;
    const longitude = airportInfo.lonDeg;

    const metarResponseData = await this.garminService.getMetar(latitude, longitude);
    const metarData = metarResponseData.metar;

    const observationTime = new Date(metarData.issueTime * 1000);
    const hours = observationTime.getHours();
    const hoursDisplay = hours < 10 ? `0${hours}` : hours;
    const minutes = observationTime.getMinutes();
    const minutesDisplay = minutes < 10 ? `0${minutes}` : minutes;
    const time = `${hoursDisplay}:${minutesDisplay} L`;

    const sky_conditions: SkyCondition[] = metarData.CloudLayers.map((cloudLayer) => {
      const base = Math.round(cloudLayer.height);

      let coverDisplay = cloudLayer.type;
      if (cloudLayer.type === 'SCT') {
        coverDisplay = 'Scattered';
      } else if (cloudLayer.type === 'BKN') {
        coverDisplay = 'Broken';
      } else if (cloudLayer.type === 'OVC') {
        coverDisplay = 'Overcast';
      } else if (cloudLayer.type === 'FEW') {
        coverDisplay = 'Few';
      }

      let description = `${coverDisplay} at ${base}ft`;

      if (cloudLayer.type === 'CLR') {
        description = 'Clear';
      }

      return {
        base,
        cover: cloudLayer.type,
        description,
      };
    });

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

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
