export interface NWSHourlyPeriod {
  start_time: string;
  start_time_formatted_time: string;
  start_time_formatted_datetime: string;
  is_daytime: boolean;
  temperature: number;
  temperature_unit: string;
  wind_speed: string;
  wind_direction: string;
  short_forecast: string;
  probability_of_precipitation: number | null;
  relative_humidity: number | null;
}

export type NWSCurrentOutput = NWSHourlyPeriod;

export interface NWSHourlyForecastOutput {
  periods: NWSHourlyPeriod[];
}
