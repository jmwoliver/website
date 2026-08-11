import type { GameContext, GameInstance, GameModule } from "../runtime/types";

class DiagnosticGame implements GameInstance {
  readonly #context: GameContext;
  #x: number;
  #y: number;
  #hue = 0;

  constructor(context: GameContext) {
    this.#context = context;
    this.#x = context.resolution.width / 2;
    this.#y = context.resolution.height / 2;
  }

  update(delta: number) {
    const speed = 70 * delta;
    this.#x += (Number(this.#context.input.isDown("right")) - Number(this.#context.input.isDown("left"))) * speed;
    this.#y += (Number(this.#context.input.isDown("down")) - Number(this.#context.input.isDown("up"))) * speed;
    if (this.#context.input.consumePressed("primary")) {
      this.#hue = (this.#hue + 70) % 360;
      this.#context.audio.tone({ frequency: 440, duration: 0.05 });
      this.#context.storage.set("lastHue", this.#hue);
    }
  }

  render() {
    const draw = this.#context.context;
    draw.fillStyle = "#172b2c";
    draw.fillRect(0, 0, this.#context.resolution.width, this.#context.resolution.height);
    draw.fillStyle = `hsl(${this.#hue} 60% 65%)`;
    draw.fillRect(Math.round(this.#x) - 6, Math.round(this.#y) - 6, 12, 12);
  }

  reset() {
    this.#x = this.#context.resolution.width / 2;
    this.#y = this.#context.resolution.height / 2;
  }
}

export const createGame: GameModule["createGame"] = (context) => new DiagnosticGame(context);
