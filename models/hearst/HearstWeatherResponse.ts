export interface HearstCurrentConditions {
  feels_like_f: number;
  icon_name: string;
  rel_humidity: number;
  sky: string;
  temp_f: number;
  wind_dir_card: string;
  wind_speed_mph: number;
}

export interface HearstHourlyPeriod {
  feels_like_f: number;
  hour_display: string;
  icon_name: string;
  precip_chance: number;
  sky_long: string;
  temp_f: number;
}

export interface HearstWeatherResponse {
  data: {
    current: HearstCurrentConditions;
    hourly: HearstHourlyPeriod[];
  };
}
