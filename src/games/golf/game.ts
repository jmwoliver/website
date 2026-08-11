import type { GameContext, GameInstance } from "../runtime/types";
import { CLUBS, suggestedClub } from "./clubs";
import { distanceBetween, fairwayAt, HOLES, surfaceAt } from "./courses";
import { advanceBall, createBall, launchBall, normalizeAngle } from "./physics";
import type { Ball, Hole, Surface, Vec2 } from "./types";

type GameMode = "title" | "playing" | "holeComplete" | "roundComplete";
type ShotPhase = "aiming" | "power" | "accuracy" | "moving";

const COLORS = {
  ink: "#172b2c",
  cream: "#f0e3bb",
  sky: "#8fb8ad",
  rough: "#477a45",
  roughDark: "#35643d",
  fairway: "#73a552",
  fairwayLight: "#82b45d",
  green: "#9ac064",
  bunker: "#d7b66d",
  bunkerDark: "#af884f",
  water: "#477f8d",
  red: "#c95f4a",
  white: "#fff8dc",
} as const;

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 240;
const HUD_HEIGHT = 34;
const METER_TOP = 208;
const WORLD_SCALE = 1.15;

export class GolfGame implements GameInstance {
  readonly #context: GameContext;
  readonly #draw: CanvasRenderingContext2D;
  #mode: GameMode = "title";
  #phase: ShotPhase = "aiming";
  #holeIndex = 0;
  #ball: Ball = createBall(HOLES[0].tee);
  #shotOrigin: Vec2 = { ...HOLES[0].tee };
  #surface: Surface = "tee";
  #aim = 0;
  #clubIndex = 2;
  #power = 0;
  #powerDirection = 1;
  #lockedPower = 0;
  #accuracy = 1;
  #strokes = 0;
  #scores: number[] = [];
  #camera = { x: 0, y: -8 };
  #message = "";
  #messageTime = 0;
  #elapsed = 0;
  #puttingView = false;
  #bestScore: number | null;

  constructor(context: GameContext) {
    this.#context = context;
    this.#draw = context.context;
    this.#draw.imageSmoothingEnabled = false;
    this.#bestScore = context.storage.get<number | null>("bestScore", null);
  }

