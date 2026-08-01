import type { NWSCurrentOutput, NWSHourlyPeriod } from '../nws/NWSForecastOutput';

export interface LocalWeatherOutput {
  current: NWSCurrentOutput;
  hourly: NWSHourlyPeriod[];
}
