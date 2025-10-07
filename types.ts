export interface Point {
  lat: number;
  lng: number;
}

export interface Landmark {
  id: string;
  name: string;
  coords: Point;
}

export interface Asset {
  id: string;
  name: string;
  coords: Point;
}

export interface City {
  name: string;
  coords: Point;
  population: number;
  landmarks: Omit<Landmark, 'id'>[];
  assets: Asset[];
}

export interface Yield {
  kt: number;
  name: string;
  fireballRadius: number;
  shockwaveRadius: number;
  thermalRadius: number;
  falloutDimensions: {
    width: number;
    height: number;
  };
  casualties: {
    fatalities: number;
    injuries: number;
  };
}

export enum SimulationPhase {
  Idle,
  PreLaunch,
  Warning,
  ImpactEve,
  Flash,
  FireballAndShockwave,
  Aftermath,
  Fallout,
}