  update(delta: number) {
    this.#elapsed += delta;
    this.#messageTime = Math.max(0, this.#messageTime - delta);

    if (this.#mode === "title") {
      if (this.#context.input.consumePressed("primary")) this.#startRound();
      return;
    }

    if (this.#mode === "holeComplete") {
      if (this.#context.input.consumePressed("primary")) this.#advanceHole();
      return;
    }

    if (this.#mode === "roundComplete") {
      if (this.#context.input.consumePressed("primary")) this.#startRound();
      return;
    }

    const hole = this.#hole;
    if (this.#phase === "moving") {
      const beforeMotion = this.#ball.motion;
      const result = advanceBall(this.#ball, hole, delta);
      this.#camera.x += (this.#ball.x - this.#camera.x) * Math.min(1, delta * 3.8);
      this.#camera.y += (this.#ball.y - 8 - this.#camera.y) * Math.min(1, delta * 4.2);

      if (beforeMotion === "airborne" && this.#ball.motion === "rolling") {
        this.#context.audio.noise(0.035, 0.02);
      }

      if (result.hazard) {
        this.#strokes += 1;
        this.#ball = createBall(this.#shotOrigin);
        this.#surface = surfaceAt(hole, this.#ball);
        this.#phase = "aiming";
        this.#puttingView = false;
        this.#setSuggestedClub();
        this.#showMessage(result.hazard === "water" ? "WATER  +1" : "OUT OF BOUNDS  +1", 1.8);
        this.#context.audio.tone({ frequency: 105, endFrequency: 58, duration: 0.34, type: "sawtooth", volume: 0.045 });
        return;
      }

      if (result.holed) {
        this.#surface = "green";
        this.#scores.push(this.#strokes);
        this.#mode = "holeComplete";
        this.#context.audio.tone({ frequency: 660, duration: 0.09, volume: 0.055 });
        window.setTimeout(() => this.#context.audio.tone({ frequency: 880, duration: 0.18, volume: 0.05 }), 90);
        return;
      }

      if (result.stopped) {
        this.#surface = surfaceAt(hole, this.#ball);
        this.#puttingView = this.#surface === "green";
        this.#phase = "aiming";
        this.#setSuggestedClub();
        this.#showMessage(this.#surface.toUpperCase(), 0.9);
      }
      return;
    }

    this.#camera.x += (this.#ball.x - this.#camera.x) * Math.min(1, delta * 5);
    this.#camera.y += (this.#ball.y - 8 - this.#camera.y) * Math.min(1, delta * 5);

    if (this.#context.input.consumePressed("secondary")) {
      this.#phase = "aiming";
      this.#power = 0;
      return;
    }

    if (this.#phase === "aiming") {
      const direction = Number(this.#context.input.isDown("right")) - Number(this.#context.input.isDown("left"));
      this.#aim += direction * delta * 0.72;
      this.#aim = normalizeAngle(this.#aim);

      const clubUp = this.#context.input.consumePressed("up");
      const clubDown = this.#context.input.consumePressed("down");
      if ((clubUp || clubDown) && this.#surface !== "green") {
        const amount = clubUp ? 1 : -1;
        const playableCount = CLUBS.length - 1;
        this.#clubIndex = (this.#clubIndex + amount + playableCount) % playableCount;
        this.#context.audio.tone({ frequency: 330 + this.#clubIndex * 45, duration: 0.045, volume: 0.025 });
      }

      if (this.#context.input.consumePressed("primary")) {
        this.#phase = "power";
        this.#power = 0;
        this.#powerDirection = 1;
        this.#context.audio.tone({ frequency: 260, duration: 0.04, volume: 0.025 });
      }
      return;
    }

    if (this.#phase === "power") {
      this.#power += delta * 0.92 * this.#powerDirection;
      if (this.#power >= 1) {
        this.#power = 1;
        this.#powerDirection = -1;
      } else if (this.#power <= 0) {
        this.#power = 0;
        this.#powerDirection = 1;
      }
      if (this.#context.input.consumePressed("primary")) {
        this.#lockedPower = Math.max(0.12, this.#power);
        this.#accuracy = 1;
        this.#phase = "accuracy";
        this.#context.audio.tone({ frequency: 380, duration: 0.04, volume: 0.025 });
      }
      return;
    }

    this.#accuracy -= delta * 1.65;
    if (this.#context.input.consumePressed("primary") || this.#accuracy <= -1) {
      this.#accuracy = Math.max(-1, this.#accuracy);
      this.#strikeBall();
    }
  }

  render() {
    this.#draw.setTransform(1, 0, 0, 1, 0, 0);
    this.#draw.imageSmoothingEnabled = false;
    if (this.#mode === "title") {
      this.#renderTitle();
      return;
    }
    if (this.#puttingView) this.#renderPuttingView();
    else this.#renderCourse();
    this.#renderHud();
    if (this.#mode === "holeComplete") this.#renderResult();
    if (this.#mode === "roundComplete") this.#renderRoundComplete();
  }

  reset() {
    this.#mode = "title";
    this.#holeIndex = 0;
    this.#scores = [];
    this.#ball = createBall(HOLES[0].tee);
    this.#elapsed = 0;
    this.#puttingView = false;
  }

  #startRound() {
    this.#scores = [];
    this.#holeIndex = 0;
    this.#setupHole();
    this.#context.audio.tone({ frequency: 392, duration: 0.07, volume: 0.04 });
    window.setTimeout(() => this.#context.audio.tone({ frequency: 523, duration: 0.11, volume: 0.035 }), 70);
  }

  #setupHole() {
    const hole = this.#hole;
    this.#mode = "playing";
    this.#phase = "aiming";
    this.#ball = createBall(hole.tee);
    this.#shotOrigin = { ...hole.tee };
    this.#surface = "tee";
    this.#puttingView = false;
    this.#aim = Math.atan2(hole.cup.x - hole.tee.x, hole.cup.y - hole.tee.y);
    this.#strokes = 0;
    this.#camera = { x: hole.tee.x, y: hole.tee.y - 8 };
    this.#setSuggestedClub();
    this.#showMessage(`${this.#holeIndex + 1}  ${hole.name}`, 1.8);
  }

  #advanceHole() {
    if (this.#holeIndex < HOLES.length - 1) {
      this.#holeIndex += 1;
      this.#setupHole();
      return;
    }

    const score = this.#relativeScore;
    if (this.#bestScore === null || score < this.#bestScore) {
      this.#bestScore = score;
      this.#context.storage.set("bestScore", score);
    }
    this.#mode = "roundComplete";
    this.#context.audio.tone({ frequency: 523, duration: 0.12, volume: 0.04 });
    window.setTimeout(() => this.#context.audio.tone({ frequency: 659, duration: 0.12, volume: 0.04 }), 120);
    window.setTimeout(() => this.#context.audio.tone({ frequency: 784, duration: 0.24, volume: 0.04 }), 240);
  }

  #strikeBall() {
    const club = CLUBS[this.#clubIndex];
    this.#shotOrigin = { x: this.#ball.x, y: this.#ball.y };
    this.#strokes += 1;
    launchBall(this.#ball, club, this.#aim, this.#lockedPower, this.#accuracy, this.#surface);
    this.#phase = "moving";
    this.#messageTime = 0;
    this.#context.audio.noise(0.07, club.putter ? 0.018 : 0.05);
    this.#context.audio.tone({
      frequency: club.putter ? 520 : 145,
      endFrequency: club.putter ? 360 : 75,
      duration: club.putter ? 0.06 : 0.12,
      type: club.putter ? "square" : "sawtooth",
      volume: club.putter ? 0.025 : 0.045,
    });
  }

  #setSuggestedClub() {
    this.#clubIndex = suggestedClub(distanceBetween(this.#ball, this.#hole.cup), this.#surface);
    this.#aim = Math.atan2(this.#hole.cup.x - this.#ball.x, this.#hole.cup.y - this.#ball.y);
  }

  #showMessage(message: string, duration: number) {
    this.#message = message;
    this.#messageTime = duration;
  }

  get #hole(): Hole {
    return HOLES[this.#holeIndex];
  }

  get #relativeScore() {
    return this.#scores.reduce((total, strokes, index) => total + strokes - HOLES[index].par, 0);
  }

  #worldToScreen(point: Vec2, z = 0) {
    return {
      x: Math.round(SCREEN_WIDTH / 2 + (point.x - this.#camera.x) * WORLD_SCALE),
      y: Math.round(190 - (point.y - this.#camera.y) * WORLD_SCALE - z * 0.72),
    };
  }

  #renderTitle() {
    const draw = this.#draw;
    draw.fillStyle = COLORS.sky;
    draw.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    draw.fillStyle = "#70967b";
    draw.beginPath();
    draw.moveTo(0, 126);
    draw.lineTo(48, 78);
    draw.lineTo(82, 116);
    draw.lineTo(132, 66);
    draw.lineTo(184, 118);
    draw.lineTo(234, 82);
    draw.lineTo(320, 132);
    draw.lineTo(320, 240);
    draw.lineTo(0, 240);
    draw.fill();
    draw.fillStyle = COLORS.rough;
    draw.fillRect(0, 123, 320, 117);
    draw.fillStyle = COLORS.fairway;
    draw.beginPath();
    draw.moveTo(86, 240);
    draw.lineTo(140, 122);
    draw.lineTo(202, 122);
    draw.lineTo(250, 240);
    draw.fill();
    draw.fillStyle = COLORS.green;
    draw.beginPath();
    draw.ellipse(171, 134, 36, 13, 0, 0, Math.PI * 2);
    draw.fill();
    this.#drawFlag(228, 132, 1);

    draw.fillStyle = COLORS.ink;
    draw.fillRect(48, 19, 224, 62);
    draw.strokeStyle = COLORS.cream;
    draw.lineWidth = 3;
    draw.strokeRect(52, 23, 216, 54);
    this.#text("GOLF", 160, 65, 38, "center", COLORS.cream);
    this.#text("THREE HOLE TOUR", 160, 96, 10, "center", COLORS.ink);

    this.#drawGolfer(60, 194, 1);
    draw.fillStyle = "rgb(23 43 44 / 92%)";
    draw.fillRect(88, 130, 220, 102);
    draw.strokeStyle = COLORS.cream;
    draw.lineWidth = 2;
    draw.strokeRect(92, 134, 212, 94);
    this.#text("HOW TO PLAY", 198, 151, 10, "center", COLORS.cream);
    this.#text("ARROWS : AIM + CLUB", 104, 168, 8, "left", "#b9ab86");
    this.#text("SPACE / ENTER / Z : SWING", 104, 181, 7, "left", "#b9ab86");
    this.#text("SWING 3X EACH SHOT", 104, 194, 8, "left", COLORS.cream);
    this.#text("SET POWER, THEN ACCURACY", 104, 207, 7, "left", "#b9ab86");
    this.#text("ESC : PAUSE", 104, 220, 7, "left", "#b9ab86");
    if (Math.floor(this.#elapsed * 2) % 2 === 0) this.#text("PRESS SWING", 298, 220, 7, "right", COLORS.cream);
    if (this.#bestScore !== null) this.#text(`BEST ${this.#formatRelative(this.#bestScore)}`, 307, 236, 8, "right", COLORS.ink);
  }

  #renderCourse() {
    const draw = this.#draw;
    const hole = this.#hole;
    draw.fillStyle = COLORS.rough;
    draw.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    for (let y = HUD_HEIGHT; y < METER_TOP; y += 12) {
      draw.fillStyle = (Math.floor((y + this.#camera.y * 0.7) / 12) % 2 === 0) ? COLORS.roughDark : COLORS.rough;
      draw.fillRect(0, y, SCREEN_WIDTH, 6);
    }

    const minY = Math.max(-8, this.#camera.y - 48);
    const maxY = Math.min(hole.length + 20, this.#camera.y + 174);
    const fairwayPath = this.#buildFairwayPath(minY, maxY);
    draw.fillStyle = COLORS.fairway;
    draw.fill(fairwayPath);
    draw.save();
    draw.clip(fairwayPath);
    for (let y = Math.floor(minY / 14) * 14; y < maxY; y += 14) {
      const screen = this.#worldToScreen({ x: 0, y });
      draw.fillStyle = COLORS.fairwayLight;
      draw.fillRect(0, screen.y - 7, SCREEN_WIDTH, 7);
    }
    draw.restore();

    this.#drawHazards(hole);
    this.#drawTrees(hole, minY, maxY);
    const cup = this.#worldToScreen(hole.cup);
    if (cup.y > HUD_HEIGHT - 18 && cup.y < METER_TOP + 20) this.#drawFlag(cup.x, cup.y, 1);

    if (this.#phase !== "moving") this.#drawAimGuide();
    const ground = this.#worldToScreen(this.#ball);
    const airborne = this.#worldToScreen(this.#ball, this.#ball.z);
    draw.fillStyle = "rgb(20 30 24 / 40%)";
    draw.fillRect(ground.x - 3, ground.y - 1, 7, 3);
    if (this.#phase !== "moving" && this.#surface !== "green") {
      this.#drawGolfer(ground.x - 12, ground.y + 5, 1);
    }
    draw.fillStyle = COLORS.white;
    draw.fillRect(airborne.x - 2, airborne.y - 2, 4, 4);
    draw.fillStyle = "#a89774";
    draw.fillRect(airborne.x - 1, airborne.y + 2, 3, 1);

    if (this.#messageTime > 0) {
      const width = Math.min(280, 18 + this.#message.length * 7);
      draw.fillStyle = "rgb(23 43 44 / 88%)";
      draw.fillRect(160 - width / 2, 43, width, 20);
      this.#text(this.#message, 160, 57, 10, "center", COLORS.cream);
    }
  }

  #renderPuttingView() {
    const draw = this.#draw;
    const hole = this.#hole;
    const scale = 4.15;
    const center = { x: 160, y: 121 };
    const toGreen = (point: Vec2) => ({
      x: Math.round(center.x + (point.x - hole.green.x) * scale),
      y: Math.round(center.y - (point.y - hole.green.y) * scale),
    });

    draw.fillStyle = COLORS.roughDark;
    draw.fillRect(0, HUD_HEIGHT, SCREEN_WIDTH, METER_TOP - HUD_HEIGHT);
    for (let y = HUD_HEIGHT; y < METER_TOP; y += 12) {
      draw.fillStyle = y % 24 === 0 ? COLORS.rough : COLORS.roughDark;
      draw.fillRect(0, y, SCREEN_WIDTH, 6);
    }

    for (const bunker of hole.bunkers) {
      const point = toGreen(bunker);
      draw.fillStyle = COLORS.bunkerDark;
      draw.beginPath();
      draw.ellipse(point.x + 2, point.y + 2, bunker.radiusX * scale, bunker.radiusY * scale, 0, 0, Math.PI * 2);
      draw.fill();
      draw.fillStyle = COLORS.bunker;
      draw.beginPath();
      draw.ellipse(point.x, point.y, bunker.radiusX * scale, bunker.radiusY * scale, 0, 0, Math.PI * 2);
      draw.fill();
    }

    draw.fillStyle = COLORS.green;
    draw.beginPath();
    draw.ellipse(center.x, center.y, hole.green.radiusX * scale, hole.green.radiusY * scale, 0, 0, Math.PI * 2);
    draw.fill();
    draw.save();
    draw.clip();
    draw.fillStyle = "rgb(255 248 220 / 7%)";
    for (let x = center.x - 80; x < center.x + 80; x += 16) draw.fillRect(x, HUD_HEIGHT, 8, METER_TOP - HUD_HEIGHT);
    for (let y = center.y - 72; y < center.y + 72; y += 16) draw.fillRect(0, y, SCREEN_WIDTH, 7);
    draw.restore();

    const cup = toGreen(hole.cup);
    this.#drawFlag(cup.x, cup.y, 1);
    draw.fillStyle = COLORS.ink;
    draw.fillRect(cup.x - 3, cup.y - 2, 7, 4);

    const ball = toGreen(this.#ball);
    if (this.#phase !== "moving") {
      const length = 50;
      const end = {
        x: ball.x + Math.sin(this.#aim) * length,
        y: ball.y - Math.cos(this.#aim) * length,
      };
      draw.save();
      draw.strokeStyle = COLORS.white;
      draw.lineWidth = 1;
      draw.setLineDash([4, 3]);
      draw.beginPath();
      draw.moveTo(ball.x, ball.y);
      draw.lineTo(end.x, end.y);
      draw.stroke();
      draw.setLineDash([]);
      draw.fillStyle = COLORS.red;
      draw.fillRect(Math.round(end.x) - 2, Math.round(end.y) - 2, 5, 5);
      draw.restore();
      this.#drawGolfer(ball.x - 13, ball.y + 6, 1);
    }

    draw.fillStyle = "rgb(23 43 44 / 35%)";
    draw.fillRect(ball.x - 3, ball.y + 2, 7, 3);
    draw.fillStyle = COLORS.white;
    draw.fillRect(ball.x - 2, ball.y - 2, 5, 5);
    this.#drawSlopeIndicator(292, 48);

    if (this.#messageTime > 0) {
      const width = Math.min(280, 18 + this.#message.length * 7);
      draw.fillStyle = "rgb(23 43 44 / 88%)";
      draw.fillRect(160 - width / 2, 82, width, 20);
      this.#text(this.#message, 160, 96, 10, "center", COLORS.cream);
    }
  }

  #drawSlopeIndicator(x: number, y: number) {
    const draw = this.#draw;
    const slope = this.#hole.greenSlope;
    const length = 13;
    const magnitude = Math.hypot(slope.x, slope.y) || 1;
    const dx = (slope.x / magnitude) * length;
    const dy = -(slope.y / magnitude) * length;
    draw.strokeStyle = COLORS.cream;
    draw.lineWidth = 2;
    draw.beginPath();
    draw.moveTo(x - dx / 2, y - dy / 2);
    draw.lineTo(x + dx / 2, y + dy / 2);
    draw.stroke();
    draw.fillStyle = COLORS.red;
    draw.fillRect(Math.round(x + dx / 2) - 2, Math.round(y + dy / 2) - 2, 4, 4);
  }

  #buildFairwayPath(minY: number, maxY: number) {
    const left: Vec2[] = [];
    const right: Vec2[] = [];
    for (let y = minY; y <= maxY + 5; y += 5) {
      const section = fairwayAt(this.#hole.fairway, Math.max(0, Math.min(this.#hole.length, y)));
      left.push(this.#worldToScreen({ x: section.x - section.width / 2, y }));
      right.push(this.#worldToScreen({ x: section.x + section.width / 2, y }));
    }
    const path = new Path2D();
    if (left.length === 0) return path;
    path.moveTo(left[0].x, left[0].y);
    left.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    right.reverse().forEach((point) => path.lineTo(point.x, point.y));
    path.closePath();
    return path;
  }

  #drawHazards(hole: Hole) {
    const draw = this.#draw;
    for (const hazard of hole.water) {
      draw.fillStyle = COLORS.water;
      if (hazard.kind === "ellipse") {
        const center = this.#worldToScreen(hazard);
        draw.beginPath();
        draw.ellipse(center.x, center.y, hazard.radiusX * WORLD_SCALE, hazard.radiusY * WORLD_SCALE, 0, 0, Math.PI * 2);
        draw.fill();
      } else {
        const topLeft = this.#worldToScreen({ x: hazard.x - hazard.width / 2, y: hazard.y + hazard.height / 2 });
        draw.fillRect(topLeft.x, topLeft.y, hazard.width * WORLD_SCALE, hazard.height * WORLD_SCALE);
      }
    }
    for (const bunker of hole.bunkers) {
      const center = this.#worldToScreen(bunker);
      draw.fillStyle = COLORS.bunkerDark;
      draw.beginPath();
      draw.ellipse(center.x + 1, center.y + 2, bunker.radiusX * WORLD_SCALE, bunker.radiusY * WORLD_SCALE, 0, 0, Math.PI * 2);
      draw.fill();
      draw.fillStyle = COLORS.bunker;
      draw.beginPath();
      draw.ellipse(center.x, center.y, bunker.radiusX * WORLD_SCALE, bunker.radiusY * WORLD_SCALE, 0, 0, Math.PI * 2);
      draw.fill();
    }

    const green = this.#worldToScreen(hole.green);
    draw.fillStyle = COLORS.green;
    draw.beginPath();
    draw.ellipse(green.x, green.y, hole.green.radiusX * WORLD_SCALE, hole.green.radiusY * WORLD_SCALE, 0, 0, Math.PI * 2);
    draw.fill();
  }

  #drawTrees(hole: Hole, minY: number, maxY: number) {
    const start = Math.max(8, Math.floor(minY / 24) * 24);
    for (let y = start; y < Math.min(maxY, hole.length + 15); y += 24) {
      const section = fairwayAt(hole.fairway, Math.max(0, Math.min(hole.length, y)));
      for (const side of [-1, 1]) {
        const seed = Math.abs(Math.sin((y + 13 * side + this.#holeIndex * 31) * 12.9898));
        const x = section.x + side * (section.width / 2 + 10 + seed * 9);
        const point = this.#worldToScreen({ x, y: y + seed * 7 });
        if (point.y > HUD_HEIGHT && point.y < METER_TOP) this.#drawTree(point.x, point.y);
      }
    }
  }

  #drawTree(x: number, y: number) {
    const draw = this.#draw;
    draw.fillStyle = "#69583d";
    draw.fillRect(x - 2, y - 2, 4, 8);
    draw.fillStyle = "#284f38";
    draw.fillRect(x - 7, y - 13, 14, 12);
    draw.fillRect(x - 5, y - 17, 10, 5);
    draw.fillStyle = "#3d6a43";
    draw.fillRect(x - 5, y - 14, 8, 5);
  }

  #drawAimGuide() {
    const draw = this.#draw;
    const start = this.#worldToScreen(this.#ball);
    const length = Math.min(58, CLUBS[this.#clubIndex].distance * 0.38);
    const end = {
      x: start.x + Math.sin(this.#aim) * length,
      y: start.y - Math.cos(this.#aim) * length,
    };
    draw.save();
    draw.strokeStyle = COLORS.white;
    draw.lineWidth = 1;
    draw.setLineDash([4, 3]);
    draw.beginPath();
    draw.moveTo(start.x, start.y);
    draw.lineTo(end.x, end.y);
    draw.stroke();
    draw.setLineDash([]);
    draw.fillStyle = COLORS.red;
    draw.fillRect(Math.round(end.x) - 2, Math.round(end.y) - 2, 5, 5);
    draw.restore();
  }

  #drawGolfer(x: number, y: number, scale: number) {
    const draw = this.#draw;
    const rect = (color: string, rx: number, ry: number, width: number, height: number) => {
      draw.fillStyle = color;
      draw.fillRect(Math.round(x + rx * scale), Math.round(y + ry * scale), width * scale, height * scale);
    };
    rect("rgb(23 43 44 / 35%)", -7, 4, 19, 3);
    rect(COLORS.red, -5, -25, 10, 3);
    rect(COLORS.red, 3, -23, 6, 2);
    rect("#5a4030", -5, -22, 3, 7);
    rect(COLORS.cream, -2, -22, 7, 7);
    rect(COLORS.ink, 4, -20, 2, 2);
    rect(COLORS.cream, -4, -15, 9, 3);
    rect(COLORS.red, -5, -12, 11, 8);
    rect(COLORS.cream, 2, -11, 4, 3);
    rect(COLORS.cream, 5, -9, 5, 3);
    rect(COLORS.ink, -4, -4, 11, 3);
    rect("#294b59", -4, -1, 4, 7);
    rect("#294b59", 4, -1, 4, 7);
    rect(COLORS.ink, -6, 6, 7, 2);
    rect(COLORS.ink, 4, 6, 7, 2);

    draw.save();
    draw.strokeStyle = COLORS.cream;
    draw.lineWidth = Math.max(1, scale);
    draw.lineCap = "square";
    draw.beginPath();
    draw.moveTo(x + 3 * scale, y - 10 * scale);
    draw.lineTo(x + 9 * scale, y - 7 * scale);
    draw.lineTo(x + 12 * scale, y + 2 * scale);
    draw.stroke();
    draw.strokeStyle = COLORS.ink;
    draw.lineWidth = Math.max(1, scale);
    draw.beginPath();
    draw.moveTo(x + 12 * scale, y + 2 * scale);
    draw.lineTo(x + 12 * scale, y + 9 * scale);
    draw.lineTo(x + 16 * scale, y + 9 * scale);
    draw.stroke();
    draw.restore();
  }

  #drawFlag(x: number, y: number, scale: number) {
    const draw = this.#draw;
    draw.fillStyle = COLORS.ink;
    draw.fillRect(x, y - 22 * scale, Math.max(1, scale), 23 * scale);
    draw.fillStyle = COLORS.red;
    draw.fillRect(x + scale, y - 22 * scale, 9 * scale, 6 * scale);
    draw.fillStyle = "#253b32";
    draw.fillRect(x - 3 * scale, y - scale, 7 * scale, 2 * scale);
  }

  #renderHud() {
    const draw = this.#draw;
    const remaining = Math.round(distanceBetween(this.#ball, this.#hole.cup));
    draw.fillStyle = COLORS.ink;
    draw.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT);
    draw.fillRect(0, METER_TOP, SCREEN_WIDTH, SCREEN_HEIGHT - METER_TOP);
    draw.fillStyle = COLORS.cream;
    draw.fillRect(0, HUD_HEIGHT - 2, SCREEN_WIDTH, 2);
    draw.fillRect(0, METER_TOP, SCREEN_WIDTH, 2);

    this.#text(`${this.#holeIndex + 1}H  PAR ${this.#hole.par}`, 8, 14, 10, "left", COLORS.cream);
    this.#text(`SHOT ${this.#strokes + (this.#phase === "moving" ? 0 : 1)}`, 8, 28, 9, "left", "#b9ab86");
    this.#text(`${remaining}Y`, 160, 21, 16, "center", COLORS.cream);
    this.#text(`WIND ${this.#hole.wind.speed}`, 308, 14, 9, "right", COLORS.cream);
    const windAngle = Math.atan2(this.#hole.wind.y, this.#hole.wind.x);
    const wx = 288;
    const wy = 25;
    draw.strokeStyle = COLORS.cream;
    draw.beginPath();
    draw.moveTo(wx, wy);
    draw.lineTo(wx + Math.cos(windAngle) * 13, wy - Math.sin(windAngle) * 8);
    draw.stroke();

    const club = CLUBS[this.#clubIndex];
    this.#text(club.shortName, 8, 229, 14, "left", COLORS.cream);
    this.#text(this.#surface.toUpperCase(), 311, 229, 8, "right", "#b9ab86");
    const meterX = 48;
    const meterY = 218;
    const meterWidth = 210;
    draw.fillStyle = "#433f35";
    draw.fillRect(meterX, meterY, meterWidth, 10);
    draw.fillStyle = COLORS.red;
    draw.fillRect(meterX + meterWidth / 2 - 6, meterY, 12, 10);
    draw.strokeStyle = COLORS.cream;
    draw.strokeRect(meterX - 1, meterY - 1, meterWidth + 2, 12);

    if (club.putter && this.#phase !== "moving") {
      const targetPower = Math.min(1, distanceBetween(this.#ball, this.#hole.cup) / club.distance);
      const target = meterX + targetPower * meterWidth;
      draw.fillStyle = "#b9ab86";
      draw.fillRect(Math.round(target) - 1, meterY - 3, 2, 16);
    }

    if (this.#phase === "power") {
      draw.fillStyle = COLORS.green;
      draw.fillRect(meterX, meterY, this.#power * meterWidth, 10);
      draw.fillStyle = COLORS.white;
      draw.fillRect(meterX + this.#power * meterWidth - 1, meterY - 3, 3, 16);
    } else if (this.#phase === "accuracy") {
      draw.fillStyle = COLORS.green;
      draw.fillRect(meterX, meterY, this.#lockedPower * meterWidth, 10);
      const marker = meterX + ((this.#accuracy + 1) / 2) * meterWidth;
      draw.fillStyle = COLORS.white;
      draw.fillRect(marker - 1, meterY - 3, 3, 16);
    }
  }

  #renderResult() {
    const score = this.#strokes - this.#hole.par;
    this.#overlayPanel();
    this.#text(this.#scoreName(score), 160, 94, 24, "center", COLORS.cream);
    this.#text(`${this.#strokes} STROKES`, 160, 120, 12, "center", COLORS.cream);
    this.#text("NEXT HOLE", 160, 151, 10, "center", "#b9ab86");
  }

  #renderRoundComplete() {
    this.#overlayPanel(62, 46, 196, 126);
    this.#text("ROUND COMPLETE", 160, 79, 19, "center", COLORS.cream);
    HOLES.forEach((hole, index) => {
      this.#text(`${index + 1}  PAR ${hole.par}`, 93, 103 + index * 17, 9, "left", "#b9ab86");
      this.#text(String(this.#scores[index]), 225, 103 + index * 17, 11, "right", COLORS.cream);
    });
    this.#text(`TOTAL  ${this.#formatRelative(this.#relativeScore)}`, 160, 158, 13, "center", COLORS.cream);
    this.#text("PLAY AGAIN", 160, 188, 9, "center", COLORS.ink);
  }

  #overlayPanel(x = 63, y = 67, width = 194, height = 102) {
    const draw = this.#draw;
    draw.fillStyle = COLORS.ink;
    draw.fillRect(x, y, width, height);
    draw.strokeStyle = COLORS.cream;
    draw.lineWidth = 2;
    draw.strokeRect(x + 4, y + 4, width - 8, height - 8);
  }

  #scoreName(score: number) {
    if (score <= -2) return "EAGLE";
    if (score === -1) return "BIRDIE";
    if (score === 0) return "PAR";
    if (score === 1) return "BOGEY";
    if (score === 2) return "DOUBLE BOGEY";
    return `${score > 0 ? "+" : ""}${score}`;
  }

  #formatRelative(score: number) {
    return score === 0 ? "E" : score > 0 ? `+${score}` : String(score);
  }

  #text(text: string, x: number, y: number, size: number, align: CanvasTextAlign, color: string) {
    const draw = this.#draw;
    draw.fillStyle = color;
    draw.font = `${size}px "JMW Pixel", ui-monospace, monospace`;
    draw.textAlign = align;
    draw.textBaseline = "alphabetic";
    draw.fillText(text, Math.round(x), Math.round(y));
  }
}
