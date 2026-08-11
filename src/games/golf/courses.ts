import type { Ellipse, FairwayPoint, Hole, Surface, Vec2, WaterHazard } from "./types";

export const HOLES: readonly Hole[] = [
  {
    name: "FIRST LIGHT",
    par: 3,
    length: 142,
    tee: { x: 0, y: 0 },
    cup: { x: 9, y: 142 },
    fairway: [
      { y: 0, x: 0, width: 34 },
      { y: 55, x: -3, width: 38 },
      { y: 105, x: 5, width: 33 },
      { y: 142, x: 9, width: 26 },
    ],
    green: { x: 9, y: 142, radiusX: 18, radiusY: 15 },
    bunkers: [
      { x: -11, y: 128, radiusX: 9, radiusY: 6 },
      { x: 25, y: 148, radiusX: 7, radiusY: 9 },
    ],
    water: [],
    wind: { x: 0.72, y: 0.18, speed: 3 },
    greenSlope: { x: -0.12, y: -0.04 },
  },
  {
    name: "DOGLEG RADIO",
    par: 4,
    length: 292,
    tee: { x: 0, y: 0 },
    cup: { x: 31, y: 292 },
    fairway: [
      { y: 0, x: 0, width: 35 },
      { y: 85, x: -10, width: 44 },
      { y: 160, x: -5, width: 39 },
      { y: 225, x: 21, width: 34 },
      { y: 292, x: 31, width: 26 },
    ],
    green: { x: 31, y: 292, radiusX: 17, radiusY: 14 },
    bunkers: [
      { x: 14, y: 270, radiusX: 11, radiusY: 6 },
      { x: 48, y: 296, radiusX: 8, radiusY: 10 },
    ],
    water: [
      { kind: "ellipse", x: 43, y: 185, radiusX: 22, radiusY: 34 },
    ],
    wind: { x: -0.45, y: 0.35, speed: 5 },
    greenSlope: { x: 0.1, y: -0.08 },
  },
  {
    name: "LONG WAY HOME",
    par: 5,
    length: 438,
    tee: { x: 0, y: 0 },
    cup: { x: -18, y: 438 },
    fairway: [
      { y: 0, x: 0, width: 36 },
      { y: 95, x: 7, width: 45 },
      { y: 190, x: 1, width: 46 },
      { y: 270, x: -24, width: 37 },
      { y: 355, x: -27, width: 34 },
      { y: 438, x: -18, width: 26 },
    ],
    green: { x: -18, y: 438, radiusX: 18, radiusY: 15 },
    bunkers: [
      { x: -45, y: 342, radiusX: 9, radiusY: 15 },
      { x: -35, y: 426, radiusX: 10, radiusY: 7 },
      { x: 1, y: 445, radiusX: 8, radiusY: 10 },
    ],
    water: [
      { kind: "ellipse", x: 24, y: 220, radiusX: 18, radiusY: 27 },
    ],
    wind: { x: 0.2, y: -0.75, speed: 7 },
    greenSlope: { x: 0.05, y: 0.13 },
  },
];

function insideEllipse(point: Vec2, ellipse: Ellipse) {
  const dx = (point.x - ellipse.x) / ellipse.radiusX;
  const dy = (point.y - ellipse.y) / ellipse.radiusY;
  return dx * dx + dy * dy <= 1;
}

function insideWater(point: Vec2, hazard: WaterHazard) {
  if (hazard.kind === "ellipse") return insideEllipse(point, hazard);
  return Math.abs(point.x - hazard.x) <= hazard.width / 2 && Math.abs(point.y - hazard.y) <= hazard.height / 2;
}

export function fairwayAt(points: readonly FairwayPoint[], y: number) {
  if (y <= points[0].y) return points[0];
  for (let index = 1; index < points.length; index += 1) {
    const before = points[index - 1];
    const after = points[index];
    if (y <= after.y) {
      const amount = (y - before.y) / (after.y - before.y);
      return {
        y,
        x: before.x + (after.x - before.x) * amount,
        width: before.width + (after.width - before.width) * amount,
      };
    }
  }
  return points[points.length - 1];
}

export function surfaceAt(hole: Hole, point: Vec2): Surface {
  if (point.y < -14 || point.y > hole.length + 28 || Math.abs(point.x) > 76) return "out";
  if (hole.water.some((hazard) => insideWater(point, hazard))) return "water";
  if (insideEllipse(point, hole.green)) return "green";
  if (hole.bunkers.some((bunker) => insideEllipse(point, bunker))) return "bunker";
  if (point.y < 14 && Math.abs(point.x - hole.tee.x) < 12) return "tee";
  const fairway = fairwayAt(hole.fairway, point.y);
  return Math.abs(point.x - fairway.x) <= fairway.width / 2 ? "fairway" : "rough";
}

export function distanceBetween(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
