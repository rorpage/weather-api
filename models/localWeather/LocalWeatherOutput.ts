export interface LocalWeatherPeriodOutput {
  summary: string;
  icon_url?: string;
  humidity?: number;
  temperature: number;
  feels_like: number;
  wind_speed?: number;
  wind_direction?: string;
  precipitation_chance?: number;
  precipitation_type?: string;
  is_daytime: boolean;
}

export interface LocalWeatherCurrentOutput extends LocalWeatherPeriodOutput {
  observed_at?: string;
}

export interface LocalWeatherHourlyOutput extends LocalWeatherPeriodOutput {
  hour: string;
  day_of_week?: string;
}

export interface LocalWeatherOutput {
  current: LocalWeatherCurrentOutput;
  hourly: LocalWeatherHourlyOutput[];
}
