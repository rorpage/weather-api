export interface NWSForecastOutput {
  generated_at: string;
  start_time: string;
  is_daytime: boolean;
  temperature: number;
  temperature_unit: string;
  wind_speed: string;
  wind_direction: string;
  short_forecast: string;
  probability_of_precipitation: number | null;
  relative_humidity: number | null;
}
