export interface WeatherResponse {
  current: {
    temp: number;
    feels_like: number;
    weather: Array<{
      description: string;
    }>;
  };
  daily: Array<{
    temp: {
      max: number;
      min: number;
    };
    weather: Array<{
      description: string;
    }>;
  }>;
}
