import { findGame } from "../catalog";
import { BrowserGameAudio } from "./audio";
import { InputManager } from "./input";
import { LocalGameStorage } from "./storage";
import type { GameInstance } from "./types";

type ConsoleState = "off" | "booting" | "launcher" | "loading" | "playing" | "paused" | "error";

const FIXED_STEP = 1 / 60;
const BOOT_DURATION = 620;

export class GameHost {
  readonly #root: HTMLElement;
  readonly #canvas: HTMLCanvasElement;
  readonly #context: CanvasRenderingContext2D;
  readonly #abort = new AbortController();
  readonly #audio = new BrowserGameAudio();
  readonly #input: InputManager;
  readonly #slug?: string;
  #game?: GameInstance;
  #frame?: number;
  #bootTimer?: number;
  #lastTime = 0;
  #accumulator = 0;
  #pausedByVisibility = false;
  #state: ConsoleState = "booting";

  constructor(root: HTMLElement) {
    this.#root = root;
    const canvas = root.querySelector<HTMLCanvasElement>("[data-game-canvas]");
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) throw new Error("The game console could not create its display.");
    this.#canvas = canvas;
    this.#context = context;
    this.#context.imageSmoothingEnabled = false;
    this.#slug = root.dataset.gameSlug || undefined;
    this.#input = new InputManager(root, this.#abort.signal, () => void this.#audio.unlock());
    this.#bindConsoleControls();
    this.#setState("booting", "Console starting");
    this.#bootTimer = window.setTimeout(() => void this.#finishBoot(), BOOT_DURATION);
  }

  #bindConsoleControls() {
    const signal = this.#abort.signal;
    this.#root.querySelector<HTMLButtonElement>("[data-console-power]")?.addEventListener(
      "click",
      () => {
        void this.#audio.unlock();
        this.#state === "off" ? this.#powerOn() : this.#powerOff();
      },
      { signal },
    );
    this.#root.querySelector<HTMLButtonElement>("[data-console-resume]")?.addEventListener(
      "click",
      () => this.#resume(),
      { signal },
    );
    this.#root.querySelector<HTMLButtonElement>("[data-console-reset]")?.addEventListener(
      "click",
      () => {
        this.#game?.reset?.();
        this.#resume();
      },
      { signal },
    );
    this.#root.addEventListener(
      "keydown",
      (event) => {
        if (event.code !== "Escape" || !this.#game) return;
        event.preventDefault();
        this.#state === "paused" ? this.#resume() : this.#pause(false);
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden && this.#state === "playing") {
          this.#pausedByVisibility = true;
          this.#pause(true);
        } else if (!document.hidden && this.#pausedByVisibility) {
          this.#pausedByVisibility = false;
          this.#resume();
        }
      },
      { signal },
    );
    window.addEventListener("pagehide", () => this.destroy(), { signal, once: true });
  }

  async #finishBoot() {
    this.#bootTimer = undefined;
    if (this.#state === "off") return;
    if (this.#game) {
      this.#resume();
      return;
    }
    if (!this.#slug) {
      this.#setState("launcher", "Game launcher ready");
      return;
    }
    await this.#loadGame(this.#slug);
  }

  async #loadGame(slug: string) {
    const entry = findGame(slug);
    if (!entry) {
      this.#showError("GAME NOT FOUND");
      return;
    }
    this.#setState("loading", `Loading ${entry.title}`);
    this.#canvas.width = entry.resolution.width;
    this.#canvas.height = entry.resolution.height;
    this.#context.imageSmoothingEnabled = false;

    try {
      const module = await entry.load();
      if (this.#abort.signal.aborted) return;
      this.#game = await module.createGame({
        canvas: this.#canvas,
        context: this.#context,
        input: this.#input,
        audio: this.#audio,
        storage: new LocalGameStorage(entry.slug),
        signal: this.#abort.signal,
        resolution: entry.resolution,
      });
      if (this.#abort.signal.aborted) {
        this.#game.destroy?.();
        return;
      }
      this.#startLoop();
      this.#setState("playing", `${entry.title} playing`);
      this.#root.focus({ preventScroll: true });
    } catch (error) {
      console.error(error);
      this.#showError("GAME FAILED TO LOAD");
    }
  }

  #startLoop() {
    if (!this.#game || this.#frame !== undefined) return;
    this.#lastTime = performance.now();
    this.#accumulator = 0;
    this.#frame = requestAnimationFrame(this.#tick);
  }

  readonly #tick = (time: number) => {
    this.#frame = undefined;
    if (!this.#game || this.#state !== "playing") return;
    const elapsed = Math.min(0.1, Math.max(0, (time - this.#lastTime) / 1000));
    this.#lastTime = time;
    this.#accumulator += elapsed;
    while (this.#accumulator >= FIXED_STEP) {
      this.#game.update(FIXED_STEP);
      this.#input.finishUpdate();
      this.#accumulator -= FIXED_STEP;
    }
    this.#game.render(this.#accumulator / FIXED_STEP);
    this.#frame = requestAnimationFrame(this.#tick);
  };

  #pause(fromVisibility: boolean) {
    if (!this.#game || this.#state !== "playing") return;
    if (this.#frame !== undefined) cancelAnimationFrame(this.#frame);
    this.#frame = undefined;
    this.#input.reset();
    this.#game.pause?.();
    this.#setState("paused", fromVisibility ? "Game paused while the page is hidden" : "Game paused");
  }

  #resume() {
    if (!this.#game || (this.#state !== "paused" && this.#state !== "booting")) return;
    this.#game.resume?.();
    this.#setState("playing", "Game resumed");
    this.#startLoop();
    this.#root.focus({ preventScroll: true });
  }

  #powerOff() {
    if (this.#bootTimer !== undefined) window.clearTimeout(this.#bootTimer);
    this.#bootTimer = undefined;
    if (this.#frame !== undefined) cancelAnimationFrame(this.#frame);
    this.#frame = undefined;
    this.#input.reset();
    this.#game?.pause?.();
    this.#setState("off", "Console powered off");
  }

  #powerOn() {
    this.#setState("booting", "Console starting");
    this.#bootTimer = window.setTimeout(() => void this.#finishBoot(), BOOT_DURATION);
  }

  #showError(message: string) {
    const error = this.#root.querySelector<HTMLElement>("[data-console-error-message]");
    if (error) error.textContent = message;
    this.#setState("error", message);
  }

  #setState(state: ConsoleState, status: string) {
    this.#state = state;
    this.#root.dataset.state = state;
    const statusElement = this.#root.querySelector<HTMLElement>("[data-console-status]");
    if (statusElement) statusElement.textContent = status;
    const power = this.#root.querySelector<HTMLButtonElement>("[data-console-power]");
    power?.setAttribute("aria-pressed", String(state !== "off"));
  }

  destroy() {
    if (this.#abort.signal.aborted) return;
    if (this.#bootTimer !== undefined) window.clearTimeout(this.#bootTimer);
    if (this.#frame !== undefined) cancelAnimationFrame(this.#frame);
    this.#frame = undefined;
    this.#game?.destroy?.();
    this.#input.reset();
    this.#audio.destroy();
    this.#abort.abort();
  }
}

export function bootGameConsoles() {
  document.querySelectorAll<HTMLElement>("[data-game-console]").forEach((root) => {
    try {
      new GameHost(root);
    } catch (error) {
      console.error(error);
      root.dataset.state = "error";
      const message = root.querySelector<HTMLElement>("[data-console-error-message]");
      if (message) message.textContent = "DISPLAY FAILED TO START";
    }
  });
}
