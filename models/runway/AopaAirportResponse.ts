export interface AopaRunwayEnd {
  tlaName: string;
  trueAlignment: number;
  latitude: number;
  longitude: number;
}

export interface AopaLandingSurface {
  name: string;
  length: number;
  width: number;
  surfaceReadable?: string;
  takeOffLandAreas: AopaRunwayEnd[];
}

export interface AopaAirportResponse {
  icaoId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  landingSurfaces: AopaLandingSurface[];
}
