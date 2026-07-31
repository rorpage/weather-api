export interface GrayCurrentObservation {
  dayOrNight: string;
  iconCode: number;
  relativeHumidity: number;
  temperature: number;
  temperatureFeelsLike: number;
  windDirectionCardinal: string;
  windSpeed: number;
  wxPhraseLong: string;
}

export interface GrayHourlyForecastPeriod {
  dayOfWeek: string;
  dayOrNight: string;
  iconCode: number;
  precipChance: number;
  precipType: string;
  relativeHumidity: number;
  temperature: number;
  temperatureFeelsLike: number;
  validTimeLocal: string;
  windDirectionCardinal: string;
  windSpeed: number;
  wxPhraseLong: string;
}

export interface GrayWeatherResponse {
  imperial: {
    currentObservation: GrayCurrentObservation;
    hourlyForecast: GrayHourlyForecastPeriod[];
  };
}
