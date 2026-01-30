import type { CloudLayer } from './CloudLayer';

export interface MetarData {
  issueTime: number;
  CloudLayers: CloudLayer[];
  windDir: number;
  windSpeed: number;
  pressure: number;
  dewPointC: number;
  station: string;
  visibilityRating: string;
  rawReport: string;
  tempC: number;
  visibilityRaw: string;
}
