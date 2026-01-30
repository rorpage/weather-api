import type { SkyCondition } from './SkyCondition';

export interface MetarOutput {
  altimeter: string;
  dewpoint: number;
  id: string;
  flight_category: string;
  observation_time: string;
  raw_text: string;
  sky_conditions: SkyCondition[];
  temperature: number;
  visibility: number;
  wind: {
    description: string;
    direction: number;
    speed: number;
  };
}
