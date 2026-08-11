import type { Club, Surface } from "./types";

export const CLUBS: readonly Club[] = [
  { name: "Driver", shortName: "1W", distance: 225, flightTime: 2.05, roll: 0.84 },
  { name: "Five iron", shortName: "5I", distance: 160, flightTime: 2.15, roll: 0.68 },
  { name: "Nine iron", shortName: "9I", distance: 108, flightTime: 2.35, roll: 0.48 },
  { name: "Wedge", shortName: "PW", distance: 68, flightTime: 2.55, roll: 0.34 },
  { name: "Putter", shortName: "PT", distance: 36, flightTime: 0, roll: 1, putter: true },
];

export function suggestedClub(distance: number, surface: Surface) {
  if (surface === "green") return CLUBS.length - 1;
  const playable = CLUBS.slice(0, -1);
  for (let index = playable.length - 1; index >= 0; index -= 1) {
    if (playable[index].distance >= distance) return index;
  }
  return 0;
}

export function liePower(surface: Surface) {
  switch (surface) {
    case "bunker": return 0.66;
    case "rough": return 0.82;
    default: return 1;
  }
}

export function lieAccuracy(surface: Surface) {
  switch (surface) {
    case "bunker": return 1.55;
    case "rough": return 1.25;
    default: return 1;
  }
}
