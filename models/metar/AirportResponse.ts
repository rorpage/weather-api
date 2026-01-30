import type { AirportInfo } from './AirportInfo';

export interface AirportResponse {
  AirportEntry?: {
    CcAirportInfoList?: AirportInfo[];
  };
}
