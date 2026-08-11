import { lieAccuracy, liePower } from "./clubs";
import { distanceBetween, surfaceAt } from "./courses";
import type { Ball, Club, Hole, Surface, Vec2 } from "./types";

const GRAVITY = 34;

export function normalizeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export type BallStep = {
  surface: Surface;
  stopped?: boolean;
  holed?: boolean;
  hazard?: "water" | "out";
};

export function createBall(position: Vec2): Ball {
  return { ...position, z: 0, vx: 0, vy: 0, vz: 0, rollDistance: 0, motion: "stopped" };
}

export function launchBall(ball: Ball, club: Club, aim: number, power: number, accuracy: number, lie: Surface) {
  const safePower = Math.max(0.12, power);
  const miss = accuracy * 0.15 * lieAccuracy(lie);
  const direction = aim + miss;
  const targetDistance = club.distance * safePower * liePower(lie);

  if (club.putter) {
    const speed = Math.sqrt(2 * 0.78 * targetDistance);
    ball.vx = Math.sin(direction) * speed;
    ball.vy = Math.cos(direction) * speed;
    ball.vz = 0;
    ball.z = 0;
    ball.rollDistance = targetDistance;
    ball.motion = "rolling";
    return;
  }

  const flightTime = club.flightTime * (0.62 + Math.sqrt(safePower) * 0.38);
  const carry = targetDistance * (0.82 + club.roll * 0.08);
  ball.rollDistance = Math.max(2, targetDistance - carry);
  const horizontalSpeed = carry / flightTime;
  ball.vx = Math.sin(direction) * horizontalSpeed;
  ball.vy = Math.cos(direction) * horizontalSpeed;
  ball.vz = (GRAVITY * flightTime) / 2;
  ball.motion = "airborne";
}

export function advanceBall(ball: Ball, hole: Hole, delta: number): BallStep {
  let surface = surfaceAt(hole, ball);

  if (ball.motion === "airborne") {
    const windScale = hole.wind.speed * 0.085;
    ball.vx += hole.wind.x * windScale * delta;
    ball.vy += hole.wind.y * windScale * delta;
    ball.vz -= GRAVITY * delta;
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;
    ball.z += ball.vz * delta;

    if (ball.z > 0) return { surface };
    ball.z = 0;
    surface = surfaceAt(hole, ball);
    if (surface === "water" || surface === "out") return { surface, hazard: surface };

    const bounce = surface === "green" ? 0.12 : surface === "bunker" ? 0.03 : 0.17;
    if (Math.abs(ball.vz) > 4.2 && bounce > 0.05) {
      ball.vz = Math.abs(ball.vz) * bounce;
      ball.vx *= 0.78;
      ball.vy *= 0.78;
      ball.rollDistance *= 0.82;
      return { surface };
    }
    ball.vz = 0;
    const landingSpeed = Math.hypot(ball.vx, ball.vy);
    const landingFriction = surface === "green" ? 0.78 : surface === "fairway" || surface === "tee" ? 2.2 : surface === "rough" ? 5.8 : 9.5;
    const surfaceRoll = surface === "bunker" ? 0.08 : surface === "rough" ? 0.4 : surface === "green" ? 0.72 : 1;
    const rollSpeed = Math.min(landingSpeed, Math.sqrt(2 * landingFriction * ball.rollDistance * surfaceRoll));
    if (landingSpeed > 0) {
      ball.vx = (ball.vx / landingSpeed) * rollSpeed;
      ball.vy = (ball.vy / landingSpeed) * rollSpeed;
    }
    ball.motion = "rolling";
  }

  if (ball.motion === "rolling") {
    surface = surfaceAt(hole, ball);
    if (surface === "water" || surface === "out") return { surface, hazard: surface };

    if (surface === "green") {
      ball.vx += hole.greenSlope.x * delta;
      ball.vy += hole.greenSlope.y * delta;
    }

    const speed = Math.hypot(ball.vx, ball.vy);
    const friction = surface === "green" ? 0.78 : surface === "fairway" || surface === "tee" ? 2.2 : surface === "rough" ? 5.8 : 9.5;
    const nextSpeed = Math.max(0, speed - friction * delta);
    if (speed > 0) {
      ball.vx = (ball.vx / speed) * nextSpeed;
      ball.vy = (ball.vy / speed) * nextSpeed;
    }
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;

    if (surface === "green" && distanceBetween(ball, hole.cup) < 0.58 && nextSpeed < 2.4) {
      ball.x = hole.cup.x;
      ball.y = hole.cup.y;
      ball.vx = 0;
      ball.vy = 0;
      ball.motion = "stopped";
      return { surface, stopped: true, holed: true };
    }

    if (nextSpeed < 0.32) {
      ball.vx = 0;
      ball.vy = 0;
      ball.motion = "stopped";
      return { surface, stopped: true };
    }
  }

  return { surface };
}
