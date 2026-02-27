export interface NWSQuantitativeValue {
  value: number | null;
  unitCode: string;
}

export interface NWSForecastPeriodRaw {
  number: number;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  probabilityOfPrecipitation: NWSQuantitativeValue;
  relativeHumidity: NWSQuantitativeValue;
  dewpoint: NWSQuantitativeValue;
}

export interface NWSForecastResponse {
  properties: {
    generatedAt: string;
    periods: NWSForecastPeriodRaw[];
  };
}
