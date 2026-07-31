export interface TegnaIcon {
  width: number;
  height: number;
  url: string;
}

export interface TegnaWind {
  speed: number;
  direction: string;
}

export interface TegnaPrecip {
  chance: number;
  type: string;
}

export interface TegnaTemp {
  air: number;
  feelsLike: number;
}

interface TegnaPeriodBase {
  iconCode: number;
  icons: TegnaIcon[];
  summary: string;
  humidity: number;
  wind: TegnaWind;
  precip: TegnaPrecip;
  temp: TegnaTemp;
}

export interface TegnaCurrentPeriod extends TegnaPeriodBase {
  time: {
    epoch: number;
    local: string;
    dayOfWeek: string;
    dayOrNight: string;
  };
}

export interface TegnaHourlyPeriod extends TegnaPeriodBase {
  time: {
    epoch: number;
    hour: string;
    dayOfWeek: string;
    dayOrNight: string;
  };
}

export interface TegnaHeaderResponse {
  weather: {
    hourly: TegnaHourlyPeriod[];
    current: TegnaCurrentPeriod;
  };
}
