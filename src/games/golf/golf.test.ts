import { describe, expect, it } from "vitest";
import { CLUBS, suggestedClub } from "./clubs";
import { distanceBetween, HOLES, surfaceAt } from "./courses";
import { advanceBall, createBall, launchBall, normalizeAngle } from "./physics";

describe("golf rules and physics", () => {
  it("suggests the shortest club that can reach the target", () => {
    expect(CLUBS[suggestedClub(142, "tee")].shortName).toBe("5I");
    expect(CLUBS[suggestedClub(65, "fairway")].shortName).toBe("PW");
    expect(CLUBS[suggestedClub(280, "tee")].shortName).toBe("1W");
    expect(CLUBS[suggestedClub(20, "green")].shortName).toBe("PT");
  });

  it("classifies course surfaces with hazard precedence", () => {
    expect(surfaceAt(HOLES[0], HOLES[0].tee)).toBe("tee");
    expect(surfaceAt(HOLES[0], HOLES[0].cup)).toBe("green");
    expect(surfaceAt(HOLES[2], { x: 24, y: 220 })).toBe("water");
    expect(surfaceAt(HOLES[2], { x: -8, y: 220 })).toBe("fairway");
    expect(surfaceAt(HOLES[0], { x: 100, y: 60 })).toBe("out");
  });

  it("produces deterministic full shots", () => {
    const simulate = () => {
      const ball = createBall(HOLES[0].tee);
      launchBall(ball, CLUBS[1], 0, 0.88, 0, "tee");
      for (let step = 0; step < 900 && ball.motion !== "stopped"; step += 1) {
        const result = advanceBall(ball, HOLES[0], 1 / 60);
        if (result.hazard) break;
      }
      return ball;
    };

    const first = simulate();
    const second = simulate();
    expect(first).toEqual(second);
    expect(first.y).toBeGreaterThan(100);
    expect(first.y).toBeLessThan(170);
    expect(first.motion).toBe("stopped");
  });

  it("supports shots in every direction", () => {
    const ball = createBall(HOLES[0].tee);
    launchBall(ball, CLUBS[3], Math.PI, 0.5, 0, "fairway");
    expect(ball.vy).toBeLessThan(0);
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 8);
    expect(normalizeAngle(-Math.PI * 3)).toBeCloseTo(-Math.PI, 8);
  });

  it("captures a slow putt at the cup", () => {
    const hole = HOLES[0];
    const ball = createBall({ x: hole.cup.x, y: hole.cup.y - 3 });
    ball.motion = "rolling";
    ball.vy = 2.2;
    let holed = false;
    for (let step = 0; step < 180 && !holed; step += 1) {
      holed = advanceBall(ball, hole, 1 / 60).holed ?? false;
    }
    expect(holed).toBe(true);
    expect(distanceBetween(ball, hole.cup)).toBe(0);
  });

  it("does not capture a putt that crosses the cup too quickly", () => {
    const hole = HOLES[0];
    const ball = createBall({ x: hole.cup.x, y: hole.cup.y - 0.5 });
    ball.motion = "rolling";
    ball.vy = 8;
    expect(advanceBall(ball, hole, 1 / 60).holed).not.toBe(true);
    expect(ball.motion).toBe("rolling");
  });

  it("reports a ball entering water", () => {
    const ball = createBall({ x: 24, y: 220 });
    ball.motion = "rolling";
    ball.vy = 1;
    expect(advanceBall(ball, HOLES[2], 1 / 60).hazard).toBe("water");
  });

  it("leaves a safe center line past the third hole pond", () => {
    const hole = HOLES[2];
    const ball = createBall(hole.tee);
    const aim = Math.atan2(hole.cup.x - hole.tee.x, hole.cup.y - hole.tee.y);
    launchBall(ball, CLUBS[0], aim, 1, 0, "tee");
    let hazard: string | undefined;
    for (let step = 0; step < 900 && ball.motion !== "stopped"; step += 1) {
      hazard = advanceBall(ball, hole, 1 / 60).hazard;
      if (hazard) break;
    }
    expect(hazard).toBeUndefined();
    expect(ball.y).toBeGreaterThan(190);
  });
});
