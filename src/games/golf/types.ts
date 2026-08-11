export type Vec2 = { x: number; y: number };

export type Surface = "tee" | "fairway" | "rough" | "bunker" | "green" | "water" | "out";

export type FairwayPoint = {
  y: number;
  x: number;
  width: number;
};

export type Ellipse = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
};

export type WaterHazard = Ellipse & { kind: "ellipse" } | {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Hole = {
  name: string;
  par: number;
  length: number;
  tee: Vec2;
  cup: Vec2;
  fairway: readonly FairwayPoint[];
  green: Ellipse;
  bunkers: readonly Ellipse[];
  water: readonly WaterHazard[];
  wind: Vec2 & { speed: number };
  greenSlope: Vec2;
};

export type Club = {
  name: string;
  shortName: string;
  distance: number;
  flightTime: number;
  roll: number;
  putter?: boolean;
};

export type BallMotion = "stopped" | "airborne" | "rolling";

export type Ball = Vec2 & {
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rollDistance: number;
  motion: BallMotion;
};
