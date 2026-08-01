export type RunwayFavorability = 'not_favorable' | 'favorable' | 'very_favorable';

export interface RunwayEndOutput {
  identifier: string;
  heading_degrees: number;
  latitude: number;
  longitude: number;
  crosswind_knots: number;
  headwind_knots: number;
  wind_angle_degrees: number;
  favorability: RunwayFavorability;
}

export interface RunwayOutput {
  name: string;
  length_feet: number;
  width_feet: number;
  surface: string;
  ends: [RunwayEndOutput, RunwayEndOutput];
}

export interface RunwayWindOutput {
  airport_id: string;
  airport_name: string;
  wind_direction_degrees: number;
  wind_speed_knots: number;
  best_runway_identifier: string;
  runways: RunwayOutput[];
}
